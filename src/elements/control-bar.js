/* eslint-disable no-throw-literal, no-empty, no-unused-vars */
/** -------------------------------------------------------------------------------------------------------------------
 *                                          VIDEO CONTROLS
 *
 *  A class that renders the control bar and associated elements for interacting with a video. This class is used by the
 *  Media Player and overlaid over the video. It is hidden after a short delay if there is no mouse activity within
 * the boundaries of the video container. It is then shown when mouse activity resumes.
 *--------------------------------------------------------------------------------------------------------------------*/

import Extensions           from "@akwaba/object-extensions";
import HTML                 from "@akwaba/html";
import DOM                  from "@akwaba/dom";
import Event                from "@akwaba/events";
import * as MediaDetector   from "../media/media-detector";

import {
    INVALID_MEDIA_CONTAINER,
    DELEGATE_METHODS_NOT_IMPLEMENTED
} from "../constants/media-error-event-type";
import {
    PLAYING,
    PAUSED
} from "../constants/media-player-state";

import {
    formatTime,
    formatRemainingTime
} from "../utils/media-utils";
import {
    PLAY,
    PAUSE
} from "../constants/playback-event-type";

const ENABLE = "enable";
const DISABLE = "disable";


export default class ControlBar {

    static requiredMethods = [
        "onPlaybackActions",
        "beginSeeking",
        "endSeeking",
        "onVolumeChanged",
        "handleFullscreenMode"
    ];

    constructor(options = {}) {
        this.options = Object.assign({}, ControlBar.defaultOptions, options);
        this.id = this.options.id || `akwaba-video-controls-${Extensions.generateUUID()}`;
        this.container = this.options.container;
        const isValidContainer = this.container && this.container.nodeType === HTML.nodeType.ELEMENT_NODE;

        if (!isValidContainer) {
            throw new Error(INVALID_MEDIA_CONTAINER);
        }

        this.delegate = this.options.delegate;
        this.render();
    }


    /**
     * Renders the view of this ControlBar instance and initializes its interactive elements
     */
    render() {
        const proceed = !!(this.delegate && Extensions.implementsInterface(this.delegate, ControlBar));

        if (!proceed) {
            const message = ControlBar.requiredMethods.join(", ");
            throw {
                error: DELEGATE_METHODS_NOT_IMPLEMENTED,
                message
            };
        }

        let className = `akwaba-media-controls ${this.options.theme}`;

        if (MediaDetector.isCSSAvailable("backdrop-filter")) {
            className = `${className} has-blur`;
        }

        this.element = HTML.createElement("div", {
            id: this.id,
            className
        });
        HTML.setContent(this.element, ControlBar.defaultOptions.MARKUP);

        this.progressBar = DOM.find(".progress-slider-track", this.element);
        this.progressBarHandle = DOM.find(".progress-slider-handle", this.element);
        this.percentageLoaded = 0;

        this.volumeIcon = DOM.find(".volume-icon", this.element);
        this.volumeTrack = DOM.find(".volume-slider-track", this.element);
        this.volumeHandle = DOM.find(".volume-slider-handle", this.element);
        this.volumeFiller = DOM.find(".volume-filler", this.element);
        this.settingsContainer = DOM.find(".setting-items", this.element);
        this.playPauseButton = DOM.find(".play", this.element);

        this.fullscreenButton = DOM.find(".fullscreen", this.element);
        this.elapsedContent = DOM.find(".elapsed", this.element);
        this.remainingContent = DOM.find(".remaining", this.element);
        this.bufferedContent = DOM.find(".buffered", this.element);
        this.playedContent = DOM.find(".played", this.element);

        this.container.appendChild(this.element);
        this.toggleControls(DISABLE).setVolumeLevel(0.5);

        HTML.setStyle(this.element, {
            opacity: 0
        });

        this.activateProgressBar()
            .activateVolumeControl()
            .enterNormalPlaybackMode()
            .registerEvents();

        return this;
    }


    /**
     * Enables or disables the elements of this control bar element
     *
     * @param {String} visibility       a flag that specifies whether to enable or disable the elements
     */
    toggleControls(visibility) {
        this.enabled = visibility === ENABLE;
        const buttons = DOM.select("button", this.element);

        if (this.enabled) {
            HTML.removeClassName(this.element, "disabled");
            buttons.forEach((btn) => {
                btn.disabled = false;
            });
        } else {
            HTML.addClassName(this.element, "disabled");
            buttons.forEach((btn) => {
                btn.disabled = true;
            });
        }

        return this;
    }


