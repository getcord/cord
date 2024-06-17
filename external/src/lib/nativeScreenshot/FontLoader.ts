import { BaseCloner } from 'external/src/lib/nativeScreenshot/BaseCloner.ts';
import { embedFontsInCssText } from 'external/src/lib/nativeScreenshot/util/embedFontsInCssText.ts';
import { fetchCssWithFontsEmbedded } from 'external/src/lib/nativeScreenshot/util/fetchCssWithFontsEmbedded.ts';
import { embedFontsInCssTextUsingWorker } from 'external/src/lib/nativeScreenshot/worker/embedFontsInCssText.ts';
import { fetchCssWithFontsEmbeddedUsingWorker } from 'external/src/lib/nativeScreenshot/worker/fetchCssWithFontsEmbedded.ts';
import NativeScreenshot from 'external/src/lib/nativeScreenshot/worker/NativeScreenshot.ts';

const stylesheetFontCssCache = new Map<CSSStyleSheet, string[]>([]);

export class FontLoader extends BaseCloner {
  private webWorkerAccessible = Boolean(NativeScreenshot.getWorker());
  private embedFonts = this.webWorkerAccessible
    ? embedFontsInCssTextUsingWorker
    : embedFontsInCssText;
  private fetchCss = this.webWorkerAccessible
    ? fetchCssWithFontsEmbeddedUsingWorker
    : fetchCssWithFontsEmbedded;

  async createFontStylesheet() {
    const stylesheets = [...this.containingDocument.styleSheets];
    const promises = stylesheets.map((stylesheet) =>
      this.stylesheetToFontCss(stylesheet),
    );
    return await Promise.all(promises).then((data) => {
      const uniqueRules = [...new Set(data.flat())];
      const fontsStyleNode = this.containingDocument.createElement('style');
      fontsStyleNode.appendChild(
        this.containingDocument.createTextNode(uniqueRules.join('\n')),
      );
      return fontsStyleNode;
    });
  }

  private stylesheetToFontCss(stylesheet: CSSStyleSheet) {
    if (stylesheetFontCssCache.get(stylesheet)) {
      return stylesheetFontCssCache.get(stylesheet)!;
    }
    const doc = this.containingDocument.implementation.createHTMLDocument();
    const style = doc.createElement('style');
    doc.head.appendChild(style);
    const tempStylesheet = style.sheet!;

    let stylesheetAccessible = true;
    try {
      // stylesheet.cssRules is inaccessible for external stylesheets
      stylesheet.cssRules;
      // stylesheet.cssRules can be null
      stylesheetAccessible = Boolean(stylesheet.cssRules);
    } catch {
      stylesheetAccessible = false;
    }

    const promises = [];
    let importIndex = 0;
    if (stylesheetAccessible) {
      for (const rule of stylesheet.cssRules) {
        if (rule.type !== CSSRule.IMPORT_RULE) {
          if (rule.type === CSSRule.FONT_FACE_RULE && stylesheet.href) {
            promises.push(
              this.embedFonts(stylesheet.href, rule.cssText)
                .then((cssText) => {
                  tempStylesheet.insertRule(cssText);
                })
                .catch((e) =>
                  console.error(
                    `[CORD] Failed to embed fonts. Screenshots might look broken.`,
                    e,
                  ),
                ),
            );
          } else {
            try {
              tempStylesheet.insertRule(rule.cssText);
            } catch {
              // insertRule can throw if the rule we're trying to add
              // couldn't be parsed. We ignore this error, as rejecting
              // this promise means we wouldn't append any font style to the clone.
              continue;
            }
          }
        } else {
          const index = importIndex;
          promises.push(
            this.fetchCss((rule as CSSImportRule).href)
              .then((data) => {
                for (const ruleText of data?.cssStrings ?? []) {
                  tempStylesheet.insertRule(ruleText, index);
                }
              })
              .catch((e) =>
                console.error(
                  `[CORD] Could not fetch fonts. Screenshots might look broken.`,
                  e,
                ),
              ),
          );
          importIndex++;
        }
      }
    } else if (stylesheet.href !== null) {
      promises.push(
        this.fetchCss(stylesheet.href)
          .then((data) => {
            for (const ruleText of data?.cssStrings ?? []) {
              try {
                tempStylesheet.insertRule(ruleText);
              } catch {
                // insertRule can throw if the rule we're trying to add
                // couldn't be parsed. We ignore this error, as rejecting
                // this promise means we wouldn't append any font style to the clone.
                continue;
              }
            }
          })
          .catch((e) => {
            console.error(
              `[CORD] Could not fetch fonts. Screenshots might look broken`,
              e,
            );
          }),
      );
    }
    return Promise.all(promises).then(() => {
      const fontCssText = [...tempStylesheet.cssRules]
        .filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
        .map((rule) => rule.cssText);
      stylesheetFontCssCache.set(stylesheet, fontCssText);
      return fontCssText;
    });
  }
}
