import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';

import { DefaultTooltip, WithTooltip } from '../WithTooltip.js';
import { Link } from '../helpers/Link.js';
import { ButtonWithUnderline } from '../helpers/ButtonWithUnderline.js';
import { SpinnerIcon } from '../../../common/icons/customIcons/SpinnerIcon.js';
import { getFileSizeString } from '../../../common/util.js';

import * as classes from '../../../components/FileAttachment.css.js';
import { Icon } from '../../../components/helpers/Icon.js';
import type { IconType } from '../../../components/helpers/Icon.js';
import { useCordTranslation } from '../../../index.js';
import { MODIFIERS } from '../../../common/ui/modifiers.js';
import {
  fontSmall,
  fontSmallEmphasis,
} from '../../../common/ui/atomicClasses/fonts.css.js';

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
    const extension = '.' + fileNameParts.pop();
    return {
      name: fileNameParts,
      fileExtension: extension,
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
      tooltip={<FileAttachmentTooltip fileName={fileName} />}
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
                className={fontSmallEmphasis}
                rel="noreferrer"
                target="_blank"
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

type FileAttachmentTooltipProps = {
  fileName: string;
};
function FileAttachmentTooltip({ fileName }: FileAttachmentTooltipProps) {
  return <DefaultTooltip label={fileName} />;
}
