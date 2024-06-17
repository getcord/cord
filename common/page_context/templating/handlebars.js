// Importing handlebars in a way that it works both in the browser and in Node
// is a bit tricky.  The solution here is to import a specific file from the
// distribution. However, that file has no TypeScript type definition file next
// to it. That's why there is a `handlebars.d.ts` file in this directory: it
// imports types from the right location. Together this gives us a working
// handlebars module.

import Handlebars from 'handlebars/dist/cjs/handlebars.js';
export default Handlebars;
