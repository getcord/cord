import { useCallback, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { IconButton, Typography } from '@mui/material';
import EyeCrossed from 'external/src/static/eye-crossed.svg';
import Clipboard from 'external/src/static/clipboard.svg';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

interface SecretBoxProps {
  text: string;
  className?: string;
  hiddenOnRender?: boolean;
  canBeCopiedToClipboard?: boolean;
}

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: `${Sizes.DEFAULT_BORDER_RADIUS}px`,
    background: Colors.GREY_X_LIGHT,
    padding: '4px 10px',
    alignItems: 'center',
    alignSelf: 'stretch',
    fontFamily: 'monospace',
    fontSize: '14px',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
  },
  iconButton: { width: '16px', color: Colors.BRAND_PRIMARY },
  secretText: {
    wordBreak: 'break-all',
  },
});

export default function SecretBox({
  text,
  className,
  hiddenOnRender,
  canBeCopiedToClipboard,
}: SecretBoxProps) {
  const classes = useStyles();

  const [isSecretShown, setIsSecretShown] = useState(!hiddenOnRender);

  const copyToClipboard = useCallback(() => {
    void navigator.clipboard.writeText(text);
  }, [text]);

  return (
    <div className={cx(className, classes.container)}>
      {isSecretShown ? (
        <>
          <Typography variant="monospace" className={classes.secretText}>
            {text}
          </Typography>
          <div className={classes.buttons}>
            {canBeCopiedToClipboard ? (
              <IconButton
                aria-label="Copy to clipboard"
                onClick={copyToClipboard}
              >
                <Clipboard className={classes.iconButton} />
              </IconButton>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <Typography>••••••••••••••••••••••••••••••••••</Typography>
          <div className={classes.buttons}>
            {canBeCopiedToClipboard ? (
              <IconButton
                aria-label="Copy to clipboard"
                onClick={copyToClipboard}
              >
                <Clipboard className={classes.iconButton} />
              </IconButton>
            ) : null}
            <IconButton
              aria-label="Show value"
              onClick={() => {
                setIsSecretShown(true);
              }}
            >
              <EyeCrossed className={classes.iconButton} />
            </IconButton>
          </div>
        </>
      )}
    </div>
  );
}
