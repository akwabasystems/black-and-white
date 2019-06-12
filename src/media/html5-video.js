/* eslint-disable no-unused-vars, no-throw-literal, no-empty */
/** -------------------------------------------------------------------------------------------------------------------
 *                                  HTML5 VIDEO
 *
 *  A class that renders an instance of an HTML5 Video element.
 *
 *  This class requires a delegate that will get notified of its lifecycle methods. The required
 *  handler methods for those events are specified in the "requiredMethods" property of the constructor function.
 *--------------------------------------------------------------------------------------------------------------------*/
import Extensions           from "@akwaba/object-extensions";
import Event                from "@akwaba/events";
import HTML                 from "@akwaba/html";

import {
    DELEGATE_METHODS_NOT_IMPLEMENTED,
    FEATURE_NOT_AVAILABLE,
    HTML5_VIDEO_NOT_SUPPORTED,
    INVALID_URL
} from "../constants/media-error-event-type";

import AbstractVideoElement from "./video-element";
import * as MediaEvents     from "../constants/playback-event-type";
import URLResource          from "./url-resource";

import {
    isHTML5Supported,
    isMobile
} from "./media-detector";


export default class HTML5Video extends AbstractVideoElement {

    static defaultOptions = {
        isHTML5: true,
        fullscreen: false,
        captions: null,
        className: "akwaba-video-element akwaba-html5-video"
    };

    static requiredMethods = [
        "onVideoPlayable",
        "onMetadataLoaded",
        "onTimeUpdate",
        "onDurationChanged",
        "onProgress",
        "onVideoPlayback",
        "onVideoPaused",
        "onPlaybackEnded"
    ];

    constructor(url, options = {}) {
        super(url, Object.assign({}, HTML5Video.defaultOptions, options));

        this.delegate = this.options.delegate;
        this.render();
    }


    /**
     * Creates and renders an instance of the HTML5 video for this component.
     */
    render() {
        const proceed = !!(this.delegate && Extensions.implementsInterface(this.delegate, HTML5Video));

        if (!proceed) {
            const message = HTML5Video.requiredMethods.join(", ");
            throw {
                error: DELEGATE_METHODS_NOT_IMPLEMENTED,
                message
            };
        }

        if (!isHTML5Supported()) {
            throw {
                error: FEATURE_NOT_AVAILABLE,
                message: HTML5_VIDEO_NOT_SUPPORTED
            };
        }

        const videoElement = document.createElement("video");
        videoElement.id = this.id;
        videoElement.playerType = "video";
        videoElement.width = this.width;
        videoElement.height = this.height;

        const canPlayMP4Video = videoElement.canPlayType("video/mp4") ||
            videoElement.canPlayType("application/x-mpegURL");

        if (canPlayMP4Video) {
            videoElement.playerType = "video/mp4";
        }

        if (!this.resource.url) {
            throw {
                error: INVALID_URL,
                message: INVALID_URL
            };
        }

        videoElement.setAttribute("src", this.resource.url);

        if (isMobile()) {
            videoElement.setAttribute("controls", "controls");
        }

        this.video = videoElement;
        this.playable = false;
        this.playing = false;
        this.ended = false;
        this.initialized = true;

        return this.registerEvents();
    }


    /**
     * Registers event handlers for the lifecycle of this component
     */
    registerEvents() {
        Event.add(this.video, MediaEvents.CAN_PLAY, this.onVideoPlayable);
        Event.add(this.video, MediaEvents.LOADED_METADATA, this.onMetadataLoaded);
        Event.add(this.video, MediaEvents.TIME_UPDATE, this.onTimeUpdate);
        Event.add(this.video, MediaEvents.DURATION_CHANGE, this.onDurationChanged);
        Event.add(this.video, MediaEvents.PROGRESS, this.onProgress);
        Event.add(this.video, MediaEvents.PLAYING, this.onVideoPlayback);
        Event.add(this.video, MediaEvents.PAUSE, this.onVideoPaused);
        Event.add(this.video, MediaEvents.ENDED, this.onPlaybackEnded);

        Event.add(this.video, MediaEvents.FULLSCREEN_CHANGE, this.onFullscreenExit);
        Event.add(this.video, MediaEvents.WEBKIT_FULLSCREEN_CHANGE, this.onFullscreenExit);
        Event.add(this.video, MediaEvents.MOZ_FULLSCREEN_CHANGE, this.onFullscreenExit);
        Event.add(this.video, MediaEvents.MS_FULLSCREEN_CHANGE, this.onFullscreenExit);
    }


