import Handlebars from 'common/page_context/templating/handlebars.js';
import type { Location } from 'common/types/index.ts';
import type { PageContextNameFunction } from 'common/page_context/util.ts';
import {
  contextDataToString,
  getDocumentTitle,
} from 'common/page_context/util.ts';

type ContextType = Record<string, any>;
const handlebars = Handlebars.create();
export const compile = (template: string) =>
  handlebars.compile<ContextType>(template, { noEscape: true });

export function templateToNameFunction(
  template: string,
): PageContextNameFunction {
  const compiled = compile(template);
  return (context: Location, document?: Document) =>
    trimAndCollapseWhitespace(
      compiled({
        context: { ...context },
        document,
        title: getDocumentTitle(document),
      }),
    );
}

export function trimAndCollapseWhitespace(s: string) {
  // Replace all sequences of whitespace (space, tab, newline, etc.) with a
  // single space character, and remove any whitespace at beginning or end of
  // the string.
  return s.replace(/\s+/g, ' ').trim();
}

// The `assign` helper can be used with two arguments (key and value, where key
// must be a string), or as a block helper like this:
// `{{#assign key}}value{{/assign}}`.
handlebars.registerHelper('assign', function (this: any, ...args: any[]) {
  const key = args.shift();
  const options = args.pop();

  if (typeof key !== 'string') {
    throw new Error('assign: key must be a string');
  }

  if (args.length === 0 && options && options.fn) {
    this[key] = options.fn(this);
    return;
  }

  if (args.length === 1 && options && !options.fn) {
    this[key] = args[0];
    return;
  }

  throw new Error('assign used in a wrong way');
});

handlebars.registerHelper(
  'regexReplace',
  function (this: any, regex: any, replacement: any, options: any) {
    const rex = new RegExp(`${regex}`, 'g');
    return options.fn(this).replace(rex, `${replacement}`);
  },
);

handlebars.registerHelper('contextData', (data: any) => {
  return contextDataToString(data);
});

handlebars.registerHelper('querySelector', (node: any, selector: any) => {
  if (node && node.querySelector && typeof selector === 'string') {
    return node.querySelector(selector);
  }
});

handlebars.registerHelper('textContent', (element: any) => {
  return element?.textContent;
});

handlebars.registerHelper('get', (element: any, attributeName: any) => {
  if (element && typeof attributeName === 'string') {
    return element?.[attributeName];
  }
});

handlebars.registerHelper('parentNode', (node: any) => {
  return node?.parentNode;
});

handlebars.registerHelper('decodeURI', (str: any) => {
  if (typeof str == 'string') {
    return decodeURI(str);
  } else {
    return undefined;
  }
});
