export function fetchWithCorsFix(
  url: string,
  updateTimeTaken?: (ms: number) => void,
) {
  return Promise.resolve().then(() => {
    const time = performance.now();
    return fetch(url)
      .then((response) => {
        updateTimeTaken?.(performance.now() - time);
        return response;
      })
      .catch(() => {
        // Potentially a CORS error, caused by a cached no-cors request (e.g.
        // <link rel="stylesheet">). Clear cache and replace value with
        // current response, which will have the Access-Control header
        // if it is set. We don't have access to what the error is.
        // More info:
        // - https://stackoverflow.com/a/45081016.
        // - https://forums.aws.amazon.com/thread.jspa?threadID=342401&tstart=0
        return fetch(url, { cache: 'reload' })
          .then((response) => {
            updateTimeTaken?.(performance.now() - time);
            return response;
          })
          .catch((error) => {
            console.warn(`Annotation screenshot: unable to fetch from ${url}`);
            throw error;
          });
      });
  });
}
