import { Node } from 'slate';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';

import type {
  Location,
  DocumentLocation,
  HighlightedTextConfig,
  MessageContent,
  Point2D,
  Screenshot,
  UUID,
} from 'common/types/index.ts';
import { MessageNodeType } from 'common/types/index.ts';
import { createMessageNode } from '@cord-sdk/react/common/lib/messageNode.ts';
import type {
  FileUploadStatus,
  TaskInput,
} from 'external/src/graphql/operations.ts';

export type ComposerAction =
  | { type: 'addAnnotation' }
  | { type: 'addFile' }
  | { type: 'addTask' }
  | { type: 'insertMention'; user: { id: UUID; name: string } }
  | { type: 'focusEditor' };

export interface ComposerFileAttachmentType {
  id: UUID;
  type: 'file';
  file: {
    id: UUID;
    name: string;
    mimeType: string;
    url: string;
    uploadStatus: FileUploadStatus;
    size: number;
    threadOrgID?: UUID;
  };
}

export interface ComposerAnnotationAttachmentType {
  id: UUID;
  type: 'annotation';
  location: DocumentLocation | null;
  customLocation: Location | null;
  customHighlightedTextConfig: HighlightedTextConfig | null;
  customLabel: string | null;
  coordsRelativeToTarget: Point2D | null;
  screenshot: Screenshot;
  blurredScreenshot: Screenshot;
  size: number;
  message: {
    source: {
      id: UUID;
    };
  };
}

export type ComposerAttachment =
  | ComposerFileAttachmentType
  | ComposerAnnotationAttachmentType;

export type ComposerState = {
  attachments: ComposerAttachment[];
  editingMessageID: UUID | null;
  task?: TaskInput | null;
  shakingTodoID?: UUID | null;
  composerAction: ComposerAction | null;
};

// Important not to use this value directly, as Slate gets confused two
// editors have the same value by reference. This can lead to a bug where
// onChange fires for multiple editors
const COMPOSER_EMPTY_VALUE_FOR_COMPARING = createComposerEmptyValue();
export function createComposerEmptyValue() {
  return [
    createMessageNode(MessageNodeType.PARAGRAPH, {
      children: [{ text: '' }],
    }),
  ];
}
export function isComposerEmpty(value: MessageContent) {
  return (
    isEqual(value, COMPOSER_EMPTY_VALUE_FOR_COMPARING) || isEqual(value, [])
  );
}

export function hasComposerOnlyWhiteSpaces(value: MessageContent) {
  const texts = Node.texts({ children: value } as Node);
  let doneIterating = false;
  while (!doneIterating) {
    const next = texts.next();
    if (next.done) {
      doneIterating = true;
    } else {
      const [textNode, _path] = next.value;
      if (textNode.text.trim().length > 0) {
        return false;
      }
    }
  }
  return true;
}

export const InitialState: ({
  initialComposerAction,
  initialComposerAttachment,
}: {
  initialComposerAction?: ComposerAction;
  initialComposerAttachment?: ComposerAttachment;
}) => ComposerState = ({
  initialComposerAction,
  initialComposerAttachment,
}) => ({
  attachments: initialComposerAttachment ? [initialComposerAttachment] : [],
  editingMessageID: null,
  composerValid: false,
  composerEmpty: true,
  composerAction: initialComposerAction ?? null,
});
