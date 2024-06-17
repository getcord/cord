import { createContext } from 'react';
import type { Range } from 'slate';

import type { ActionDispatch } from 'external/src/context/common.ts';
import type { ComposerState } from 'external/src/context/composer/ComposerState.ts';
import type { MessageContent } from 'common/types/index.ts';
import type { CustomEditor } from 'external/src/slateCustom.js';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type ComposerContextProps = {
  state: ComposerState;
  dispatch: ActionDispatch;
  getValue: () => MessageContent;
  setSelection: (selection: Range | null) => void;
  getSelection: () => Range | null;
  clearComposer: () => MessageContent;
  resetComposerValue: (value?: MessageContent) => void;
  setOnChangeRef: (
    onChangeRef: React.MutableRefObject<(value: MessageContent) => void>,
  ) => void;
  startAttachFlow: () => void;
  attachFiles: (files: FileList) => Promise<void>;
  editor: CustomEditor;
  composerValid: boolean;
  composerEmpty: boolean;
};

export const ComposerContext = createContext<
  ComposerContextProps | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
