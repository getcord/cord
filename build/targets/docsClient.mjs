import { promises as fs } from 'fs';

import { glob } from 'glob';

import { rm, buildForBrowser, copy, outputPath } from '../util.mjs'; // eslint-disable-line no-restricted-imports
import { CORD_REACT_COMPONENTS_CSS_FILENAME } from '../const.mjs'; // eslint-disable-line no-restricted-imports
import { bundleCSS } from '../../scripts/bundle-CSS.mjs'; // eslint-disable-line no-restricted-imports

export default {
  watch: ['common', 'docs', 'opensource'],
  clean: async () => rm(outputPath('docs/static')),
  build: async () => {
    await fs.mkdir(outputPath('docs/static'), {
      recursive: true,
    });

    const hydrateFileBaseNames = (
      await glob('docs/hydrate/**/*.tsx', { posix: true })
    ).map((filename) => {
      const baseNameMatch = /^docs\/hydrate\/(.*)\.tsx$/.exec(filename);
      if (!baseNameMatch || !baseNameMatch[1]) {
        throw new Error(
          `docs: there is something wrong with the hydrate file's name: ${filename}`,
        );
      }
      return baseNameMatch[1];
    });

    const [cssBundle] = await Promise.all([
      bundleCSS(),
      ...hydrateFileBaseNames.map(async (baseName) => {
        await buildForBrowser({
          entryPoints: [`docs/hydrate/${baseName}.tsx`],
          define: {
            CORD_REACT_PACKAGE_VERSION: JSON.stringify('docs'),
          },
          outfile: outputPath(`docs/static/${baseName}.js`),
          sentry: {
            project: 'docs-client',
            prefix: `https://${process.env.DOCS_SERVER_HOST}`,
          },
        });
      }),
    ]);

    if (cssBundle) {
      await fs.mkdir(outputPath(`docs/static/css`), {
        recursive: true,
      });
      await fs.writeFile(
        outputPath(`docs/static/css/${CORD_REACT_COMPONENTS_CSS_FILENAME}`),
        cssBundle.css,
      );
    }

    await copy('docs/static', outputPath('docs/'));
  },
};
