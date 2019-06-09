const MOBILE_REGEXP = /mobi|android|touch|mini/i;


/**
 * Returns the user agent for a given browser
 *
 * @return {String} the user agent for a given browser
 */
export const getUserAgent = () => navigator.userAgent.toLowerCase();


/**
 * Returns true if the browser with the specified user agent is running on a mobile device; otherwise, returns false
 *
 * @param {String} userAgent        the user agent string to test
 * @return {Boolean} true if the browser with the specified user agent is running on a moviel device;
 * otherwise, returns false
 */
export const isMobile = (userAgent) => {
    const agent = userAgent || getUserAgent();
    return MOBILE_REGEXP.test(agent);
};


/**
 * Returns true if HTML5 is supported and the browser can play MP4 movies; otherwise, returns false
 *
 * @returns {Boolean} true if HTML5 is supported and the browser can play MP4 movies; otherwise, returns false
 */
export const isHTML5Supported = () => {
    if (!("HTMLMediaElement" in window)) {
        return false;
    }

    let video = document.createElement("video");
    const canPlayMP4Movies = (video.canPlayType && video.canPlayType("video/mp4") !== "");
    video = null;

    return canPlayMP4Movies;
};


/**
 * Returns true if the given extension is that of a file that can be played by an HTML5 video element;
 *  otherwise, returns false.
 *
 * @param {String} extension        the file extension to check
 * @return {Boolean} true if the given extension is that of a file that can be played by an HTML5
 * video element; otherwise, returns false.
 */
export const isHTML5Video = (extension) => /mpeg|mp4|mov|m4a|ogg|3gp|avi/i.test(extension);


/**
 * Returns true if the given CSS property is available; otherwise, returns false
 *
 * @param {String} property     the CSS property to check
 * @return {Boolean} true if the given CSS property is available; otherwise, returns false;
 */
export const isCSSAvailable = (property) => {
    property = property.toLowerCase();

    const cssStyle = document.createElement("div").style;
    const vendorPropertyWebkit = `-webkit-${property}`;
    const vendorPropertyMoz = `-moz-${property}`;
    const vendorPropertyOpera = `-o-${property}`;
    const vendorPropertyMs = `-ms-${property}`;

    cssStyle.setProperty(vendorPropertyWebkit, "inherit", null);
    cssStyle.setProperty(vendorPropertyMoz, "inherit", null);
    cssStyle.setProperty(vendorPropertyOpera, "inherit", null);
    cssStyle.setProperty(vendorPropertyMs, "inherit", null);
    cssStyle.setProperty(property, "inherit", null);

    return cssStyle.getPropertyValue(vendorPropertyWebkit) === "inherit" ||
           cssStyle.getPropertyValue(vendorPropertyMoz) === "inherit" ||
           cssStyle.getPropertyValue(vendorPropertyOpera) === "inherit" ||
           cssStyle.getPropertyValue(vendorPropertyMs) === "inherit" ||
           cssStyle.getPropertyValue(property) === "inherit";
};
