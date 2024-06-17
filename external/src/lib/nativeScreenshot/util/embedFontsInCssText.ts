import { fetchWithCorsFix } from 'external/src/lib/nativeScreenshot/util/fetchWithCorsFix.ts';

export async function embedFontsInCssText(
  stylesheetURL: string,
  cssText: string,
): Promise<string> {
  const regexUrlFind = /url\(["']?([^"')]+)["']?\)/g;
  const fontLocations = cssText.match(/url\([^)]+\)/g) || [];
  // Only request 1 format of font. If several, we assume first one that appears
  // is well-supported
  const requestedFontNames = new Set<string>();
  const alreadyRequestedFont = (name: string) => requestedFontNames.has(name);

  const fontLoadedPromises = fontLocations.map((location: string) => {
    // e.g. url('static/fonts/etc/<FONT_NAME>.woff2')
    const fontName = location.split('/').pop()?.split('.')[0] ?? null;
    if (!fontName || alreadyRequestedFont(fontName)) {
      return Promise.resolve;
    }
    requestedFontNames.add(fontName);
    let url = location.replaceAll(regexUrlFind, '$1');
    if (url.startsWith('data:')) {
      return Promise.resolve;
    }
    if (!url.startsWith('https://')) {
      url = new URL(url, stylesheetURL).href;
    }
    return new Promise((resolve, reject) => {
      fetchWithCorsFix(url)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.addEventListener('load', (_res: Event) => {
            // Side Effect
            cssText = cssText.replaceAll(location, `url(${reader.result})`);
            resolve([location, reader.result]);
          });
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });
  });
  return await Promise.all(fontLoadedPromises).then(() => cssText);
}
