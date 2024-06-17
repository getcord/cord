import { ComposerActions } from 'external/src/context/composer/actions/index.ts';
import type {
  ComposerAttachment,
  ComposerState,
} from 'external/src/context/composer/ComposerState.ts';
import { action, actionReducer } from 'external/src/context/common.ts';
import type { UUID } from 'common/types/index.ts';
import type { FileUploadStatus } from 'external/src/graphql/operations.ts';

type SetAttachmentUploadStatusPayload = {
  id: UUID;
  url: string;
  status: FileUploadStatus;
};

export const SetAttachmentUploadStatus =
  action<SetAttachmentUploadStatusPayload>(
    ComposerActions.SET_ATTACHMENT_UPLOAD_STATUS,
  );

const uploadedAttachment = (
  attachment: ComposerAttachment,
  url: string,
  status: FileUploadStatus,
): ComposerAttachment => {
  switch (attachment.type) {
    case 'file':
      return {
        ...attachment,
        file: {
          ...attachment.file,
          uploadStatus: status,
          url,
        },
      };
    case 'annotation':
      return {
        ...attachment,
        screenshot: attachment.screenshot
          ? {
              ...attachment.screenshot,
              uploadStatus: status,
              url,
            }
          : null,
      };
  }
};

export const SetAttachmentUploadStatusReducer = actionReducer(
  (
    state: ComposerState,
    payload: SetAttachmentUploadStatusPayload,
  ): ComposerState => ({
    ...state,
    attachments: state.attachments.map((attachment) =>
      attachment.id === payload.id
        ? uploadedAttachment(attachment, payload.url, payload.status)
        : attachment,
    ),
  }),
);
