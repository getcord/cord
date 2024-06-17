import { Button, Typography } from '@mui/material';
import { createUseStyles } from 'react-jss';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  container: {
    borderRadius: Sizes.LARGE_BORDER_RADIUS,
    background: Colors.ALERT_LIGHT,
    padding: Sizes.XLARGE,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sizes.MEDIUM,
    color: Colors.ALERT,
  },
  text: { flexGrow: 1 },
  ctaRow: {
    display: 'flex',
    gap: Sizes.MEDIUM,
  },
});

export function UnsavedChangesBanner({
  onSave,
}: {
  onSave: (() => Promise<void>) | (() => void);
}) {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <Typography variant="body2" className={classes.text}>
        You have unsaved changes, they will be lost if you leave this page.
      </Typography>
      <div className={classes.ctaRow}>
        <Button
          size="small"
          variant="contained"
          color="error"
          sx={{ flex: 'none' }}
          onClick={() => {
            void onSave();
          }}
        >
          Save Now
        </Button>
      </div>
    </div>
  );
}
