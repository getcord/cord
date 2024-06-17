export const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = (err) => {
      reject({
        message: 'Error in image created for annotation',
        err,
        src: image.src,
      });
    };
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
