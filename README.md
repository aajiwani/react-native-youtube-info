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

// Methods

// Fetch Highest Quality Available Image
videoInfo.getHighestQualityImage();

// Fetch Highest Quality Available Video
videoInfo.getHighestQualityVideo();

// Fetch Lowest Quality Available Image
videoInfo.getLowestQualityImage();

// Fetch Lowest Quality Available Video
videoInfo.getLowestQualityVideo();

// Properties
videoInfo.title
videoInfo.author
videoInfo.keywords
videoInfo.player_response
videoInfo.status
videoInfo.list_videos
videoInfo.images
```