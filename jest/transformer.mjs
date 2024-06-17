import crypto from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import esbuild from 'esbuild';

function replaceImports(src, filename, seen, result) {
  if (seen.has(filename)) {
    return;
  }
  let importsExhausted = false;
  let newSrc = '';
  for (const line of src.split('\n')) {
    if (importsExhausted) {
      newSrc += line + '\n';
      continue;
    }

    let importFilename;
    for (const prefix of ['#import ', '# import ']) {
      if (line.startsWith(prefix)) {
        importFilename = path.join(
          path.dirname(filename),
          line.slice(prefix.length),
        );
        break;
      }
    }

    if (importFilename) {
      const importSrc = readFileSync(importFilename, { encoding: 'utf8' });
      replaceImports(importSrc, importFilename, seen, result);
    } else {
      newSrc += line + '\n';
      importsExhausted = !line.startsWith('#') && line !== '';
    }
  }

  result.push(newSrc);
}

function graphqlToJS(src, filename) {
  const result = [];
  replaceImports(src, filename, new Set(), result);
  const graphqlContents = result.join('\n');
  return `
  import gql from 'graphql-tag';
  module.exports = gql(\`${graphqlContents}\`);
  `;
}

const ESBUILD_TRANSFORM_OPTIONS = {
  define: {
    'process.env.NODE_ENV': '"development"',
    'BUILDCONSTANTS.loggingProcessName': '"jest_test"',
    'BUILDCONSTANTS.sentryDSN': 'undefined',
  },
  minify: false,
  target: 'node18',
  format: 'esm',
  loader: 'ts',
  sourcemap: 'inline',
  tsconfigRaw: readFileSync('./tsconfig.json').toString(),
};

export default {
  // Default Jest caching breaks with graphql files. This is because when Jest
  // sees that a graphql has not changed it assumes that it can re-use the JS
  // version of that file from previous test runs. What Jest does not know, is
  // that when we turn .graphql files into JS, we actually read all the
  // imported graphql files too. That's why we have this custom getCacheKey()
  // method.
  getCacheKey(src, filename, options) {
    if (filename.endsWith('.graphql')) {
      src = graphqlToJS(src, filename);
    }
    return crypto
      .createHash('md5')
      .update(src)
      .update(filename)
      .update(JSON.stringify(options))
      .update(esbuild.version)
      .update(JSON.stringify(ESBUILD_TRANSFORM_OPTIONS))
      .digest('hex');
  },

  // This function is used by Jest to transform  our code into simple
  // Javascript that Jest knows how to run
  process(src, filename, _config, _options) {
    if (filename.endsWith('.graphql')) {
      src = graphqlToJS(src, filename);
    }
    const result = esbuild.transformSync(src, {
      ...ESBUILD_TRANSFORM_OPTIONS,
      sourcefile: filename,
    });
    return { code: result.code };
  },
};
