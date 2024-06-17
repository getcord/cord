import { IconButton, Snackbar, Typography } from '@mui/material';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { createUseStyles } from 'react-jss';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  snackbar: {
    color: Colors.WHITE,
    display: 'flex',
    padding: Sizes.LARGE,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Sizes.LARGE_BORDER_RADIUS,
    background: Colors.BRAND_PRIMARY,
    gap: Sizes.XXLARGE,
    boxShadow: '0px 2px 16px 0px rgba(0, 0, 0, 0.16)',
  },
});

type ToastProps = {
  message: string;
  onClose: (event: React.SyntheticEvent | Event, reason?: string) => void;
  isOpen: boolean;
  button?: React.ReactNode;
};

export function Toast({ message, onClose, isOpen, button }: ToastProps) {
  const classes = useStyles();

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      open={isOpen}
      autoHideDuration={6000}
      onClose={onClose}
    >
      <div className={classes.snackbar}>
        <Typography variant="body1">{message}</Typography>
        {button ? (
          button
        ) : (
          <IconButton aria-label="close" onClick={onClose}>
            <XMarkIcon width={20} color={Colors.WHITE} />
          </IconButton>
        )}
      </div>
    </Snackbar>
  );
}