    /**
     * A callback method invoked when the underlying video has downloaded enough data to start playing.
     * It updates the playable state of this instance.
     *
     * @param {Event|any} event     the event fired by the video when it has downloaded enough data to start playing
     */
    onVideoPlayable = () => {
        this.playable = true;
        this.delegate.onVideoPlayable(this);
    };


    /**
     * A callback method invoked when the metadata for the underlying video is available.
     *
     * @param {Event|any} event     the event fired by the video when its metadata is available
     */
    onMetadataLoaded = () => {
        this.delegate.onMetadataLoaded(this.video.metadata);
    };


    /**
     * A callback method invoked repeatedly as the playback time of the underlying video is updated,
     *
     * @param {Event|any} event     the event fired by the underyling video when its playback time changes
     */
    onTimeUpdate = () => {
        const { currentTime: elapsed, duration } = this.video;

        this.delegate.onTimeUpdate({
            elapsed,
            duration
        });
    };


    /**
     * A callback method invoked when the duration of the underlying video is available,
     *
     * @param {Event|any} event     the event fired by the underyling video when its duration is available
     */
    onDurationChanged = () => {
        this.delegate.onDurationChanged(this.video.duration);
    };


    /**
     * A callback method invoked when playback starts or resumes.
     *
     * @param {Event|any} event     the event fired by the underyling video when playback starts or resumes
     */
    onVideoPlayback = () => {
        this.delegate.onVideoPlayback(this);
    };


    /**
     * A callback method invoked repeatedly as the download progress of the video is updated. It computes the
     * percentage of data loaded and notifies the delegate accordingly.
     *
     * @param {Event|any} event         the event fired repeatedly by the underyling video as its download
     * progress gets updated
     */
    onProgress = () => {
        try {

            const loaded = parseInt(this.video.buffered.end(0), 10) * 100 / this.video.duration;
            this.delegate.onProgress(loaded);

        } catch (invalidRange) { }
    };


    /**
     * A callback method invoked when the video is paused,
     *
     * @param {Event|any} event         the event fired when the video is paused
     */
    onVideoPaused = () => {
        this.delegate.onVideoPaused(this);
    };


    /**
     * A callback method invoked when playback ends.
     *
     * @param {Event|any} event         the event fired by the underyling video when playback ends
     */
    onPlaybackEnded = () => {
        this.ended = true;
        this.delegate.onPlaybackEnded(this);
    };


    /**
     * A callback method invoked when the underlying video enters or exits fullscreen mode.
     */
    toggleFullscreenMode() {

        if (!this.isFullscreenModeSupported()) {
            return this;
        }

        if (this.isNormalVideoMode()) {
            HTML.addClassName(document.body, "fullscreen");

            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        } else {
            HTML.removeClassName(document.body, "fullscreen");

            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }

        this.isFullscreen = !this.isNormalVideoMode();
    }


    /**
     * @override
     *
     * Returns true if this media object supports fullscreen mode; otherwise, returns false
     *
     * @returns {Boolean} true if this media object supports fullscreen mode; otherwise, returns false
     */
    isFullscreenModeSupported() {
        return !!(document.fullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled ||
            document.webkitSupportsFullscreen ||
            document.webkitFullscreenEnabled ||
            document.createElement("video").webkitRequestFullScreen);
    }


    /**
     * Returns true if the current video is in normal playback mode; otherwise, returns false
     *
     * @returns {Boolean} true if the current video is in normal playback mode; otherwise, returns false
     */
    isNormalVideoMode() {
        return (!document.fullscreenElement &&
            !document.mozFullScreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement);
    }


