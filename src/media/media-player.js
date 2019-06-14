/* eslint-disable no-unused-vars, no-throw-literal, no-empty */

/** -------------------------------------------------------------------------------------------------------------------
 *                                      MEDIA PLAYER
 *
 *  A class that acts a the Controller in the MVC pattern used by the Black-And-White media architecture.
 *
 *  It holds a reference an instance of the MediElement, which represents the model in the pattern, and for
 *  which it represents the delegate. It also holds a reference to the view, which is the DOM element in
 *  which the video is rendered. Finally, it creates an instance of MediaControls, which allows the
 *  user to interact with the video element.
 *--------------------------------------------------------------------------------------------------------------------*/

import Extensions               from "@akwaba/object-extensions";
import HTML                     from "@akwaba/html";
import DOM                      from "@akwaba/dom";
import Event                    from "@akwaba/events";

import {
    VIDEO,
    AUTO
}  from "../constants/media-type";
import {
    INVALID_MEDIA_CONTAINER,
    FEATURE_NOT_AVAILABLE,
    HTML5_VIDEO_NOT_SUPPORTED
}  from "../constants/media-error-event-type";

import * as MediaFactory        from "./media-factory";
import * as MediaEvents         from "../constants/playback-event-type";
import * as MediaState          from "../constants/media-player-state";
import MediaControlBar          from "../elements/control-bar";
import * as EventDispatcher     from "../events/event-dispatcher";
import URLResource              from "./url-resource";
import sizeClasses              from "../utils/size-classes";

import {
    isMobile,
    isHTML5Video,
    isHTML5Supported
} from "./media-detector";
import {
    getFileExtension,
} from "../utils/media-utils";

const SHOW = "show";
const HIDE = "hide";
const LIGHT = "light";
const DARK = "dark";
const FADE_TIMEOUT = 2500;


export default class MediaPlayer {

    static defaultOptions = {
        mediaType: VIDEO,
        enableAirplay: false,
        videoBeganPlaying: false,
        videoChangingSize: false,
        templates: {
            BUFFERING: '<div class="video-pattern-1"></div><div class="video-pattern-2"></div>'
        }
    };

    constructor(options = {}) {
        this.options = Object.assign({}, MediaPlayer.defaultOptions, options);
        const { element } = this.options;
        this.videoContainer = Extensions.isString(element) ? HTML.getElement(element) : element;

        if (!this.videoContainer) {
            throw new Error(INVALID_MEDIA_CONTAINER);
        }

        this.resourceURL = this.options.url;
        this.initializeView();
    }


    /**
     * Initializes the view of this media player
     */
    initializeView() {
        const isPositioned = /relative|absolute/.test(HTML.getStyle(this.videoContainer, "position"));

        if (!isPositioned) {
            HTML.setStyle(this.videoContainer, {
                position: "relative"
            });
        }

        this.shouldCreateHTML5Video = true;

        if (this.options.mediaType === AUTO) {
            const extension = getFileExtension(this.resourceURL);
            this.shouldCreateHTML5Video = !!(isHTML5Supported() && isHTML5Video(extension));
        }

        if (!this.shouldCreateHTML5Video) {
            throw {
                error: FEATURE_NOT_AVAILABLE,
                message: HTML5_VIDEO_NOT_SUPPORTED
            };
        }

        this.createHTML5Video();
        this.videoContainer.appendChild(this.videoElement.video);

        if (isMobile()) {
            HTML.setStyle(this.videoContainer, {
                width: "100%"
            });

            HTML.setStyle(this.videoElement.video, {
                width: "100%",
                height: "auto"
            });

            if (this.options.poster) {
                this.videoElement.video.poster = this.options.poster;
            }

            return;
        }

        this.applySizeClasses();
        const shouldAutoplay = !!this.options.autoplay;

        if (this.options.poster) {
            this.generatePoster();
            this.videoContainer.appendChild(this.poster);

            if (shouldAutoplay) {
                HTML.hide(this.poster);
            }
        }

        this.videoElement.setVideoContainer(this.videoContainer);
        this.videoBeganPlaying = false;
        this.videoEndedPlaying = false;

        this.videoMask = HTML.createElement("div", {
            className: "akwaba-video-mask"
        });
        this.videoContainer.appendChild(this.videoMask);

        this.initializeControlBar()
            .createPlayIcon()
            .createLoadingIndicator();

        if (shouldAutoplay) {
            this.showLoadingIndicator();
        } else {
            this.togglePlayIcon(SHOW);
            this.adjustVideoMask(DARK);
        }

        return this;
    }


