import { createUseStyles } from 'react-jss';
import { Typography } from '@material-ui/core';

import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { TopLeftLogo } from 'external/src/entrypoints/console/components/TopLeftLogo.tsx';

const useStyles = createUseStyles({
  logoContainer: {
    backgroundColor: Colors.GREY_X_DARK,
    display: 'flex',
    justifyContent: 'center',
    marginBottom: Sizes.LARGE,
    paddingBottom: Sizes.LARGE,
    paddingTop: Sizes.LARGE,
  },
  wordmark: {
    height: '36px',
    width: 'auto',
  },
  logo: {
    backgroundColor: Colors.YELLOW,
    borderRadius: '50%',
  },
  loading: {
    alignItems: 'center',
    color: Colors.GREY_X_DARK,
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
  },
});

export function VerifyEmail() {
  const classes = useStyles();
  return (
    <>
      <div className={classes.logoContainer}>
        <TopLeftLogo />
      </div>
      <Typography className={classes.loading} variant="h5">
        Please check your inbox to verify your email...
      </Typography>
    </>
  );
}
