## Scripts

This directory contains various tools. Each file is a separate tool.

### Bash tools

Files with the `.sh` suffix are bash scripts.

### JavaScript tools

Files with the `.js` suffix are written in JavaScript. They can be executed
using plain `node`.

For convenience, each file should be given execution permissions
(`chmod a+x filename.js`) and begin with the following line:

```
#!/usr/bin/env node
```

That way, the script can be run like this from the root of the monorepo:

```
# scripts/some_script.js
```

### TypeScript tools

File with the `.ts` suffix are written in TypeScript, and may import modules
from our TypeScript codebase. Our regular build tool will produce one
executable for each TypeScript file in this directory. Have a look at
`example.ts`! To build the TypeScript tools and run the example tool, `cd` into
the root directory of monorepo, then:

```
# ./build/index.mjs --mode=development --clean
# dist/scripts/example.js
```
