import {
  useReducer,
  useMemo,
  useCallback,
  useState,
  useRef,
  createContext,
  useEffect,
} from 'react';
import { Slate } from 'slate-react';
import type { Range } from 'slate';
import { v4 as uuid } from 'uuid';
import * as Sentry from '@sentry/react';

import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import ComposerReducer from 'external/src/context/composer/ComposerReducer.ts';
import type {
  ComposerAction,
  ComposerAttachment,
  ComposerFileAttachmentType,
} from 'external/src/context/composer/ComposerState.ts';
import {
  createComposerEmptyValue,
  hasComposerOnlyWhiteSpaces,
  InitialState,
  isComposerEmpty,
} from 'external/src/context/composer/ComposerState.ts';
import type { MessageContent, UUID } from 'common/types/index.ts';
import { useEditorCreator } from 'external/src/effects/useEditorCreator.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useFileUploader } from 'external/src/effects/useFileUploader.ts';
import {
  assertValidUploadDataURL,
  readFileAsync,
  validateFileForUpload,
} from 'common/uploads/index.ts';
import { AddAttachment } from 'external/src/context/composer/actions/AddAttachment.ts';
import { SetAttachmentUploadStatus } from 'external/src/context/composer/actions/SetAttachmentUploadStatus.ts';
import { useUpdatingRef } from 'external/src/effects/useUpdatingRef.ts';
import { ResetComposerStateAction } from 'external/src/context/composer/actions/ResetComposerState.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

type Props = {
  initialComposerAction?: ComposerAction;
  initialComposerAttachment?: ComposerAttachment;
};

// This should be avoided wherever possible, because it will cause re-renders on
// every value change. You can use ComposerContext.getValue to get the latest
// value without causing these re-renders
const ComposerLatestValueContext = createContext<MessageContent>(
  createComposerEmptyValue(),
);