    /**
     * Creates an instance of an HTML5 video for this media player
     *
     * @return {Object} an instance of an HTML5 video for this media player
     */
    createHTML5Video() {
        const videoOptions = {
            ...this.options,
            delegate: this
        };

        this.videoElement = MediaFactory.createHTML5Video(this.resourceURL, videoOptions);
    }


    /**
     * Applies the appropriate CSS classes the video container based on dimensions of the video
     */
    applySizeClasses() {
        const { width } = DOM.dimensions(this.videoContainer);
        const { width: videoWidth, height: videoHeight } = this.videoElement;
        let className = "akwaba-media-player";
        const sizeClass = Object.values(sizeClasses).find((size) => size.maxWidth >= width);

        if (sizeClass) {
            className = `${className} size-${sizeClass.controlWidth}`;
        }

        this.videoContainer.className = className;

        HTML.setStyle(this.videoContainer, {
            width: `${videoWidth}px`,
            height: `${videoHeight}px`
        });

        return this;
    }


    /**
     * Generates the poster for this media player
     */
    generatePoster() {
        this.poster = HTML.createElement("figure", {
            className: "akwaba-movie-poster-container"
        });
        const content = `<img src="${this.options.poster}" />`;
        HTML.setContent(this.poster, content);

        return this;
    }


    /**
     * Sets the instance of a VideoElement for this controller
     *
     * @param {Object} videoElement     the video instance to set for this controller
     */
    setVideoElement(videoElement) {
        this.videoElement = videoElement;
    }


    /**
     * Initializes the control bar component used to interact with the video player
     */
    initializeControlBar() {
        this.controlBar = new MediaControlBar({
            container: this.videoContainer,
            delegate: this
        });

        if (!this.videoElement.isFullscreenModeSupported()) {
            this.controlBar.disableFullscreenButton();
        }

        return this.registerEvents();
    }


    /**
     * Creates the "Play" icon displayed as an overlay over the video container
     */
    createPlayIcon() {
        this.playIcon = HTML.createElement("button", {
            className: "akwaba-video-play-icon"
        });
        this.videoContainer.appendChild(this.playIcon);
        this.togglePlayIcon(HIDE);
        Event.add(this.playIcon, "click", this.onPlayIconClicked);

        return this;
    }


    /**
     * A callback method invoked when the user clicks the "Play" icon.
     *
     * @param {event} event     the click event on the Play icon
     */
    onPlayIconClicked = (event) => {
        Event.stop(event);
        this.play();
    };


    /**
     * Creates the loading spinner that is displayed as the movie content gets buffered
     */
    createLoadingIndicator() {
        this.loadingIndicator = HTML.createElement("div", {
            className: "akwaba-media-loading-indicator"
        });
        HTML.setContent(this.loadingIndicator, this.options.templates.BUFFERING);
        HTML.hide(this.loadingIndicator);
        this.videoContainer.appendChild(this.loadingIndicator);
    }


    /**
     * Reveals the buffering spinner
     */
    showLoadingIndicator() {
        if (!this.loadingIndicator) {
            this.createLoadingIndicator();
        }

        HTML.show(this.loadingIndicator);
        HTML.addClassName(this.loadingIndicator, "spinning");
        this.togglePlayIcon(HIDE);

        return this;
    }


    /**
     * Hides the buffering spinner
     */
    hideLoadingIndicator() {
        if (!this.loadingIndicator) {
            this.createLoadingIndicator();
        }

        HTML.removeClassName(this.loadingIndicator, "spinning");
        HTML.hide(this.loadingIndicator);

        return this;
    }


    /**
     * Observes mouse move events on the video container, hiding or showing the control bar based
     * on the position of the mouse
     */
    registerEvents() {
        Event.add(this.videoContainer, "mousemove", this.onMouseMoveEvents);
        document.onfullscreenchange = this.onFullscreenChange;
        return this;
    }


    /**
     * A calback method invoked when the video is buffering.
     */
    onVideoBuffering() {
        if (!this.playbackEnded) {
            this.showLoadingIndicator();
        }

        return this;
    }


    /**
     * A callback method invoked when the underlying video has downloaded enough data to start playing.
     */
    onVideoPlayable() {

        if (this.options.autoplay) {
            this.play();
        }

        if (this.controlBar) {
            this.controlBar.setVolumeLevel(this.videoElement.getVolume());
        }

        this.hideLoadingIndicator();
    }


