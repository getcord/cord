import type { BaseEditor } from 'slate';
import type { ReactEditor } from 'slate-react';
import type { HistoryEditor } from 'slate-history';
import type { MessageNode, MessageTextNode } from '@cord-sdk/types';

// Slate v0.61.0 introduced mandatory custom types that need to be configured at the start.
// See https://github.com/ianstormtaylor/slate/issues/3725.
// Example: https://github.com/ianstormtaylor/slate/blob/main/site/examples/custom-types.d.ts

type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;
type CustomElement = Exclude<MessageNode, MessageTextNode>;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: MessageTextNode;
  }
}
