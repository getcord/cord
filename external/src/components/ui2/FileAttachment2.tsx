import { useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { ContentBox2 } from 'external/src/components/ui2/ContentBox2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { SpinnerIcon2 } from 'external/src/components/ui2/icons/SpinnerIcon2.tsx';
import { getFileSizeString } from '@cord-sdk/react/common/util.ts';
import { BasicButtonWithUnderline2 } from 'external/src/components/ui2/BasicButtonWithUnderline2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { Link2 } from 'external/src/components/ui2/Link2.tsx';

const useStyles = createUseStyles({
  cursor: {
    cursor: 'pointer',
  },
  fileContainer: {
    display: 'flex',
    gap: cssVar('space-3xs'),
    color: cssVar('color-content-primary'),
    overflow: 'hidden',
    height: `calc(${cssVar('space-xl')}*2)`,
    // includes the flex gap we have between attachments
    '&:hover': {
      color: cssVar('color-brand-primary'),
      boxShadow: cssVar('shadow-small'),
    },
    '&:hover $actionButton': {
      visibility: 'visible',
    },
    '&:hover $fileSize': {
      visibility: 'hidden',
    },
  },
  fileName: {
    display: 'flex',
    whiteSpace: 'nowrap',
  },
  fileInfo: {
    overflow: 'hidden',
  },
  fileSize: {
    position: 'absolute',
    top: 0,
  },
  icon: {
    flex: 'none',
  },
  actionButton: {
    visibility: 'hidden',
  },
  name: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  subtext: {
    position: 'relative',
    lineHeight: 0,
  },
});

type Props = {
  mimeType: string;
  fileName: string;
  fileSize: number;
  onButtonClick?: () => unknown;
  actionLabel: string;
  uploading: boolean;
  showErrorState?: boolean;
  className?: string;
  url?: string;
};

/**
 * @deprecated Use ui3/composer/FileAttachment instead
 */
export function FileAttachment2({
  mimeType,
  fileName,
  onButtonClick,
  actionLabel,
  uploading,
  fileSize,
  showErrorState,
  className,
  url,
}: Props) {
  const { t } = useCordTranslation('message');
  const classes = useStyles();
  const [isFileNameTruncated, setIsFileNameTruncated] = useState(false);

  const { name, fileExtension } = useMemo(() => {
    const fileNameParts = fileName.split('.');
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const fileExtension = '.' + fileNameParts.pop();
    return {
      name: fileNameParts,
      fileExtension,
    };
  }, [fileName]);

  const fileNameRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (fileNameRef.current) {
      setIsFileNameTruncated(
        fileNameRef.current?.offsetWidth !== fileNameRef.current?.scrollWidth,
      );
    }
  }, []);

  const iconType: IconType = useMemo(() => {
    if (showErrorState) {
      return 'WarningCircle';
    }
    const [type, subtype] = mimeType.split('/');
    switch (type) {
      case 'audio':
        return 'FileAudio';
      case 'video':
        return 'FileVideo';
    }
    switch (subtype) {
      case 'csv':
        return 'FileCsv';
      case 'msword':
        return 'FileDoc';
      case 'vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'MicrosoftWordLogo';
      case 'pdf':
        return 'FilePdf';
      case 'zip':
        return 'FileZip';
      case 'vnd.ms-excel':
        return 'FileXls';
      default:
        return 'File';
    }
  }, [mimeType, showErrorState]);

  return (
    <WithTooltip2
      className={className}
      label={fileName}
      tooltipDisabled={!isFileNameTruncated || showErrorState}
    >
      <ContentBox2
        className={cx(classes.fileContainer, {
          [classes.cursor]: !showErrorState,
        })}
        borderRadius="medium"
        padding="2xs"
      >
        {!uploading ? (
          <Icon2
            name={iconType}
            size="large"
            className={classes.icon}
            color={showErrorState ? 'content-primary' : 'inherit'}
          />
        ) : (
          <SpinnerIcon2 size="large" className={classes.icon} />
        )}
        {showErrorState ? (
          <Text2 font="small" color="content-primary">
            {t('unable_to_display_document')}
          </Text2>
        ) : (
          <Box2 className={classes.fileInfo}>
            <Text2 font="small" color="inherit" className={classes.fileName}>
              <span className={classes.name} ref={fileNameRef}>
                {name}
              </span>
              {fileExtension}
            </Text2>
            <Box2 className={classes.subtext}>
              {url ? (
                <Link2
                  className={classes.actionButton}
                  linkStyle="primary-small"
                  newTab={true}
                  title={actionLabel}
                  href={url}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                    e.stopPropagation()
                  }
                >
                  {actionLabel}
                </Link2>
              ) : (
                <BasicButtonWithUnderline2
                  className={classes.actionButton}
                  labelFontStyle="small-emphasis"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    onButtonClick?.();
                  }}
                  label={actionLabel}
                />
              )}
              <Text2
                font="small"
                color="content-secondary"
                className={classes.fileSize}
              >
                {uploading ? 'Uploading...' : getFileSizeString(fileSize)}
              </Text2>
            </Box2>
          </Box2>
        )}
      </ContentBox2>
    </WithTooltip2>
  );
}
