### React Native Youtube Info

Gets youtube info from crackpot URL (http://www.youtube.com/get_video_info)


## Installation

```
npm install --save react-native-youtube-info
```

OR

```
yarn add react-native-youtube-info
```

## Usage

```
import Youtube from "react-native-youtube-info";

let videoInfo = Youtube.getVideoInfo("2MpUj-Aua48");

videoInfo.then(youtubeObj => {

    // Methods

    // Fetch Highest Quality Available Image
    youtubeObj.getHighestQualityImage();

    // Fetch Highest Quality Available Video
    youtubeObj.getHighestQualityVideo();

    // Fetch Lowest Quality Available Image
    youtubeObj.getLowestQualityImage();

    // Fetch Lowest Quality Available Video
    youtubeObj.getLowestQualityVideo();

    // Properties
    youtubeObj.title
    youtubeObj.author
    youtubeObj.keywords
    youtubeObj.player_response
    youtubeObj.status
    youtubeObj.list_videos
    youtubeObj.images

});

```