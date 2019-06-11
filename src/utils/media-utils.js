import { isString } from "@akwaba/object-extensions";


/**
 * Returns the extension of the given file
 *
 * @param {String} file     the file for which to return the extension
 * @return {String} the extension of the given file
 */
export const getFileExtension = (file) => {
    return isString(file) ? file.substring(file.lastIndexOf(".") + 1) : "";
};


/**
 * Formats the given time in the "h:mm:ss" format.
 *
 * @param {Number} time             the time to format, in seconds
 * @param {Boolean} displayHours    a flag that specifies whether to display the hours
 * @return {String} a formatted string representation of the given time
*/
export const formatTime = (time, displayHours = true) => {
    const ONE_HOUR = 3600;
    const minutes = Math.floor((time / 60) % 60);
    let hours;

    if (displayHours) {
        hours = Math.floor(time / ONE_HOUR);
    }

    const seconds = Math.floor(time % 60);
    const formattedMinutes = (minutes < 10) ? `0${minutes}` : minutes;
    const formattedSeconds = (seconds < 10) ? `0${seconds}` : seconds;

    return displayHours ? `${hours}:${formattedMinutes}:${formattedSeconds}` :
        `${formattedMinutes}:${formattedSeconds}`;
};


/**
 * Formats the specified remainig time in the "-h:mm:ss" format.
 *
 * @param {Number} time             the remainig time to format, in seconds
 * @param {Boolean} displayHours    a flag that specifies whether to display the hours
 * @return {String} a formatted string for the given remainig time
 */
export const formatRemainingTime = (time, displayHours = true) => {
    return `-${formatTime(time, displayHours)}`;
};
