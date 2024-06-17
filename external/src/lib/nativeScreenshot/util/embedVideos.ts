export const SCREENSHOT_TEMP_ID_DATA_ATTRIBUTE = 'data-cord-screenshot-temp-id';

/**
 * The frame of the video we cloned for the screenshot might be out of date.
 * This function replaces it with what's currently on screen.
 * This will be run when users place an annotation, to get that specific frame.
 */
export function updateVideosFrame(clonedSvg: SVGSVGElement) {
  // Cloned video elements are converted to images using `convertVideoToImg`, hence why
  // querying for `img`.
  const clonedVideoElements = clonedSvg.querySelectorAll(
    `img[${SCREENSHOT_TEMP_ID_DATA_ATTRIBUTE}]`,
  );

  if (!clonedVideoElements.length) {
    return;
  }

  try {
    for (const clonedVideo of clonedVideoElements) {
      const videoOnPage = document.querySelector<HTMLVideoElement>(
        `video[${SCREENSHOT_TEMP_ID_DATA_ATTRIBUTE}="${clonedVideo.getAttribute(
          SCREENSHOT_TEMP_ID_DATA_ATTRIBUTE,
        )}"]`,
      );

      if (!videoOnPage) {
        continue;
      }

      videoOnPage.removeAttribute(SCREENSHOT_TEMP_ID_DATA_ATTRIBUTE);

      const newVideo = convertVideoToImg(videoOnPage);
      if (newVideo) {
        clonedVideo.parentElement?.replaceChild(newVideo, clonedVideo);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

export function convertVideoToImg(video: HTMLVideoElement) {
  try {
    // Capture video to canvas, export to image, and replace cloned <video /> with it.
    const canvas = document.createElement('canvas');
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = document.createElement('img');
    img.width = canvas.width;
    img.height = canvas.height;
    img.src = canvas.toDataURL();
    return img;
  } catch (e) {
    console.error(e);
    return;
  }
}