    /**
     * Disables the fullscreen button
     */
    disableFullscreenButton() {
        this.fullscreenButton.disabled = true;
        return this;
    }


    /**
     * Returns true if the view of this control bar is enabled; otherwise, returns false
     *
     * @return {Boolean} true if the view of this control bar is enabled; otherwise, returns false
     */
    isEnabled() {
        return this.enabled;
    }


    /**
     * Activates the behavior of the progress bar used to scrub through the video
     */
    activateProgressBar() {
        Event.add(this.progressBarHandle, "mousedown", this.onDragStart);
        return this;
    }


    /**
     * A callback method invoked when the user clicks on the drag handle of the progress bar or on the volume
     * control handle. It sets the type of the drag (progress update or volume update) and initializes the coordinates
     * of the mouse for further reference when the user moves the mouse.
     *
     * @param {Event} event     the mouse down event that triggered this action
     */
    onDragStart = (event) => {
        const source = Event.element(event);

        this.isProgressBarHandle = HTML.hasClassName(source, "progress-slider-handle");
        this.dragOriginX = Event.pointer(event).x;

        if (this.isProgressBarHandle) {
            if (!this.isVideoSeekingMode()) {
                this.enterVideoSeekingMode();
            }

            this.containerOffset = DOM.cumulativeOffset(this.progressBar);
            this.elementInitialX = DOM.positionedOffset(this.progressBarHandle).left;
            this.minThreshold = Math.floor(0 - DOM.width(this.progressBarHandle) / 2);
            this.seekableInterval = this.bufferedContent.offsetWidth;
        } else {
            this.containerOffset = DOM.cumulativeOffset(this.volumeTrack);
            this.elementInitialX = DOM.positionedOffset(this.volumeHandle).left;
            this.minThreshold = Math.floor(0 - DOM.width(this.volumeHandle) / 2);
            this.seekableInterval = this.volumeTrack.offsetWidth - DOM.width(this.volumeHandle);
        }

        Event.add(document, "mousemove", this.onDragUpdate);
        Event.add(document, "mouseup", this.onDragEnd);
    };


    /**
     * Updates the playhead of the movie or the current volume as the user moves the mouse
     *
     * @param {Event} event     the "mousemove" event fired as the user moves the mouse
     */
    onDragUpdate = (event) => {
        const deltaX = Event.pointer(event).x - this.dragOriginX;
        const positionX = Math.max(this.minThreshold, Math.min(this.elementInitialX + deltaX, this.seekableInterval));

        if (this.isProgressBarHandle) {
            HTML.setStyle(this.progressBarHandle, {
                left: `${positionX}px`
            });

            const progressBarHandleOffset = DOM.positionedOffset(this.progressBarHandle).left;
            const progressBarHandleWidth = DOM.width(this.progressBarHandle);
            this.playheadOffsetPercentage = Math.max(0, (progressBarHandleOffset + progressBarHandleWidth * 0.5) /
                DOM.width(this.progressBar));

            this.fillElapsedDurationAtCurrentPlayhead();
            this.delegate.beginSeeking(this, this.playheadOffsetPercentage);
        } else {
            HTML.setStyle(this.volumeHandle, {
                left: `${positionX}px`
            });

            HTML.setStyle(this.volumeFiller, {
                width: `${positionX}px`
            });

            const volumeLevel = Math.max(0, DOM.positionedOffset(this.volumeHandle).left / this.seekableInterval);
            this.afterVolumeLevelSet(volumeLevel);
            this.delegate.onVolumeChanged(volumeLevel);
        }
    };


    /**
     * A callback method invoked when the user releases the mouse button. It ends the video seeking or
     * volume update action.
     *
     * @param {Event} event     the "mouseup" event fired when the user releases the mouse button
     */
    onDragEnd = () => {
        if (this.isProgressBarHandle) {
            this.leaveVideoSeekingMode();
            this.delegate.endSeeking(this, this.playheadOffsetPercentage);
        }

        Event.remove(document, "mousemove", this.onDragUpdate);
        Event.remove(document, "mouseup", this.onDragEnd);
    };


    /**
     * Fills the elapsed duration at the current playhead, which is represented by the position of the progress handle.
     * This method is invoked during normal playhead as well as when the user starts dragging the progress handle.
     */
    fillElapsedDurationAtCurrentPlayhead() {
        const pixelOffset = DOM.positionedOffset(this.progressBarHandle).left +
            DOM.width(this.progressBarHandle) / 2;
        const elapsedPercentage = (pixelOffset * 100 / DOM.width(this.progressBar)).toFixed(2);

        HTML.setStyle(this.playedContent, {
            width: `${elapsedPercentage}%`
        });
    }


