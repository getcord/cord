import type { CSSProperties } from 'common/ui/style.ts';
import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import { todoContainerStyles, todoStyles } from 'common/ui/editorStyles.ts';

export const container = cordifyClassname('todo-bullet-container');
globalStyle(`.${container}`, {
  ...(todoStyles as CSSProperties),
});

export const checkboxContainer = cordifyClassname('todo-checkbox-container');
globalStyle(`:where(.${container}) .${checkboxContainer}`, {
  ...(todoContainerStyles as CSSProperties),
});

export const done = cordifyClassname('done');
globalStyle(`:where(.${container}.${done})`, {
  textDecoration: 'line-through',
});
