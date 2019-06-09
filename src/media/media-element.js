import HTML                         from "@akwaba/html";

import * as EventDispatcher         from "../events/event-dispatcher";
import URLResource                  from "./url-resource";

import { VIDEO }                    from "../constants/media-type";
import { INVALID_CUSTOM_EVENT }     from "../events/event-dispatcher";
import { INVALID_MEDIA_CONTAINER }  from "../constants/media-error-event-type";


export default class MediaElement {

    static defaultOptions = {
        mediaType: VIDEO
    };


    constructor(url, options = {}) {
        this.options = Object.assign({}, MediaElement.defaultOptions, options);
        this.resource = new URLResource(url, this.options.mediaType);

        const { element } = this.options;
        this.element = (element && element.nodeType === HTML.nodeType.ELEMENT_NODE) ?
            element : HTML.getElement(element);

        if (!this.element) {
            throw new Error(INVALID_MEDIA_CONTAINER);
        }
    }


    /**
     * Publishes the given topic with the specified data
     *
     * @param {String} topic        the topic to publish
     * @param {Object} data		    the data to send with the topic
     */
    publish(topic, data = {}) {
        if (topic.indexOf(":") === -1) {
            throw new Error(INVALID_CUSTOM_EVENT);
        }

        EventDispatcher.dispatch(topic, data);
    }


    /**
     * Subscribes to the specified topic
     *
     * @param {String} topic	        the topic to subscribe to
     * @param {Function} callback		the callback to invoke when the topic event is fired
     */
    subscribe(topic, callback) {
        EventDispatcher.subscribe(topic, callback);
    }


    /**
     * Returns the URL resource for this media element
     *
     * @return {Object} the URL resource for this media element
     */
    getResource() {
        return this.resource;
    }


    /**
     * Sets the URL resource for this media element
     *
     * @param {Object} resource     the URL resource to set for this media element
     */
    setResource(resource) {
        this.resource = resource;
    }


    /**
     * Returns the HTML container for this media element
     *
     * @return {Node} the HTML container for this media element
     */
    getElement() {
        return this.element;
    }


    /**
     * Sets the HTML container for this media element
     *
     * @param {Node} element    the HTML container to set for this media element
     */
    setElement(element) {
        this.element = element;
    }

}