    /**
     * Activates the behavior of the volume control
     */
    activateVolumeControl() {
        Event.add(this.volumeHandle, "mousedown", this.onDragStart);
        return this;
    }


    /**
     * Sets the volume level to the specified value
     *
     * @param {Number} volumeLevel      the volume level to set
     */
    setVolumeLevel(volumeLevel) {
        const handleWidth = DOM.width(this.volumeHandle);
        const pixelOffset = Math.floor(DOM.width(this.volumeTrack) - handleWidth) * volumeLevel;

        HTML.setStyle(this.volumeHandle, {
            left: `${pixelOffset}px`
        });

        HTML.setStyle(this.volumeFiller, {
            width: `${pixelOffset}px`
        });

        this.afterVolumeLevelSet(volumeLevel);
        return this;
    }


    /**
     * Adjusts the volume icon to reflect the current volume level
     *
     * @param {Number} volumeLevel      the current volume level
     */
    afterVolumeLevelSet(volumeLevel) {
        let volumeClass = "volume-icon";
        const extraClass = (volumeLevel === 0) ? "off" : (volumeLevel >= 0.75) ? "hi" : null;

        if (extraClass) {
            volumeClass = `${volumeClass} ${extraClass}`;
        }

        this.volumeIcon.className = volumeClass;
    }


    /**
     * Registers event handlers for the actions of this control bar: play controls, volume control,
     * fullscreen action, etc.
     */
    registerEvents() {
        Event.add(this.playPauseButton, "click", this.handlePlayback);
        Event.add(this.settingsContainer, "click", this.handleSettingsActions);

        return this;
    }


    /**
     * A callback method invoked when the duration of the movie is availablw
     *
     * @param {Number} duration     the duration of the movie
     */
    onDurationAvailable(duration) {
        this.videoDuration = duration;

        HTML.setContent(this.elapsedContent, "<p>0:00:00</p>");
        HTML.setContent(this.remainingContent, `<p>${formatRemainingTime(duration)}</p>`);

        if (!this.isEnabled()) {
            this.toggleControls(ENABLE);
        }
    }


    /**
     * A callback method invoked as the user interacts with the play button.
     *
     * @param {Event} event     the click event on the play button
     */
    handlePlayback = (event) => {
        Event.stop(event);
        const source = Event.element(event);

        const isPlaying = HTML.hasClassName(source, "pause");
        HTML[isPlaying ? "removeClassName" : "addClassName"](source, "pause");

        this.delegate.onPlaybackActions({
            action: isPlaying ? PAUSE : PLAY
        });
    };


    /**
     * A callback method invoked as the user interacts with the settings controls. It takes the appropriate action based
     * on the button that was clicked.
     *
     * @param {Event} event     the click event on the settings controls
     */
    handleSettingsActions = (event) => {

        if (!this.isEnabled()) {
            return;
        }

        Event.stop(event);
        const source = Event.element(event);
        const action = source.getAttribute("data-action");

        if (action) {
            this.delegate.onPlaybackActions({
                action
            });
        }
    };


    /**
     * A callback method invoked when the state of the video playback changes. It updates the UI
     * to reflect the current state by showing either the "Play" or "Pause" buttons.
     *
     * @param {String} action       the playback action taken by the user
     */
    onPlaybackStateChanged(state) {
        const isPlaying = state === PLAYING;
        HTML[isPlaying ? "addClassName" : "removeClassName"](this.playPauseButton, "pause");
    }


    /**
     * Resets the state of the progress bar and playhead indicator when playback ends
     */
    onPlaybackEnded() {
        this.onPlaybackStateChanged(PAUSED);
        this.onProgress(0).onTimeUpdate(0);

        return this;
    }


    /**
     * A callback method invoked repeatedly as the playback time of the current video gets updated, It updates
     * the elapsed and remaining durations of the video as well as the position of the playhead.
     *
     * @param {Number} elapsed      the elapsed duration of the movie
     */
    onTimeUpdate(elapsed) {
        if (!this.videoDuration) {
            return this;
        }

        const elapsedTime = `<p>${formatTime(elapsed)}</p>`;
        const remainingTime = `<p>${formatRemainingTime(this.videoDuration - elapsed)}</p>`;
        HTML.setContent(this.elapsedContent, elapsedTime);
        HTML.setContent(this.remainingContent, remainingTime);

        if (this.isNormalPlaybackMode()) {
            const percentagePlayed = elapsed / this.videoDuration;
            const pixelValue = Math.floor(DOM.width(this.progressBar) * percentagePlayed);
            const handleOffset = Math.max(0, pixelValue - DOM.width(this.progressBarHandle));

            HTML.setStyle(this.progressBarHandle, {
                left: `${handleOffset}px`
            });

            this.fillElapsedDurationAtCurrentPlayhead();
        }

        return this;
    }