    /**
     * A callback method invoked when the metadata for the underlying video is available.
     */
    onMetadataLoaded() { }


    /**
     * A callback method invoked repeatedly as the playback time of the underlying video gets updated, It updates
     * the elapsed duration of the video as well as the remaining playback time.
     *
     * @param {Object} info     an object that container the video time
     */
    onTimeUpdate(info) {
        const currentTime = parseInt(info.elapsed, 10);

        if (this.controlBar) {
            this.controlBar.onTimeUpdate(currentTime, this.videoDuration);
        }
    }


    /**
     * A callback method invoked when the duration of the underlying video is available,
     *
     * @param {Number} duration     the duration of the video
     */
    onDurationChanged(duration) {
        this.videoDuration = duration;

        if (this.controlBar) {
            this.controlBar.onDurationAvailable(duration);
        }
    }


    /**
     * A callback method invoked when playback starts or resumes
     */
    onVideoPlayback() {
        if (!this.playbackStarted) {
            this.playbackStarted = true;
            this.playbackEnded = false;

            EventDispatcher.dispatch(MediaEvents.MEDIA_PLAYBACK_STARTED);
        }

        if (this.controlBar) {
            this.controlBar.onPlaybackStateChanged(MediaState.PLAYING);
            this.togglePlayIcon(HIDE);
        }

        this.hideLoadingIndicator();

        if (this.poster) {
            HTML.hide(this.poster);
        }
    }


    /**
     * A callback method invoked repeatedly as the download progress of the video is updated.
     *
     * @param {Number} loaded       the percentage of data currently loaded
     */
    onProgress(loaded) {
        if (this.controlBar) {
            this.controlBar.onProgress(loaded);
        }
    }


    /**
     * A callback method invoked when the video is paused
     */
    onVideoPaused() {
        if (this.controlBar) {
            this.controlBar.onPlaybackStateChanged(MediaState.PAUSED);
            this.togglePlayIcon(SHOW);
            this.adjustVideoMask(DARK);
        }
    }


    /**
     * A callback method invoked when video playback has ended
     */
    onPlaybackEnded() {

        if (this.controlBar) {
            this.controlBar.onPlaybackEnded();
            this.togglePlayIcon(SHOW);
            this.hideControlBar();
            this.adjustVideoMask(DARK);
        }

        this.playbackStarted = false;
        this.playbackEnded = true;
        EventDispatcher.dispatch(MediaEvents.MEDIA_PLAYBACK_ENDED);
    }


    /**
     * Plays the current video source
     */
    play() {
        if (this.videoElement) {
            this.videoElement.play();
        }

        if (this.controlBar) {
            this.controlBar.onPlaybackStateChanged(MediaState.PLAYING);
            this.prepareToHideControlBar();
        }

        this.togglePlayIcon(HIDE);
        this.adjustVideoMask();

        return this;
    }


    /**
     * Pauses the current video
     */
    pause() {
        if (this.videoElement) {
            this.videoElement.pause();
        }

        if (this.controlBar) {
            this.controlBar.onPlaybackStateChanged(MediaState.PAUSED);
        }

        this.togglePlayIcon(SHOW);
        this.adjustVideoMask(DARK);

        return this;
    }


    /**
     * Toggles the visibility of the play icon on or off
     *
     * @param {String} visibility       a string that specifies whether to show or hide the play icon
     */
    togglePlayIcon(visibility) {
        if (this.playIcon) {
            HTML[(visibility === SHOW) ? "show" : "hide"](this.playIcon);
        }
    }


    /**
     * Toggles the visibility of the play icon on or off
     *
     * @param {String} visibility       a string that specifies whether to show or hide the play icon
     */
    adjustVideoMask(mode = LIGHT) {
        HTML.setStyle(this.videoMask, {
            opacity: (mode === LIGHT) ? 0.08 : 0.35
        });
    }


    /**
     * Toggles fullscreen mode on the current video
     *
     * @param {Event} event     the event that triggered fullscreen mode
     */
    handleFullscreenMode = (event) => {
        if (event) {
            Event.stop(event);
        }

        this.videoElement.toggleFullscreenMode();
        return this;
    };


    /**
     * A callback method invoked when the video enters or exits fullsreen mode
     */
    onFullscreenChange = () => {
        if (document.fullscreenElement) {
            this.controlBar.adjustFullscreenLayout(true);
        } else {
            HTML.removeClassName(document.body, "fullscreen");
            this.controlBar.adjustFullscreenLayout(false);
        }
    };


