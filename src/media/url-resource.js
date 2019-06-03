import * as MediaType from "../constants/media-type";
import { INVALID_URL } from "../constants/media-error-event-type";


export default class URLResource {

    constructor(url, mediaType = MediaType.VIDEO) {
        this.url = url;
        this.mediaType = mediaType;
    }

    setURL(url) {
        this.url = url;
    }

    getURL() {
        return this.url;
    }

    setMediaType(type) {
        const isValidType = Object.keys(MediaType).includes(type.toUpperCase());

        if (!isValidType) {
            throw new Error(INVALID_URL);
        }

        this.mediaType = type;
    }

    getMediaType() {
        return this.mediaType;
    }

    getExtension() {
        return this.url.substring(this.url.lastIndexOf(".") + 1);
    }


    toString() {
        return `URL Resource { URL: "${this.url}", MediaType: "${this.mediaType}" }`;
    }

}
