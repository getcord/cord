import { embedFontsInCssText } from 'external/src/lib/nativeScreenshot/util/embedFontsInCssText.ts';
import { fetchWithCorsFix } from 'external/src/lib/nativeScreenshot/util/fetchWithCorsFix.ts';

export async function fetchCssWithFontsEmbedded(url: string) {
  return await fetchWithCorsFix(url)
    .then((res) => res.text())
    .then((cssText) => embedFontsInCssText(url, cssText))
    .then((text) => ({ cssStrings: parseCSS(text) }))
    .catch((e) => {
      console.error('Cord Failed to fetch font', e);
      return { cssStrings: [] };
    });
}

function parseCSS(source: string) {
  if (source === undefined) {
    return [];
  }

  let cssText = source;
  const css = [];
  const cssKeyframeRegex = '((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})';
  const combinedCSSRegex =
    '((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]' +
    '*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})'; // to match css & media queries together
  const cssCommentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
  const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;

  // strip out comments
  cssText = cssText.replace(cssCommentsRegex, '');

  const keyframesRegex = new RegExp(cssKeyframeRegex, 'gi');
  let arr;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    arr = keyframesRegex.exec(cssText);
    if (arr === null) {
      break;
    }
    css.push(arr[0]);
  }
  cssText = cssText.replace(keyframesRegex, '');

  // unified regex
  const unified = new RegExp(combinedCSSRegex, 'gi');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    arr = importRegex.exec(cssText);

    if (arr === null) {
      arr = unified.exec(cssText);
      if (arr === null) {
        break;
      } else {
        importRegex.lastIndex = unified.lastIndex;
      }
    } else {
      unified.lastIndex = importRegex.lastIndex;
    }
    css.push(arr[0]);
  }

  return css;
}
