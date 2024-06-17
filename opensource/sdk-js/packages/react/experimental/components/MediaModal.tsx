import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';
import type { ClientUserData } from '@cord-sdk/types';
import dayjs from 'dayjs';
import {
  CordTrans,
  useCordTranslation,
} from '../../hooks/useCordTranslation.js';
import { useEscapeListener } from '../../common/effects/useEscapeListener.js';
import { Keys } from '../../common/const/Keys.js';
import {
  isInlineDisplayableImage,
  isInlineDisplayableVideo,
} from '../../common/lib/uploads.js';
import { Icon } from '../../components/helpers/Icon.js';
import * as classes from '../../components/MediaModal.css.js';
import {
  colorsPrimary,
  medium,
  colorsSecondary,
} from '../../components/helpers/Button.classnames.js';
import type { StyleProps } from '../../betaV2.js';
import { Button } from './helpers/Button.js';
import { DefaultTooltip, WithTooltip } from './WithTooltip.js';
import { Overlay } from './Overlay.js';
import { MessageVideoAttachment } from './message/MessageVideoAttachment.js';
import withCord from './hoc/withCord.js';
import type { MandatoryReplaceableProps } from './replacements.js';

export type MediaModalProps = {
  medias: {
    url: string;
    mimeType: string;
    id: string;
  }[];
  blurred?: boolean;
  initialMediaIndex: number;
  banner: {
    user: ClientUserData;
    timestamp: Date;
  } | null;
  onUnsupportedVideoFormat?: (id: string) => unknown;
  closeModal: () => void;
} & StyleProps &
  MandatoryReplaceableProps;

export const MediaModal = withCord<React.PropsWithChildren<MediaModalProps>>(
  React.forwardRef(function MediaModal(
    props: MediaModalProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { t } = useCordTranslation('message');
    const {
      initialMediaIndex,
      blurred,
      banner,
      medias,
      closeModal,
      onUnsupportedVideoFormat,
      ...restProps
    } = props;
    const [copyButtonClicked, setCopyButtonClicked] = useState(false);
    const [mediaIndex, setMediaIndex] = useState(initialMediaIndex);
    const media = medias[mediaIndex];
    const mediaSrc = media.url;
    useEscapeListener(closeModal);

    const copyLinkToClipboard = useCallback(() => {
      void navigator.clipboard.writeText(mediaSrc);
      setCopyButtonClicked(true);
    }, [mediaSrc]);

    const showPrev = useCallback(() => {
      setMediaIndex((prev) => (medias.length + prev - 1) % medias.length);
    }, [medias.length]);
    const showNext = useCallback(() => {
      setMediaIndex((prev) => (prev + 1) % medias.length);
    }, [medias.length]);
    useEffect(() => {
      function handleKeyUp(e: KeyboardEvent) {
        if (e.key === Keys.ARROW_LEFT) {
          showPrev();
        }
        if (e.key === Keys.ARROW_RIGHT) {
          showNext();
        }
      }
      window.addEventListener('keyup', handleKeyUp);
      return () => window.removeEventListener('keyup', handleKeyUp);
    }, [showNext, showPrev]);

    return (
      <Overlay onClick={closeModal} ref={ref} canBeReplaced {...restProps}>
        <div className={classes.topBanner} onClick={(e) => e.stopPropagation()}>
          {banner && (
            <>
              <Icon name="Paperclip" size="large" />
              <p className={classes.bannerText}>
                <CordTrans
                  t={t}
                  i18nKey={'image_modal_attachment_header'}
                  values={{
                    user: banner.user,
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
                tooltip={<CopyLinkTooltip isClicked={copyButtonClicked} />}
              >
                <Button
                  canBeReplaced
                  icon="LinkSimple"
                  buttonAction="copy-image-link"
                  className={cx(colorsSecondary, medium)}
                  onClick={copyLinkToClipboard}
                  onMouseLeave={() => setCopyButtonClicked(false)}
                >
                  {t('image_modal_copy_link_action')}
                </Button>
              </WithTooltip>

              <Button
                canBeReplaced
                buttonAction="close-image-modal"
                className={cx(colorsSecondary, medium)}
                icon="X"
                onClick={closeModal}
              />
            </>
          )}
        </div>
        {medias.length > 1 && (
          <Button
            canBeReplaced
            className={cx(colorsPrimary, medium)}
            buttonAction="show-previous-image"
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
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
            canBeReplaced
            buttonAction="show-next-image"
            className={cx(colorsPrimary, medium)}
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            icon="CaretRight"
          ></Button>
        )}
      </Overlay>
    );
  }),
  'MediaModal',
);

type CopyLinkTooltipProps = {
  isClicked: boolean;
};

function CopyLinkTooltip({ isClicked }: CopyLinkTooltipProps) {
  const { t } = useCordTranslation('message');

  return (
    <DefaultTooltip
      label={t(
        !isClicked
          ? 'image_modal_copy_link_tooltip'
          : 'image_modal_copy_link_success',
      )}
    />
  );
}