    /**
     * A callback method invoked repeatedly as the download progress of the video gets updated. It updates the
     * width of the buffered content indicator.
     *
     * @param {Number} loaded       the percentage of data currently loaded
     */
    onProgress(loaded) {
        this.percentageLoaded = loaded;
        HTML.setStyle(this.bufferedContent, {
            width: `${loaded}%`
        });

        return this;
    }


    /**
     * Enters normal playback mode
     */
    enterNormalPlaybackMode() {
        this.mode = "playback";
        return this;
    }


    /**
     * Returns true if this control bar is in normal playback mode; otherwise, returns false
     *
     * @return {Boolean} true if this control bar is in normal playback mode; otherwise, returns false
     */
    isNormalPlaybackMode() {
        return this.mode === "playback";
    }


    /**
     * Enters video seeking mode
     */
    enterVideoSeekingMode() {
        this.mode = "seek";
        return this;
    }


    /**
     * Returns true if this control bar is in video seeking mode; otherwise, returns false
     *
     * @return {Boolean} true if this control bar is in video seeking mode; otherwise, returns false
     */
    isVideoSeekingMode() {
        return this.mode === "seek";
    }


    /**
     * Leaves video seeking mode and enters the normal mode
     */
    leaveVideoSeekingMode() {
        return this.enterNormalPlaybackMode();
    }


    /**
     * Shows the control panel
     */
    show() {
        HTML.setStyle(this.element, {
            opacity: 1
        });

        return this;
    }


    /**
     * Hide the control panel
     */
    hide() {
        HTML.setStyle(this.element, {
            opacity: 0
        });

        return this;
    }


    /**
     * Returns true if this control bar is showing; otherwise, returns false
     *
     * @return {Boolean} true if this control bar is showing; otherwise, returns false
     */
    isShowing() {
        return HTML.getStyle(this.element, "opacity") === 1;
    }


    /**
     * Toggles the fullscreen mode on or off
     *
     * @param {Event} event     the click event that triggered this action
     */
    adjustFullscreenLayout = (isFullscreen = false) => {
        HTML[isFullscreen ? "addClassName" : "removeClassName"](this.fullscreenButton, "on");
        return this;
    };


    /**
     * Resets the state of the view elements for this control bar component
     */
    resetView() {
        this.onPlaybackEnded();

        HTML.setContent(this.elapsedContent, "<p>--:--</p>");
        HTML.setContent(this.remainingContent, "<p>--:--</p>");
        HTML.hide(this.element);

        return this;
    }


    /**
     * Destroys this control bar component and removes its event registered event handlers
     */
    destroy() {
        Event.remove(this.progressBarHandle, "mousedown", this.onDragStart);
        Event.remove(this.volumeHandle, "mousedown", this.onDragStart);
        Event.remove(this.settingsContainer, "click", this.handleSettingsActions);
    }

}


ControlBar.defaultOptions = {
    theme: "minimal",
    MARKUP: `
        <div class="row play-section">
            <div class="play-wrapper">
                <button class="play">Play</button>
            </div>
            <div class="duration-wrapper elapsed">
                <p>--:--</p> 
            </div>
            <div class="progress-wrapper">
                <div class="progress-bar"> 
                    <span class="buffered"></span> 
                    <span class="played"></span> 
                    <div class="progress-slider-track"> 
                        <span class="progress-slider-handle"></span> 
                    </div>
                </div>
            </div>
            <div class="duration-wrapper remaining">
                <p>--:--</p> 
            </div>
        </div>
        <div class="row settings-section">
            <div class="column volume-container">
                <figure class="volume-icon"></figure>
                <div class="volume-slider-track"> 
                    <span class="volume-filler"></span> 
                    <span class="volume-slider-handle"></span> 
                </div>
            </div>
            <div class="column settings-container">
                <ul class="setting-items">
                    <li class="setting-item rewind-nseconds">
                        <button data-action="rewind">Rewind 15 seconds</button>
                    </li>
                    <li class="setting-item share" style="display:none">
                        <button>Share</button>
                    </li>
                    <li class="setting-item config" style="display:none">
                        <button>Configuration</button>
                    </li>
                    <li class="setting-item fullscreen">
                        <button data-action="fullscreenchange">Fullscreen</button>
                    </li>
                </ul>
            </div>
        </div>
    `
};
