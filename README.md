# @akwaba/black-and-white

## Overview

![Black and White Media Player](https://s3-us-west-1.amazonaws.com/rendezvous7.net/media/black-and-white/bw-media-player.jpg)

Black-And-White is a minimalist media player that makes it easy to embed high-quality video players in any application. The current implementation supports HTML5 videos only. However, due to its modular architecture, it will be able to support Flash and Quicktime video elements in upcoming updates.

This module is published on [npmjs.com](https://www.npmjs.com) as `@akwaba/black-and-white`.


## Usage

The following code snippet shows the simplest way to create an HTML5 video player.

```js

import BlackAndWhite from '@akwaba/black-and-white';

const mediaPlayer = new BlackAndWhite.MediaPlayer({
    id: "myCoolPlayer",
    url: "path/to/video.mp4",
    element: document.getElementById("container")
});

// Note: Please note that the URL paths and the `container` element are just examples. 
// Substitute them with the actual paths to the video resource URL and the ID of the container element,

```


### Player options

Following are some options that can be set when creating a video player.

- `url`: The URL of the video to play. This property is required.
- `id`: A unique identifier for the media player. This property is optional, and a default one is generated when none is specified.
- `element`: The DOM element, or the ID of the DOM element, in which to render the media player. This property is required, and an `INVALID_MEDIA_CONTAINER` exception is thrown if the target element is invalid.
- `autoplay`: Specifies whether to automatically play the video when the player is created. Defaults to `false`.
- `width`: The width of the video. This value should be set only when using a fluid width (`100%`). The `scaleFactor` should be used instead.
- `height`: The height of the video. This value should be set only when using a fluid height (`100%`). The `scaleFactor` should be used instead.
- `scaleFactor`: A number that is multiplied by `16` to compute the width and by `9` to compute the height of the video, thus maintaining a `16:9` aspect ratio. Defaults to `40`.
- `poster`: The URL of the poster for this media player. The preferred file format is `JPG`.
- `enableAirplay`: A flag that specifies whether to enable `Airplay`. This is currently set to `false` and is intended for Safari on desktop. On mobile devices, the player uses native controls.
- `mediaType`: Specifies the type of media for this player. Defaults to `video`. It is not recommended to change this property, as it is automatically set based on the extension of the media resource URL.


## Supported video formats

The following video formats and extensions are currently supported by the application: `MPEG`, `MP4`, `MOV`, `M4A`, `OGG`, `3GP`, and `AVI`.


## A note on video sizes

Black-And-White uses an aspect ratio of `16:9` and a default scale factor of `40`. This means that the video will have an initial width of `640px` and an initial height of `360px`.

As a result, it is recommended to maintain this aspect ratio when changing the video size. Following are some common sizes with their respective scaling factor. Those measurements are based on recommended video encoding specifications.

- `512x288` (scale factor: `32`)
- `640x360` (scale factor: `40`)
- `768x432` (scale factor: `48`)
- `960x540` (scale factor: `60`)
- `1024x576` (scale factor: `64`)
- `1280x720` (scale factor: `80`)

For instance, the following code snippet creates a player with a width of `768px` and a height of `432px`.

```js

import BlackAndWhite from '@akwaba/black-and-white';

const mediaPlayer = new BlackAndWhite.MediaPlayer({
    id: "myCoolPlayer",
    url: "path/to/video.mp4",
    element: "container",
    scaleFactor: 48
});

```


### Specifying a custom size

You can still specify a custom size by setting the `width` and `height` properties. In that case, you do not need to specify the `scaleFactor` property.

For instance, the following code snippet creates a fluid video player that stretches to the width and height of its parent container.

```js

import BlackAndWhite from '@akwaba/black-and-white';

const mediaPlayer = new BlackAndWhite.MediaPlayer({
    id: "myCoolPlayer",
    url: "path/to/video.mp4",
    element: "container",
    width: "100%",
    height: "100%"
});

```

### Rendering on mobile devices

On mobile devices, the `width` and `height` properties are automatically set to `100%`. In addition, the native video controls are used.


## License
Copyright (c) 2019 Akwaba Systems, Inc.
