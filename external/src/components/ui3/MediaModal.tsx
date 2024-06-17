import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { CordTrans, useCordTranslation } from '@cord-sdk/react';
import { useEscapeListener } from 'external/src/effects/useEscapeListener.ts';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import { Button } from 'external/src/components/ui3/Button.tsx';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';
import type { MediaModal as ImageModalType } from 'external/src/context/mediaModal/MediaModalContext.tsx';

import * as classes from 'external/src/components/ui3/MediaModal.css.ts';
import { Keys } from '@cord-sdk/react/common/const/Keys.ts';
import {
  isInlineDisplayableImage,
  isInlineDisplayableVideo,
} from '@cord-sdk/react/common/lib/uploads.ts';
import { MessageVideoAttachment } from 'external/src/components/ui3/message/MessageVideoAttachment.tsx';
import { userToUserData } from 'common/util/convertToExternal/user.ts';
import { Overlay } from 'external/src/components/ui3/Overlay.tsx';

export function MediaModal(
  props: ImageModalType & { fullWidth: boolean } & {
    showPrevious: () => void;
    showNext: () => void;
  },
) {
  const { t } = useCordTranslation('message');
  const {
    blurred,
    closeModal,
    mediaIndex,
    banner,
    medias,
    onUnsupportedVideoFormat,
    showPrevious,
    showNext,
  } = props;
  const [copyButtonClicked, setCopyButtonClicked] = useState(false);
  const media = medias[mediaIndex];
  const mediaSrc = media.url;

  const copyLinkToClipboard = useCallback(() => {
    void navigator.clipboard.writeText(mediaSrc);
    setCopyButtonClicked(true);
  }, [mediaSrc]);

  useEscapeListener(closeModal);

  useEffect(() => {
    function onKeyPress(e: KeyboardEvent) {
      if (e.key === Keys.ARROW_LEFT) {
        showPrevious();
      }
      if (e.key === Keys.ARROW_RIGHT) {
        showNext();
      }
    }
    window.addEventListener('keyup', onKeyPress);
    return () => window.removeEventListener('keyup', onKeyPress);
  }, [showNext, showPrevious]);
  return (
    <Overlay onClick={closeModal}>
      <div className={classes.topBanner} onClick={(e) => e.stopPropagation()}>
        {banner && (
          <>
            {banner.isAnnotation ? (
              <Icon name={'AnnotationPin'} size="large" />
            ) : (
              <Icon name="Paperclip" size="large" />
            )}
            <p className={classes.bannerText}>
              <CordTrans
                t={t}
                i18nKey={
                  banner.isAnnotation
                    ? 'image_modal_annotation_header'
                    : 'image_modal_attachment_header'
                }
                values={{
                  user: userToUserData(banner.user),
                  date: dayjs(banner.timestamp).format(
                    t('image_modal_header_date_format'),
                  ),
                }}
                components={{
                  datespan: <span className={classes.bannerDate} />,
                }}
              ></CordTrans>
            </p>
            <WithTooltip
              label={t(
                !copyButtonClicked
                  ? 'image_modal_copy_link_tooltip'
                  : 'image_modal_copy_link_success',
              )}
            >
              <Button
                icon="LinkSimple"
                buttonAction="copy-image-link"
                buttonType={'secondary'}
                size={'medium'}
                onClick={copyLinkToClipboard}
                onMouseLeave={() => setCopyButtonClicked(false)}
              >
                {t('image_modal_copy_link_action')}
              </Button>
            </WithTooltip>
            <Button
              buttonType="secondary"
              buttonAction="close-image-modal"
              size="medium"
              icon={'X'}
              onClick={closeModal}
            />
          </>
        )}
      </div>
      {medias.length > 1 && (
        <Button
          buttonType="primary"
          buttonAction="show-previous-image"
          size="medium"
          onClick={(e) => {
            e.stopPropagation();
            showPrevious();
          }}
          icon="CaretLeft"
        ></Button>
      )}
      <div className={classes.imageContainer}>
        {isInlineDisplayableImage(media.mimeType) && (
          <img
            src={mediaSrc}
            className={classes.image}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {isInlineDisplayableVideo(media.mimeType) && (
          <MessageVideoAttachment
            file={media}
            onUnsupportedFormat={(id) => {
              onUnsupportedVideoFormat?.(id);
            }}
          ></MessageVideoAttachment>
        )}
        {blurred && (
          <p className={classes.caption}>{t('image_modal_blurred_status')}</p>
        )}
      </div>
      {medias.length > 1 && (
        <Button
          buttonType="primary"
          buttonAction="show-next-image"
          size="medium"
          onClick={(e) => {
            e.stopPropagation();
            showNext();
          }}
          icon="CaretRight"
        ></Button>
      )}
    </Overlay>
  );
}

export const newMediaModal = {
  NewComp: MediaModal,
  configKey: 'imageModal',
} as const;