    /**
     * A callback method invoked when the underlying video exits fullscreen mode. It adjusts the view styles
     * accordingly.
     *
     * @param {Event|any} event     the event fired when the video exits fullscreen mode
     */
    onFullscreenExit = () => {
        this.isFullscreen = false;
        HTML.removeClassName(document.body, "fullscreen");
    };


    /**
     * @override
     *
     * Returns a reference to the underlying HTML5 video for this instance
     *
     * @return {Object} a reference to the underlying HTML5 video for this instance
     */
    getVideo() {
        return this.video;
    }


    /**
     * Returns the duration of the underlying video for this instance
     *
     * @return {Number} the duration of the current video for this instance
     */
    getDuration() {
        return this.video.duration;
    }


    /**
     * Returns the current time of the underlying video for this instance
     *
     * @return {Number} the current time of the current video for this instance
     */
    getCurrentTime() {
        return this.video.currentTime;
    }


    /**
     * Sets the current time for the underlying video for this instance. This action causes the video
     * to jump to the new time and start or resume playing
     *
     * @param {Number} time     the current time to set for the video
     */
    setCurrentTime(time) {
        this.video.currentTime = time;
    }


    /**
     * Returns true if the underlying video for this instance is set to autoplay; otherwise, returns false
     *
     * @return {Boolean} true if the underlying video for this instance is set to autoplay; otherwise, returns false
     */
    isSetToAutoplay() {
        return !!this.options.autoplay;
    }


    /**
     * Returns true if the underlying video for this instance is muted; otherwise, returns false
     *
     * @return {Boolean} true if the underlying video for this instance is muted; otherwise, returns false
     */
    isMuted() {
        return this.video.volume === 0;
    }


    /**
     * Mutes or unmutes the underlying video for this instance
     *
     * @param {Boolean} muted       a flag that specifies whether to mute or unmute the video
     * @param {Number} volume       the volume to set when unmuting the video
     */
    setMuted(muted = true, volume = 0.5) {
        this.video.volume = !muted ? volume : 0;
    }


    /**
     * Returns the playback rate of the underlying video for this instance
     *
     * @return {Number} the playback rate of the underlying video for this instance
     */
    getPlaybackRate() {
        return this.video.playbackRate;
    }


    /**
     * Returns the default playback rate of the underlying video for this instance
     *
     * @return {Number} the default playback rate of the underlying video for this instance
     */
    getDefaultPlaybackRate() {
        return this.video.defaultPlaybackRate;
    }


    /**
     * Sets the playback rate of the underlying video for this instance
     *
     * @param {Number} rate     the playback rate to set for the video
     */
    setPlaybackRate(rate) {
        this.video.playbackRate = rate;
    }


    /**
     * Sets the source of the video to play
     *
     * @param {String} url      the URL to set for the video
     */
    setSource(url) {
        if (!this.video) {
            return;
        }

        if (this.isPlaying()) {
            this.video.pause();
        }

        this.resource = new URLResource(url);
        this.video.src = url;
        this.video.load();
    }


    /**
     * Returns the source of the underlying video for this instance
     *
     * @return the source of the underlying video for this instance
     */
    getSource() {
        return this.resource.url;
    }


    /**
     * Returns the volume of the underlying video for this instance
     *
     * @return the volume of the underlying video for this instance
     */
    getVolume() {
        return this.video.volume;
    }


    /**
     * Sets the video volume of the underlying video for this instance
     *
     * @param {Number} volume            the volume to set for this instance
     */
    setVolume(volume) {
        this.video.volume = volume;
    }


    /**
     * Get the DOM container element for the underlying video for this instance
     *
     * @return {Node} the DOM container element for the underlying video for this instance
     */
    getVideoContainer() {
        return this.videoContainer;
    }


    /**
     * Sets the DOM container element for the underlying video for this instance
     *
     * @param {Node} container      the container to set for this video instance
     */
    setVideoContainer(container) {
        this.videoContainer = container;
    }


    /**
     * Sets the size for the underlying video for this instance. This is the dimension of the container holding the
     * video. As a result, the video will be resized to fit within the specified rectangle while maintaining
     * its aspect ratio.
     *
     * @param {Number} width        the width to set for the video
     * @param {Number} height       the height to set for the video
     */
    setVideoSize(width, height) {
        this.width = width;
        this.height = height;

        if (this.video) {
            this.video.width = width;
        }
    }


