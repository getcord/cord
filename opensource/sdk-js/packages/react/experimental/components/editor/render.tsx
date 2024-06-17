import * as React from 'react';
import type { MessageTextNode } from '@cord-sdk/types';
import * as classes from '../../../components/editor/editor.css.js';

export const wrapTextNodeWithStyles = (
  node: JSX.Element,
  styles: MessageTextNode,
): JSX.Element => {
  let result = node;

  if (styles.bold) {
    result = <strong>{result}</strong>;
  }
  if (styles.italic) {
    result = <em>{result}</em>;
  }
  if (styles.underline) {
    result = <u>{result}</u>;
  }
  if (styles.code) {
    result = <span className={classes.inlineCode}>{result}</span>;
  }

  return result;
};
