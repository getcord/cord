import { useCallback, useEffect, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import dayjs from 'dayjs';
import { CordTrans, useCordTranslation } from '@cord-sdk/react';
import { Overlay } from 'external/src/delegate/components/Overlay.tsx';
import { SCREENSHOT_TRANSITION_IN_MS } from 'common/const/Timing.ts';
import { useEscapeListener } from 'external/src/effects/useEscapeListener.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { ButtonGroup2 } from 'external/src/components/ui2/ButtonGroup2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import type { MediaModal } from 'external/src/context/mediaModal/MediaModalContext.tsx';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newMediaModal } from 'external/src/components/ui3/MediaModal.tsx';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

type StylesProps = {
  small: boolean;
};

// calced to match the height of the full page thread page header
// TODO make this logic less sidebar-dependent
const TOP_BAR_HEIGHT = `calc(${cssVar('space-2xl')} + 2*${cssVar(
  'space-2xs',
)})`;

const useStyles = createUseStyles({
  topBanner: {
    flex: 'none',
    height: TOP_BAR_HEIGHT,
    justifyContent: 'space-between',
  },
  topBannerHidden: {
    visibility: 'hidden',
  },
  topBannerVisible: {
    visibility: 'visible',
  },
  // imageContainer is sized with constants because flex seems to break image scaling
  imageContainer: {
    alignItems: 'center',
    borderRadius: cssVar('space-3xs'),
    display: 'flex',
    flexDirection: 'column',
    height: `calc(100vh - ${cssVar('sidebar-top')} - (${TOP_BAR_HEIGHT}px))`,
    justifyContent: 'center',
    paddingBottom: cssVar('space-2xs'),
    position: 'relative',
    width: `calc(100vw - ${cssVar('sidebar-width')})`,
    zIndex: ZINDEX.modal,
  },
  imageContainerFullWidth: {
    width: `100vw`,
  },
  imageInnerContainer: {
    maxHeight: `calc(100% - ${cssVar(
      'sidebar-top',
    )} - (${TOP_BAR_HEIGHT} + ${cssVar('space-2xs')}px))`,
    maxWidth: 'calc(100% - 120px)',
    transition: `max-height, max-width ${SCREENSHOT_TRANSITION_IN_MS}ms`,
    '&$imageSmall': {
      maxHeight: '66%',
      maxWidth: '66%',
    },
  },
  image: {
    display: 'block',
    maxHeight: `calc(100% - ${cssVar('line-height-small')})`,
    maxWidth: '100%',
  },
  imageSmall: {
    // This is just a marker for modifying imageInnerContainer's style
  },
  caption: {
    background: cssVar('color-base-strong'),
    margin: 0,
    padding: cssVar('space-2xs'),
    lineHeight: cssVar('line-height-small'),
    borderRadius: '0 0 8px 8px',
    overflowX: 'hidden',
  },
});

/**
 * @depreacted Please use `ui3/ImageModal` instead.
 **/
export const ImageModal2 = withNewCSSComponentMaybe(
  newMediaModal,
  function ImageModal2(
    props: MediaModal & {
      fullWidth: boolean;
      showNext: () => void;
      showPrevious: () => void;
    },
  ) {
    const { t } = useCordTranslation('message');
    const styleProps: StylesProps = useMemo(
      () => ({ small: !!props.small }),
      [props.small],
    );

    const classes = useStyles();

    const [copyButtonClicked, setCopyButtonClicked] = useState(false);

    const imageSrc = props.medias[props.mediaIndex].url;
    const copyLinkToClipboard = useCallback(() => {
      void navigator.clipboard.writeText(imageSrc);
      setCopyButtonClicked(true);
    }, [imageSrc]);

    const [expandAnimationComplete, setExpandAnimationComplete] =
      useState(false);

    useEscapeListener(props.closeModal);

    useEffect(() => {
      if (!props.small) {
        // Escape listener needs focus on main webpage to work
        window.focus();
        setTimeout(() => {
          // Blurred overlay seems to cause lag when background animates opacity/color
          // We therefore set it to blurred after the animations are complete
          // It is inconsistent - happens on my laptop only when monitor not plugged in
          setExpandAnimationComplete(true);
        }, SCREENSHOT_TRANSITION_IN_MS);
      }
    }, [props.small]);

    return (
      <Overlay
        backgroundColor={props.small ? 'dark' : 'darker'}
        blurredBackground={expandAnimationComplete}
        onClick={props.closeModal}
        fadeIn={true}
        withoutSidebar={props.small}
        fullWidth={props.fullWidth}
        sidebarBackgroundColor={'dark'}
        top={'sidebar-top'}
      >
        <Row2
          className={cx(classes.topBanner, {
            [classes.topBannerHidden]: styleProps.small,
            [classes.topBannerVisible]: !styleProps.small,
          })}
          backgroundColor="base"
          borderColor="base-x-strong"
          paddingLeft={'m'}
          paddingRight={'2xs'}
          onClick={(e) => e.stopPropagation()}
        >
          {!props.small && props.banner && (
            <>
              <Row2>
                {props.banner.isAnnotation ? (
                  <Icon2 name={'AnnotationPin'} size="large" />
                ) : (
                  <Icon2 name="Paperclip" size="large" />
                )}
                <Text2 color="content-emphasis" marginLeft={'2xs'}>
                  <CordTrans
                    t={t}
                    i18nKey={
                      props.banner.isAnnotation
                        ? 'image_modal_annotation_header'
                        : 'image_modal_attachment_header'
                    }
                    values={{
                      user: userToUserData(props.banner.user),
                      date: dayjs(props.banner.timestamp).format(
                        t('image_modal_header_date_format'),
                      ),
                    }}
                    components={{
                      datespan: <Text2 color="content-primary" as="span" />,
                    }}
                  ></CordTrans>
                </Text2>
              </Row2>
              <ButtonGroup2>
                <WithTooltip2
                  label={t(
                    !copyButtonClicked
                      ? 'image_modal_copy_link_tooltip'
                      : 'image_modal_copy_link_success',
                  )}
                >
                  <Button2
                    icon="LinkSimple"
                    buttonType={'secondary'}
                    size={'medium'}
                    onClick={copyLinkToClipboard}
                    onMouseLeave={() => setCopyButtonClicked(false)}
                  >
                    {t('image_modal_copy_link_action')}
                  </Button2>
                </WithTooltip2>
                <Button2
                  buttonType="secondary"
                  size="medium"
                  icon={'X'}
                  onClick={props.closeModal}
                />
              </ButtonGroup2>
            </>
          )}
        </Row2>
        <Box2
          className={cx(classes.imageContainer, {
            [classes.imageContainerFullWidth]: props.fullWidth,
          })}
        >
          <div
            className={cx(classes.imageInnerContainer, {
              [classes.imageSmall]: styleProps.small,
            })}
          >
            <img
              src={imageSrc}
              className={classes.image}
              onClick={(e) => e.stopPropagation()}
            />
            {props.blurred && (
              <Text2 className={classes.caption} color="content-primary">
                {t('image_modal_blurred_status')}
              </Text2>
            )}
          </div>
        </Box2>
      </Overlay>
    );
  },
);
