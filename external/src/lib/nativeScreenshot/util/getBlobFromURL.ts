import { fetchWithCorsFix } from 'external/src/lib/nativeScreenshot/util/fetchWithCorsFix.ts';
import { getDataURLContent } from 'external/src/lib/nativeScreenshot/util/index.ts';

// KNOWN ISSUE
// -----------
// Can not handle redirect-url, such as when access 'http://something.com/avatar.png'
// will redirect to 'http://something.com/65fc2ffcc8aea7ba65a1d1feda173540'

const imageBlobCache: {
  [url: string]:
    | Promise<{ blob: string; contentType: string } | null>
    | undefined;
} = {};

function isFont(filename: string) {
  return /ttf|otf|eot|woff2?/i.test(filename);
}

export function getBlobFromURL(
  url: string,
  imagePlaceholder?: string,
): Promise<{ blob: string; contentType: string } | null> {
  let href = url.replace(/\?.*/, '');

  if (isFont(href)) {
    href = href.replace(/.*\//, '');
  }

  if (isGravatarUrl(url)) {
    const defaultImageUrl = getGravatarDefaultImageUrl(url);
    if (defaultImageUrl) {
      url = defaultImageUrl;
    }
  }

  const cached = imageBlobCache[href];
  if (cached) {
    return cached;
  }

  const failed = (reason: any) => {
    let placeholder = '';
    if (imagePlaceholder) {
      const parts = imagePlaceholder.split(/,/);
      if (parts && parts[1]) {
        placeholder = parts[1];
      }
    }

    let msg = `Failed to fetch resource: ${url}`;
    if (reason) {
      msg = typeof reason === 'string' ? reason : reason.message;
    }

    if (msg) {
      console.error(msg);
    }

    return placeholder;
  };

  const deferred = fetchWithCorsFix(url)
    .then((response) => {
      return new Promise((res) => {
        void response.blob().then((blob) => {
          res({
            blob,
            contentType: response.headers.get('Content-Type'),
          });
        });
      });
    })
    .then(
      ({ blob, contentType }: any) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve({
              contentType,
              blob: reader.result as string,
            });
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }),
    )
    .then(({ blob, contentType }: any) => ({
      contentType,
      blob: getDataURLContent(blob),
    }))
    .catch(() => new Promise((resolve, reject) => reject()));
  const promise = deferred.catch(failed) as Promise<{
    blob: string;
    contentType: string;
  } | null>;
  imageBlobCache[href] = promise;
  return promise;
}

// Fetching from `s.gravatar` seems to hit a CORS error,
// so we'll handle it differently.
function isGravatarUrl(url: string) {
  return url.startsWith('https://s.gravatar.com/avatar');
}

function getGravatarDefaultImageUrl(url: string) {
  const { searchParams } = new URL(url);
  // `d` or `default` are used to specify a default fallback avatar.
  // https://cy.gravatar.com/site/implement/images/
  const defaultImageEncodedURL =
    searchParams.get('d') ?? searchParams.get('default');
  if (!defaultImageEncodedURL) {
    return null;
  }

  return decodeURIComponent(defaultImageEncodedURL);
}
