import { useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import type { IconType } from 'external/src/components/ui3/icons/Icon.tsx';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import { SpinnerIcon } from '@cord-sdk/react/common/icons/customIcons/SpinnerIcon.tsx';
import { getFileSizeString } from '@cord-sdk/react/common/util.ts';
import { ButtonWithUnderline } from 'external/src/components/ui3/ButtonWithUnderline.tsx';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';
import { Link } from 'external/src/components/ui3/Link.tsx';

import * as classes from 'external/src/components/ui3/composer/FileAttachment.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import {
  fontSmall,
  fontSmallEmphasis,
} from 'common/ui/atomicClasses/fonts.css.ts';

type Props = {
  id: string;
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

export function FileAttachment({
  id,
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
    <WithTooltip
      label={fileName}
      tooltipDisabled={!isFileNameTruncated || showErrorState}
    >
      <div
        className={cx(classes.fileContainer, className, fontSmall, {
          [MODIFIERS.error]: !!showErrorState,
        })}
        data-cord-message-attachment-id={id}
      >
        {!uploading ? (
          <Icon
            name={iconType}
            size="large"
            className={classes.icon}
            color={showErrorState ? 'content-primary' : 'inherit'}
          />
        ) : (
          <SpinnerIcon size="large" className={classes.icon} />
        )}
        {showErrorState ? (
          <p>{t('unable_to_display_document')}</p>
        ) : (
          <div className={classes.fileInfo}>
            <p className={classes.fileName}>
              <span className={classes.fileBasename} ref={fileNameRef}>
                {name}
              </span>
              <span className={classes.fileExtension}>{fileExtension}</span>
            </p>
            {url ? (
              <Link
                linkStyle="primary-small"
                newTab={true}
                title={actionLabel}
                href={url}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                  e.stopPropagation()
                }
              >
                {actionLabel}
              </Link>
            ) : (
              <ButtonWithUnderline
                className={fontSmallEmphasis}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onButtonClick?.();
                }}
                label={actionLabel}
                buttonAction="remove-attachment"
              />
            )}
            <p className={classes.fileSize}>
              {uploading ? 'Uploading...' : getFileSizeString(fileSize)}
            </p>
          </div>
        )}
      </div>
    </WithTooltip>
  );
}
