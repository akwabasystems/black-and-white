import { isString } from "@akwaba/object-extensions/src/is-string";
import * as MediaType from "../constants/media-type";
import { INVALID_URL } from "../constants/media-error-event-type";


export default class URLResource {

    constructor(url, mediaType = MediaType.VIDEO) {
        this._url = url;
        this._mediaType = mediaType;
    }

    set url(value) {
        this._url = value;
    }

    get url() {
        return this._url;
    }

    set mediaType(type) {
        const isValidType = Object.keys(MediaType).includes(type.toUpperCase());

        if (!isValidType) {
            throw new Error(INVALID_URL);
        }

        this._mediaType = type;
    }

    get mediaType() {
        return this._mediaType;
    }

    get extension() {
        return this._url.substring(this._url.lastIndexOf(".") + 1);
    }

    toString() {
        return `URL Resource { URL: "${this._url}", MediaType: "${this._mediaType}" }`;
    }

};