    /**
     * Returns the video element for this media player
     *
     * @return {Object} the video element for this media player
     */
    getVideoElement() {
        return this.videoElement;
    }


    /**
     * Sets the source for the underlying video
     *
     * @param {String} url      the URL to set as the source for the video
     */
    setVideoSource(url) {
        this.resourceURL = url;

        if (this.videoElement) {
            this.videoElement.pause().setResource(new URLResource(url));
        }

        if (this.controlBar) {
            this.controlBar.resetView().onPlaybackStateChanged(MediaState.PAUSED);
        }

        this.playbackStarted = false;

        return this;
    }


    /**
     * Returns the source for the underlying video
     *
     * @return {Object} the source for the underlying video
     */
    getVideoSource() {
        return this.videoElement.getResource();
    }


    /**
     * Sets the poster image for this media player
     *
     * @param {String} poster   the poster to set for this media player
     */
    setPoster(poster) {
        this.poster = poster;
        return this;
    }


    /**
     * Returns the poster for this media player
     *
     * @return {Object} the poster for this media player
     */
    getPoster() {
        return this.poster;
    }


    /**
     * A callback method invoked repeatedly as the user moves the mouse. It shows the control bar, then computes the
     * position of the mouse within the confines of the video container. If the mouse is within the control bar, that
     * bar remains visible; otherwise, it fades after a specified duration in seconds.
     *
     * @param {Event} event     the "mouse move" event fired as the user moves the mouse on the video container
     */
    onMouseMoveEvents = (event) => {

        if (!this.playbackStarted) {
            return this;
        }

        if (this.controlBar) {
            this.controlBar.show();
        }

        const controlBarBoundaries = this.getControlBarBoundaries();
        let containerOffset = DOM.storage.retrieve(this.videoContainer, "offsets");

        if (!containerOffset) {
            containerOffset = DOM.cumulativeOffset(this.videoContainer);
            DOM.storage.store(this.videoContainer, "offsets", containerOffset);
        }

        const { x: pointerX, y: pointerY } = Event.pointer(event);
        const relativePositionX = pointerX - containerOffset.left;
        const relativePositionY = pointerY - containerOffset.top;

        const isWithinControlBar = ((relativePositionX > controlBarBoundaries.left) &&
                                    (relativePositionX < controlBarBoundaries.right) &&
                                    (relativePositionY > controlBarBoundaries.top) &&
                                    (relativePositionY < controlBarBoundaries.bottom));

        if (isWithinControlBar) {
            if (this.controlFadeTimeout) {
                clearTimeout(this.controlFadeTimeout);
            }

            return this;
        }

        if (this.controlFadeTimeout) {
            clearTimeout(this.controlFadeTimeout);
        }

        this.prepareToHideControlBar();
        this.adjustVideoMask(DARK);

        return this;
    };


    /**
     * Returns an object that contains the coordinates of the control bar boundaries
     *
     * @return {Object} an object that contains the coordinates of the control bar boundaries
     */
    getControlBarBoundaries() {
        if (this.controlBarBoundaries) {
            return this.controlBarBoundaries;
        }

        const offset = DOM.positionedOffset(this.controlBar.element);
        const dimensions = DOM.dimensions(this.controlBar.element);

        this.controlBarBoundaries = {
            left: offset.left,
            top: offset.top,
            right: offset.left + dimensions.width,
            bottom: offset.top + dimensions.height
        };

        return this.controlBarBoundaries;
    }


    /**
     * Triggers a timeout that hides the control bar after 2.5 seconds
     */
    prepareToHideControlBar() {
        if (this.controlFadeTimeout) {
            clearTimeout(this.controlFadeTimeout);
        }

        this.controlFadeTimeout = setTimeout(this.hideControlBar.bind(this), FADE_TIMEOUT);
    }


    /**
     * Hides the control panel
     */
    hideControlBar() {
        if (this.controlFadeTimeout) {
            clearTimeout(this.controlFadeTimeout);
        }

        if (this.controlBar) {
            this.controlBar.hide();
            this.adjustVideoMask(this.videoElement.isPlaying() ? LIGHT : DARK);
        }
    }


