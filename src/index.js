import axios from "axios";
import { parse } from "querystring";
import _ from "lodash";

function prepareImageChunk(width, height, url, name) {
  return {
    width: width,
    height: height,
    url: url,
    name: name
  };
}

export default class Youtube {
  /**
   * A private method to supply the formed crackpot youtube URL
   * @param {string} youtubeId The youtube id from the watch URL
   */
  static _crackpotUrl(youtubeId) {
    let formedUrl = `http://www.youtube.com/get_video_info?video_id=${youtubeId}&el=embedded&ps=default&eurl=&gl=US&hl=en`;
    return formedUrl;
  }

  static _structureYoutubeResponse(response) {
    let parsedBody = parse(response);
    let requiredBody = _.pick(parsedBody, [
      "title",
      "author",
      "keywords",
      "thumbnail_url",
      "url_encoded_fmt_stream_map", // Body to JSON (After , seperation)
      "player_response", // String to JSON
      "status"
    ]);

    let listOfVideos = requiredBody["url_encoded_fmt_stream_map"].split(",");
    delete requiredBody["url_encoded_fmt_stream_map"];
    requiredBody["list_videos"] = _.map(listOfVideos, item => parse(item));

    requiredBody["player_response"] = JSON.parse(
      requiredBody["player_response"]
    );

    requiredBody["images"] = Youtube._mapThumbnailUrl(requiredBody);
    delete requiredBody["thumbnail_url"];

    return requiredBody;
  }

  static _mapThumbnailUrl(body) {
    // Lets try the unknown
    let thumbnails = [
      prepareImageChunk(
        480,
        360,
        body.thumbnail_url.substring(0, body.thumbnail_url.lastIndexOf("/")) +
          "/0.jpg",
        "Thumb0"
      ),
      prepareImageChunk(
        120,
        90,
        body.thumbnail_url.substring(0, body.thumbnail_url.lastIndexOf("/")) +
          "/1.jpg",
        "Thumb1"
      ),
      prepareImageChunk(
        120,
        90,
        body.thumbnail_url.substring(0, body.thumbnail_url.lastIndexOf("/")) +
          "/2.jpg",
        "Thumb2"
      ),
      prepareImageChunk(
        120,
        90,
        body.thumbnail_url.substring(0, body.thumbnail_url.lastIndexOf("/")) +
          "/3.jpg",
        "Thumb3"
      )
    ];

    let bigImages = [
      prepareImageChunk(
        480,
        360,
        body.thumbnail_url.substring(0, body.thumbnail_url.lastIndexOf("/")) +
          "/hqdefault.jpg",
        "High"
      ),
      prepareImageChunk(
        320,
        180,
        body.thumbnail_url.substring(0, body.thumbnail_url.lastIndexOf("/")) +
          "/mqdefault.jpg",
        "Medium"
      ),
      prepareImageChunk(
        120,
        90,
        body.thumbnail_url.substring(0, body.thumbnail_url.lastIndexOf("/")) +
          "/default.jpg",
        "Normal"
      ),
      prepareImageChunk(
        640,
        480,
        body.thumbnail_url.substring(0, body.thumbnail_url.lastIndexOf("/")) +
          "/sddefault.jpg",
        "Standard"
      ),
      prepareImageChunk(
        1920,
        1080,
        body.thumbnail_url.substring(0, body.thumbnail_url.lastIndexOf("/")) +
          "/maxresdefault.jpg",
        "MaxResolution"
      )
    ];

    return {
      thumbnails: thumbnails,
      big: bigImages
    };
  }

  static _verifyImages(body) {
    let proms = [];
    let images = body.images;

    _.forEach(images.thumbnails, function(image) {
      proms.push(
        axios({
          method: "HEAD",
          url: image.url,
          cache: "no-cache"
        }).then(response => {
          if (response.status === 200) {
            return image;
          }
          return false;
        })
      );
    });

    _.forEach(images.big, function(image) {
      proms.push(
        axios({
          method: "HEAD",
          url: image.url,
          cache: "no-cache"
        }).then(response => {
          if (response.status === 200) {
            return image;
          }
          return false;
        })
      );
    });

    return Promise.all(proms).then(values => {
      images = _.filter(values, function(item) {
        return item;
      });
      body.images = images;
      return body;
    });
  }

  static _attachHelperMethods(body) {
    let videoOrdered = Youtube._mapOrder(
      body.list_videos,
      ["highres", "hd1080", "hd720", "large", "medium", "small", "tiny"],
      "quality"
    );

    let imagesOrdered = _.filter(body.images, item => {
      return !["Thumb1", "Thumb2", "Thumb3"].includes(item.name);
    });
    imagesOrdered = Youtube._mapOrder(
      imagesOrdered,
      ["MaxResolution", "Standard", "High", "Thumb0", "Medium", "Normal"],
      "name"
    );

    body.getHighestQualityImage = () => {
      return _.first(imagesOrdered);
    };

    body.getHighestQualityVideo = () => {
      return _.first(videoOrdered);
    };

    body.getLowestQualityImage = () => {
      return _.last(imagesOrdered);
    };

    body.getLowestQualityVideo = () => {
      return _.last(videoOrdered);
    };

    return body;
  }

  /**
   * Sort array of objects based on another array
   */

  static _mapOrder(array, order, key) {
    array.sort(function(a, b) {
      var A = a[key],
        B = b[key];

      if (order.indexOf(A) > order.indexOf(B)) {
        return 1;
      } else {
        return -1;
      }
    });
    return array;
  }

  static _checkForYoutubeFailure(response) {
    if (response.indexOf("status=fail") !== -1) {
      let parsedBody = parse(response);
      let error = new Error(parsedBody.reason);
      error.code = parsedBody.errorcode;
      throw error;
    }
    return response;
  }

  /**
   * A method to fetch the required youtube info from the crackpot URL
   * @param {string} youtubeId The youtube id from the watch URL
   * example: https://www.youtube.com/watch?v=HmZKgaHa3Fg
   * HmZKgaHa3Fg would be the youtube video id
   */
  static getVideoInfo(youtubeId) {
    let youtubeUrl = Youtube._crackpotUrl(youtubeId);
    return axios.get(youtubeUrl)
      .then(response => {
        // If we get a positive response, lets take it an try getting the information out
        if (response.status === 200) {
          return response.data;
        } else {
          throw new Error("Response code is not acceptable to proceed further");
        }
      })
      .then(response => Youtube._checkForYoutubeFailure(response))
      .then(response => Youtube._structureYoutubeResponse(response))
      .then(body => Youtube._verifyImages(body))
      .then(body => Youtube._attachHelperMethods(body));
  }
}
