import URLResource from "../../../src/media/url-resource";
import * as MediaType from "../../../src/constants/media-type";


describe("URLResource", () => {
    
    const url = "https://media.1ua.university/lectures/this-is-cs50.mp4";


    it("should construct a URL resource", () => {
        const resource = new URLResource(url);

        expect(resource).toBeDefined();
        expect(resource.url).toBe(url);
    });

    it("should set the media type to 'video' by default", () => {
        const resource = new URLResource(url);
        expect(resource.mediaType).toBe(MediaType.VIDEO);
    });

    it("should set the media type to a different type", () => {
        const resource = new URLResource(url);
        expect(resource.mediaType).toBe(MediaType.VIDEO);

        resource.mediaType = MediaType.AUDIO;
        expect(resource.mediaType).toBe(MediaType.AUDIO);
    });

    it("should throw an exception when the media type is set to an invalid type", () => {
        const resource = new URLResource(url);

        try {

            resource.mediaType = "Unknown-Type";
        
        } catch(e) {
            expect(e.message).toBe("INVALID_URL");
        }
    });

    it("should return the extension based on the URL string", () => {
        const resource = new URLResource(url);
        expect(resource.extension).toBe("mp4");

        resource.url = "/audio/intro.mp3";
        resource.mediaType = MediaType.AUDIO;
        expect(resource.extension).toBe("mp3");
        expect(resource.toString()).toBe('URL Resource { URL: "/audio/intro.mp3", MediaType: "audio" }');
    });

});