export function ComposerProvider({
  initialComposerAction,
  initialComposerAttachment,
  children,
}: React.PropsWithChildren<Props>) {
  const editor = useEditorCreator();

  // We don't expose selection and value in context, otherwise everything below
  // would re-render on every single keypress. We instead surface getValue and
  // getSelection methods which are stable as they grab the value from a ref
  const [selection, setSelection] = useState<Range | null>(null);
  const [initialValue] = useState(createComposerEmptyValue);
  const valueRef = useUpdatingRef(editor.children);
  const selectionRef = useUpdatingRef(selection);
  const getValue = useCallback(() => valueRef.current, [valueRef]);
  const getSelection = useCallback(() => selectionRef.current, [selectionRef]);

  const [state, dispatch] = useReducer(
    ComposerReducer,
    InitialState({
      initialComposerAction,
      initialComposerAttachment,
    }),
  );

  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;

  const { thread } = useContextThrowingIfNoProvider(Thread2Context);

  const resetComposerValue = useCallback(
    (value?: MessageContent) => {
      setSelection(null);
      const point = { path: [0, 0], offset: 0 };
      editor.selection = { anchor: point, focus: point };
      editor.history = { redos: [], undos: [] };
      editor.children = value?.length ? value : createComposerEmptyValue();
    },
    [editor],
  );

  const attachFileInputRef = useRef<HTMLInputElement>(null);
  const { logError } = useLogger();

  const startAttachFlow = useCallback(() => {
    attachFileInputRef.current?.click();
  }, [attachFileInputRef]);

  const { createFileForUpload, uploadFile } = useFileUploader();

  const attachFile = useCallback(
    async (name: string, dataURL: string, threadOrgID?: UUID) => {
      try {
        const { mimeType, buffer } = assertValidUploadDataURL(name, dataURL);

        const attachment: ComposerFileAttachmentType = {
          id: uuid(),
          type: 'file',
          file: {
            id: uuid(),
            name,
            mimeType,
            url: dataURL,
            uploadStatus: 'uploading',
            size: buffer.length,
            threadOrgID,
          },
        };
        dispatch(AddAttachment(attachment));
        const file = await createFileForUpload(attachment.file, buffer.length);
        if (file) {
          void uploadFile({
            ...file,
            buffer,
            updateLocalFileUploadStatus: (status) => {
              dispatch(
                SetAttachmentUploadStatus({
                  id: attachment.id,
                  url: file.downloadURL,
                  status,
                }),
              );
            },
            threadOrgID,
          });
        }
      } catch (e: any) {
        logError('attach-file-failed', { error: e, errorMessage: e?.message });
      }
    },
    [createFileForUpload, logError, uploadFile],
  );

  const clearComposer = useCallback(() => {
    dispatch(ResetComposerStateAction());
    resetComposerValue();
    setSelection(null);

    return valueRef.current;
  }, [resetComposerValue, valueRef]);

  const attachFiles = useCallback(
    async (files: FileList) => {
      // TODO: parallelize?
      for (const file of files) {
        const validation = validateFileForUpload('attachment', {
          name: file.name,
          mimeType: file.type,
          size: file.size,
        });
        if (!validation.valid) {
          if (!validation.size) {
            showToastPopup?.(`File ${validation.input.name} is too large`);
          } else {
            showToastPopup?.(`Cannot attach file ${validation.input.name}`);
          }
          continue;
        }

        const dataURL = await readFileAsync(file);
        void attachFile(file.name, dataURL, thread?.orgID);
      }
    },
    [attachFile, thread, showToastPopup],
  );

  // We render <Slate /> component here so that we can access useFocused from
  // children. The logic for onChange is spread throughout Composer,
  // ComposerInput, ComposerEditor so we pass the function up from ComposerEditor.
  // We use a ref so we only have to set it once
  const [onChangeRef, setOnChangeRef] =
    useState<React.MutableRefObject<(value: MessageContent) => void>>();

  const { composerEmpty, composerValid } = useMemo(() => {
    const hasFilesAttached =
      state.attachments.filter((attachment) => attachment.type !== 'annotation')
        .length > 0;
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const composerEmpty = isComposerEmpty(editor.children);
    const composerHasOnlyWhiteSpaces = hasComposerOnlyWhiteSpaces(
      editor.children,
    );
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const composerValid =
      (!composerEmpty && !composerHasOnlyWhiteSpaces) ||
      hasFilesAttached ||
      !!state.task;
    return { composerEmpty, composerValid };
  }, [editor.children, state.attachments, state.task]);

  const { setDraftMessageInComposer } =
    useContextThrowingIfNoProvider(ThreadsContext2);

  useEffect(() => {
    setDraftMessageInComposer(composerValid);
  }, [composerValid, setDraftMessageInComposer]);

  useEffect(() => {
    // Unmounting this component discards editor, so the draft message disappears.
    // Inform ThreadsContext about this so anything else listening to this state
    // doesn't do weird things.
    return () => setDraftMessageInComposer(false);
  }, [setDraftMessageInComposer]);

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      editor,
      setSelection,
      getValue,
      getSelection,
      resetComposerValue,
      setOnChangeRef,
      startAttachFlow,
      attachFiles,
      composerValid,
      composerEmpty,
      clearComposer,
    }),
    [
      state,
      editor,
      setSelection,
      getValue,
      getSelection,
      resetComposerValue,
      setOnChangeRef,
      startAttachFlow,
      attachFiles,
      composerValid,
      composerEmpty,
      clearComposer,
    ],
  );

  const onChange = useCallback(
    (value: MessageContent) => {
      onChangeRef?.current(value);
      Sentry.addBreadcrumb({
        type: 'user',
        category: 'ui.typing',
        message: 'text: ' + JSON.stringify(value),
      });
    },
    [onChangeRef],
  );

  return (
    <ComposerContext.Provider value={contextValue}>
      <ComposerLatestValueContext.Provider value={editor.children}>
        <Slate
          editor={editor}
          initialValue={initialValue ?? []}
          onChange={onChange}
        >
          <input
            ref={attachFileInputRef}
            type="file"
            accept="audio/*,
                    video/*,
                    image/*,
                    .csv,.txt,
                    .pdf,application/pdf,
                    .doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                    .ppt,.pptx,.potx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,
                    .xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
                    "
            multiple={true}
            style={{ display: 'none' }}
            onClick={(event) => event.stopPropagation()}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
            onChange={async (e) => {
              const inputElement = e.target;
              if (inputElement.files) {
                await attachFiles(inputElement.files);
                inputElement.value = '';
              }
            }}
          />
          {children}
        </Slate>
      </ComposerLatestValueContext.Provider>
    </ComposerContext.Provider>
  );
}

const initialState = InitialState({});
const DO_NOT_EXPORT_defaultComposerContext = {
  state: initialState,
  dispatch: () => initialState,
  getValue: () => [],
  setSelection: () => {},
  getSelection: () => null as any,
  clearComposer: () => [],
  resetComposerValue: () => {},
  setOnChangeRef: () => {},
  startAttachFlow: () => {},
  attachFiles: async () => {},
  editor: null as any,
  composerValid: false,
  composerEmpty: true,
};

export function DisabledComposerProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <ComposerContext.Provider value={DO_NOT_EXPORT_defaultComposerContext}>
      {children}
    </ComposerContext.Provider>
  );
}