    /**
     * Plays the current video source
     */
    play() {
        if (!this.playable) {
            return;
        }

        this.video.play();
        this.playing = true;
    }


    /**
     * Returns true if the underlying video is currently playing; otherwise, returns false
     *
     * @return {Boolean} true if the underlying video is currently playing; otherwise, returns false
     */
    isPlaying() {
        return this.playing;
    }


    /**
     * Pauses the underlying video
     */
    pause() {
        if (!this.playable) {
            return;
        }

        this.video.pause();
        this.playing = false;
    }


    /**
     * Returns true if the underlying video is paused; otherwise, returns false
     *
     * @return {Boolean} true if the underlying video is paused; otherwise, returns false
     */
    isPaused() {
        return !this.isPlaying();
    }


    /**
     * Seeks to the given time within the playable time range for this video, and starts or resumes
     * playing.
     *
     * @param {Number} time     the time to which to seek, in seconds
     */
    seek(time) {
        if (!this.playable) {
            return;
        }

        this.video.currentTime = Math.max(0, Math.min(time, this.video.duration));
    }


    /**
     * Seeks back the specified number of seconds from the current playback time
     *
     * @param {Number} seconds      the number of seconds to seek back from the current playhead position
     */
    seekBackNSeconds(seconds) {
        if (!(this.playable && Extensions.isNumber(seconds))) {
            return;
        }

        this.video.currentTime = Math.max(0, this.video.currentTime - seconds);
    }


    /**
     * Seeks forward the specified number of seconds from the current playback time
     *
     *  @param {Number} seconds     the number of seconds to seek forward from the current playhead position
     */
    seekForwardNSeconds(seconds) {
        if (!(this.playable && Extensions.isNumber(seconds))) {
            return;
        }

        this.video.currentTime = Math.min(this.video.currentTime + seconds, this.video.duration);
    }


    /**
     * Returns true if playback has ended; otherwise, returns false
     *
     * @return {Boolean} true if playback has ended; otherwise, return false
     */
    isEnded() {
        return this.ended;
    }


    /**
     * Returns the natural width at which the video was encoded
     *
     * @return {Number} the natural width at which the video was encoded
     */
    getNaturalWidth() {
        return this.video.videoWidth;
    }


    /**
     * Returns the natural height at which the video was encoded
     *
     * @return {Number} the natural height at which the video was encoded
     */
    getNaturalHeight() {
        return this.video.videoHeight;
    }


    /**
     * Returns the time scale for the underlying video for this instance
     *
     * @return {Number} the time scale for the underlying video for this instance
     */
    getTimeScale() {
        return this.video.timeScale;
    }


    /**
     * Stops playing the underlying video and clears its reference.
     */
    destroy() {
        if (this.video) {
            this.video.stop();
            this.video.style.display = "none";

            Event.remove(this.video, MediaEvents.CAN_PLAY, this.onVideoPlayable);
            Event.remove(this.video, MediaEvents.LOADED_METADATA, this.onMetadataLoaded);
            Event.remove(this.video, MediaEvents.TIME_UPDATE, this.onTimeUpdate);
            Event.remove(this.video, MediaEvents.DURATION_CHANGE, this.onDurationChanged);
            Event.remove(this.video, MediaEvents.PROGRESS, this.onProgress);
            Event.remove(this.video, MediaEvents.PLAYING, this.onVideoPlayback);
            Event.remove(this.video, MediaEvents.PAUSE, this.onVideoPaused);
            Event.remove(this.video, MediaEvents.ENDED, this.onPlaybackEnded);

            Event.remove(this.video, MediaEvents.FULLSCREEN_CHANGE, this.onFullscreenExit);
            Event.remove(this.video, MediaEvents.WEBKIT_FULLSCREEN_CHANGE, this.onFullscreenExit);
            Event.remove(this.video, MediaEvents.MOZ_FULLSCREEN_CHANGE, this.onFullscreenExit);
            Event.remove(this.video, MediaEvents.MS_FULLSCREEN_CHANGE, this.onFullscreenExit);

            this.video = null;
        }
    }

}
