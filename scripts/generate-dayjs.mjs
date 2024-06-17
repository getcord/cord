#!/usr/bin/env node

import locales from 'dayjs/locale.json' assert { type: 'json' };
import * as prettier from 'prettier';

async function main() {
  let output =
    '// @' +
    `generated
// to regenerate, run "npm run codegen"
/* eslint-disable */
import 'dayjs/locale/en.js';
export async function loadLocale(l: string) {
  switch (l) {
`;
  const allKeys = locales.map((locale) => locale.key).sort();
  for (const localeKey of allKeys) {
    output += `case '${localeKey}': await import('dayjs/locale/${localeKey}.js'); return;\n`;
  }
  output += '\n}}';
  output += `export const ALL_LOCALES = [${allKeys
    .map((k) => `'${k}'`)
    .join(', ')}];`;
  console.log(
    await prettier.format(output, {
      filepath: 'out.ts',
      ...(await prettier.resolveConfig('out.ts')),
    }),
  );
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
