import { useState } from 'react';
import { createEditor } from 'external/src/editor/createEditor.ts';

export function useEditorCreator() {
  const [editor] = useState(() => createEditor());

  return editor;
}
