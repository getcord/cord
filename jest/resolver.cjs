const bad = ['uuid', 'nanoid'];

module.exports = (path, options) => {
  return options.defaultResolver(path, {
    ...options,
    packageFilter: (pkg) => {
      // Work around jest-specific importing issue. See:
      // https://jestjs.io/docs/28.x/upgrading-to-jest28#packagejson-exports
      // https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149
      // https://github.com/microsoft/accessibility-insights-web/pull/5421/commits/9ad4e618019298d82732d49d00aafb846fb6bac7
      const name = pkg.name;
      if (bad.includes(name)) {
        delete pkg['exports'];
        delete pkg['module'];
      }
      return pkg;
    },
    pathFilter: (_pkg, parentPath, relativePath) => {
      // If this is a .js import from inside opensource/sdk-js, it really is an
      // import of a TS file, not a JS file.  Strip the .js suffix, which means
      // jest (unlike Node) will look around for various extensions and find the
      // .ts file.
      if (
        parentPath.includes('opensource/sdk-js') &&
        relativePath.endsWith('.js')
      ) {
        return relativePath.slice(0, -3);
      }
      return relativePath;
    },
  });
};
