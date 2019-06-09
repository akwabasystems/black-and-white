/** ------------------------------------------------------------------------------------------------------------------
 *                                      MEDIA FACTORY
 *
 * A class that creates different types of media elements: HTML5 video, HTML5 audio, and more. It also exposes
 * an API for finding video instances by ID.
 *
 *--------------------------------------------------------------------------------------------------------------------*/

import Extensions from "@akwaba/object-extensions";

import HTML5Video from "./html5-video";

const registry = {};
const videoTypes = {
    HTML5: HTML5Video
};


/**
 * Creates a medium of a given type and with the specified options
 *
 * @param {String} type     the type of medium to create
 * @param {String} url      the URL of the medium
 * @param {Object} options  the options to customize the medium
 * @return {Object} a medium of the given type and with the specified options
 */
const create = (type, url, options = {}) => {
    if (!videoTypes[type]) {
        return null;
    }

    const videoId = options.id || `HTML5-Video-${Extensions.generateUUID()}`;
    const video = new videoTypes[type](url, options);
    registry[videoId] = video;

    return video;
};


/**
 * Creates an HTML5Video instance with the specified URL and options
 *
 * @paramm {String} url         the URL of the video to create
 * @param {Object} options      the options with which to customize the HTML5 video
 * @return {Object} an instance of an HTML5Video object with the specified options
 */
export const createHTML5Video = (url, options) => create("HTML5", url, options);


/**
 * Returns the video with the given ID, or null if no such video exists
 *
 * @param {String} videoId      the ID of the video to find
 * @return {Object} the video with the given ID, or null if no such video exists
 */
export const getVideoById = (videoId) => registry[videoId];
