// This file is a .d.ts file, because those are excluded by default by rollup,
// and we don't want this module augmentation to end up exposed to code that
// depends on us.  That code may be using i18next themselves and want to provide
// their own module augmentation, and this will conflict with them doing that if
// it ends up in our build.

import type { TranslationResources } from './i18n.js';

// This tells i18next what shape the resources file is, which then feeds into
// the TypeScript types in a very clever way so that when you ask for a
// translation key, it can check that you're using a key that exists.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'default';
    resources: TranslationResources;
  }
}
