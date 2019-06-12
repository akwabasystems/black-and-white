import URLResource              from "./src/media/url-resource";
import MediaElement             from "./src/media/media-element";
import HTML5Video               from "./src/media/html5-video";
import MediaPlayer              from "./src/media/media-player";
import * as MediaDetector       from "./src/media/media-detector";
import * as MediaFactory        from "./src/media/media-factory";
import * as MediaPlayerState    from "./src/constants/media-player-state";
import * as MediaType           from "./src/constants/media-type";
import * as MediaErrorEvent     from "./src/constants/media-error-event-type";
import * as ScaleMode           from "./src/constants/scale-mode";
import * as EventDispatcher     from "./src/events/event-dispatcher";


export default {
    EventDispatcher,
    URLResource,
    MediaElement,
    HTML5Video,
    MediaPlayer,
    MediaDetector,
    MediaFactory,
    MediaPlayerState,
    MediaType,
    MediaErrorEvent,
    ScaleMode
};
