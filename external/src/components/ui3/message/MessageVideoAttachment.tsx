import type { FileFragment } from 'external/src/graphql/operations.ts';
import * as classes from 'external/src/components/ui3/message/MessageVideoAttachment.css.ts';
import type { UUID } from 'common/types/index.ts';

type Props = {
  file: Pick<FileFragment, 'id' | 'url'>;
  onUnsupportedFormat: (id: UUID) => unknown;
};

export function MessageVideoAttachment({ file, onUnsupportedFormat }: Props) {
  // NB: deliberately omit `type` even though we have a mime type to work around
  // Chrome thinking it can't play things that it can; see
  // https://secure.phabricator.com/T13135 and
  // https://github.com/phacility/phabricator/commit/5784e3d3c0cf817512023b3d797c03290ae26a8c.
  return (
    <video
      className={classes.videoAttachmentContainer}
      controls
      preload="metadata"
      data-cord-message-attachment-id={file.id}
    >
      <source src={file.url} onError={(_e) => onUnsupportedFormat(file.id)} />
    </video>
  );
}