    /**
     * A method invoked when the user clicks a playback control (play, pause, rewind, fast-forward).
     * It takes the appropriate action based on the control that was clicked
     *
     * @param {Object} info         an object that contains the playback action
     */
    onPlaybackActions({ action }) {
        const playVideo = action === MediaEvents.PLAY;
        const pauseVideo = action === MediaEvents.PAUSE;
        const rewindVideo = action === MediaEvents.REWIND;
        const isFullscreen = action === MediaEvents.FULLSCREEN_CHANGE;

        if (playVideo || pauseVideo) {
            this[playVideo ? "play" : "pause"]();
        } else if (rewindVideo) {
            const FIFTEEN_SECONDS = 15;
            const currentTime = this.getCurrentTime();
            const wasPlayingBeforeSeek = this.videoElement.isPlaying();
            const rewindTime = Math.max(0, currentTime - FIFTEEN_SECONDS);

            this.videoElement.setCurrentTime(rewindTime);
            this[wasPlayingBeforeSeek ? "play" : "pause"]();
        } else if (isFullscreen) {
            this.handleFullscreenMode();
        }
    }


    /**
     * Begins seeking to the given value
     *
     * @param {Object} controlBar       the control bar sending the notification
     * @param {Number} value            the video time to seek to
     */
    beginSeeking(controlBar, value) {

        if (!this.seeking) {
            this.wasPlayingBeforeSeek = this.videoElement.isPlaying();
            this.pause();
        }

        this.seeking = true;
        const playheadPosition = this.videoDuration * value;
        this.videoElement.setCurrentTime(playheadPosition);

        return this;
    }


    /**
     * Ends the seek action
     *
     * @param {Object} controlBar       the control bar sending the notification
     * @param {Number} value            the current value to seek to
     */
    endSeeking(controlBar, value) {
        this.seeking = false;
        this.videoElement.setCurrentTime(this.videoDuration * value);
        this.play();

        return this;
    }


    /**
     * Resets the state of this controller
     */
    reset() {
        this.seeking = false;
        this.videoPlaying = false;
        this.videoBeganPlaying = false;
        this.videoChangingSize = false;
        this.videoEndedPlaying = false;
    }


    /**
     * Returns the current time of the underlying video for this controller
     *
     * @return {Number} the current time of the underlying video for this controller
     */
    getCurrentTime() {
        return this.videoElement.getCurrentTime();
    }


    /**
     * Sets the current time for the underlying video for this player. This action causes the video to jump to the
     * new time and start or resume playing.
     *
     * @param {Number} time     the current time to set for the video
     */
    setCurrentTime(time) {
        this.videoElement.setCurrentTime(time);
        return this;
    }


    /**
     * Returns the duration of the underlying video for this controller
     *
     * @return {Number} the duration of the underlying video for this controller
     */
    getDuration() {
        return this.videoElement.getDuration();
    }


    /**
     * Returns the volume of the underlying video for this controller
     *
     * @return {Number} the volume of the underlying video for this controller
     */
    getVolume() {
        return this.videoElement.getVolume();
    }


    /**
     * A callback method invoked when the user sets the volume by dragging the volume slider.
     *
     * @param {Number} volumeLevel      the current volume level (between 0 and 1)
     */
    onVolumeChanged(volumeLevel) {
        this.setVolume(volumeLevel);
    }


    /**
     * Sets the volume of the underlying video to the specified value
     *
     * @param {Number} volume       the volume to set for the video
     */
    setVolume(volume) {
        this.videoElement.setVolume(volume);
        return this;
    }


    /**
     * Mutes or unmutes the video for this controller
     *
     * @param {Boolean} muted       a flag that specifies whether to mute or unmute the video
     */
    setMuted(muted) {
        this.videoElement.setMuted(muted);
        return this;
    }


    /**
     * Sets the playback rate for the underlying video
     *
     * @param {Number} rate     the playback rate to set for the video
     */
    setRate(rate) {
        this.videoElement.setPlaybackRate(rate);
        return this;
    }


    /**
     * Captures a frame of the underlying video for this player
     *
     * @param {Number} width        the width of the frame to capture
     * @param {Number} height       the height of the frame to capture
     */
    captureFrame(width, height) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(this.videoElement.video, 0, 0, width, height);
    }


    /**
     * Destroys the current video player, cleans up its dependencies and removes its event handlers
     */
    destroy() {
        this.pause();

        if (this.playIcon) {
            Event.remove(this.playIcon, "click", this.onPlayIconClicked);
        }

        if (this.videoElement) {
            Event.remove(this.videoContainer, "mousemove", this.onMouseMoveEvents);

            HTML.remove(this.videoElement.video);
            this.videoElement = null;
        }

        return this;
    }

}
