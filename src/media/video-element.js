/** ------------------------------------------------------------------------------------------------------------------
 *                                  AbstractVideoElement
 *
 * The base class for all video elements (HTML5, Quicktime, Flash, etc). It defines the generic initialization
 * logic for the Video instances as well as abstract methods that those subclasses need to implement for their
 * respective behaviors.
 *--------------------------------------------------------------------------------------------------------------------*/

import Extensions       from "@akwaba/object-extensions";
import MediaElement     from "./media-element";
import { VIDEO }        from "../constants/media-type";


export default class AbstractVideoElement extends MediaElement {

    static defaultOptions = {
        autoplay: false,
        mediaType: VIDEO,
        defaultWidth: 16,
        defaultHeight: 9,
        scaleFactor: 40,
        volume: 0,
        duration: 0,
        currentTime: 0,
        poster: null,
        isStreaming: false,
        isLiveStreaming: false,
        isHTML5: false,
        replay: false,
        metadataLoaded: false
    };

    constructor(url, options = {}) {
        super(url, Object.assign({}, AbstractVideoElement.defaultOptions, options));

        this.id = this.options.id || `BW-Video-${Extensions.generateUUID()}`;
        const { width, height } = this.options;
        const isSizeProvided = Extensions.isNumber(width) && Extensions.isNumber(height);

        if (isSizeProvided) {
            this.setVideoSize(width, height);
        } else {
            const { defaultWidth, defaultHeight, scaleFactor } = this.options;
            this.setVideoSize(defaultWidth * scaleFactor, defaultHeight * scaleFactor);
        }
    }


    /**
     * Returns the ID of this Video instance
     *
     * @return {String} the ID of this Video instance
     */
    getId() {
        return this.id;
    }


    /**
     * Returns the underlying video element (HTML5, Quicktime, Flash) for this instance. This method is abstract and
     * must be implemented by subclasses.
     */
    getVideo() {
        Extensions.abstractFunction();
    }


    /**
     * Plays this video instance. This method is abstract and must be implemented by subclasses.
     */
    play() {
        Extensions.abstractFunction();
    }


    /**
     * Pauses this video instance. This method is abstract and must be implemented by subclasses.
     */
    pause() {
        Extensions.abstractFunction();
    }


    /**
     * Seeks to a given time within the playable time range for this video element. This method is abstract
     * and must be implemented by subclasses.
     */
    seek() {
        Extensions.abstractFunction();
    }


    /**
     * Returns true if the underlying video for this instance is playing; otherwise, returns false. This method is
     * abstract and must be implemented by subclasses.
     */
    isPlaying() {
        Extensions.abstractFunction();
    }


    /**
     * Returns the media type for this instance
     *
     * @return {String} the media type for this instance
     */
    getMediaType() {
        return this.options.mediaType;
    }


    /**
     * Returns true if the underlying video for this instance is streaming (playing a video with the M3U8
     * or F4M extensions); otherwise, returns false.
     *
     * @return {Boolean} true if this video instance is streamin; otherwise, returns false
     */
    isStreaming() {
        return this.options.isStreaming;
    }


    /**
     * Sets the size for the underlying video for this instance. This is the dimension of the container that holds the
     * video. The video will be resized to fit within the specified rectangle while maintaining its aspect ratio.
     * This method is abstract and must be implemented by subclasses.
     */
    setVideoSize() {
        Extensions.abstractFunction();
    }


    /**
     * Get the volume of the underlying video for this instance. This method is abstract and must be implemented by
     * subclasses.
     */
    getVolume() {
        Extensions.abstractFunction();
    }


    /**
     * Sets the video volume of the underlying video for this instance. This method is abstract and must be
     * implemented by subclasses.
     */
    setVolume() {
        Extensions.abstractFunction();
    }


    /**
     * Returns the width of the underlying video for this instance. This is the adjusted width at which the video is
     * being rendered in order to fit within its container.
     *
     * @return {Number} the width of the underlying video for this instance
     */
    getWidth() {
        return this.width;
    }


    /**
     * Returns the height of the underlying video for this instance. This is the adjusted height at which the video is
     * being rendered in order to fit within its container.
     *
     * @return {Number} the height of the underlying video for this instance
     */
    getHeight() {
        return this.height;
    }


    /**
     * Returns the natural width at which the video was encoded
     *
     * @return {Number} the natural width at which the video was encoded
     */
    getNaturalWidth() {
        Extensions.abstractFunction();
    }


    /**
     * Returns the natural height at which the video was encoded
     *
     * @return {Number} the natural height at which the video was encoded
     */
    getNaturalHeight() {
        Extensions.abstractFunction();
    }


    /**
     * Returns true if this media object supports fullscreen mode; otherwise, returns false
     *
     * @returns {Boolean} true if this media object supports fullscreen mode; otherwise, returns false
     */
    isFullscreenModeSupported() {
        return false;
    }


    /**
     * Enters fullscreen mode
     */
    enterFullscreenMode() {
    }


    /**
     * Stops playing the underlying video and clears its references. This method is abstract and must be implemented
     * by subclasses.
     */
    destroy() {
        return Extensions.abstractFunction();
    }

}
