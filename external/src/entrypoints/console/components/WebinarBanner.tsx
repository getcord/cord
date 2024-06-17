import { createUseStyles } from 'react-jss';
import { Button, IconButton, Typography } from '@mui/material';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';
import { Colors } from 'common/const/Colors.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { CustomerInfoContext } from 'external/src/entrypoints/console/contexts/CustomerInfoProvider.tsx';

const useStyles = createUseStyles({
  container: {
    borderRadius: Sizes.LARGE_BORDER_RADIUS,
    background: Colors.BRAND_PURPLE_LIGHT,
    padding: `${Sizes.XLARGE}px`,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cta: {
    display: 'flex',
    flexDirection: 'row',
    gap: Sizes.MEDIUM,
    alignItems: 'center',
  },
  text: { margin: 0, flexGrow: 1 },
});

export type WebinarBannerParams = {
  text: string;
  button1: string;
  button1href: string;
  button2: string;
  button2href: string;
};

const LOCAL_STORAGE_KEY = 'console-webinar-banner-closed-timestamo';

export default function WebinarBanner() {
  const classes = useStyles();

  const { signupCoupon } = useContextThrowingIfNoProvider(CustomerInfoContext);

  const untypedFlag = useFeatureFlag(FeatureFlags.CONSOLE_WEBINAR_BANNER);
  const flag = untypedFlag as WebinarBannerParams;

  const [isShown, setIsShown] = useState(
    localStorage.getItem(LOCAL_STORAGE_KEY) === null,
  );

  if (!isShown || !flag || Object.keys(flag).length === 0) {
    return null;
  }

  const text =
    signupCoupon && signupCoupon.length > 0
      ? 'Thanks for signing up! $2,500 will be applied to your account.'
      : flag.text;
  return (
    <div className={classes.container}>
      <Typography className={classes.text} variant="body2">
        {text}
      </Typography>
      <div className={classes.cta}>
        <Button
          size="small"
          href={flag.button1href}
          target="_blank"
          variant="outlined"
          sx={{ flex: 'none' }}
        >
          {flag.button1}
        </Button>
        <Button
          size="small"
          href={flag.button2href}
          target="_blank"
          variant="contained"
          sx={{ flex: 'none' }}
        >
          {flag.button2}
        </Button>
        <IconButton
          aria-label="Show value"
          onClick={() => {
            localStorage.setItem(LOCAL_STORAGE_KEY, `${Date.now()}`);
            setIsShown(false);
          }}
        >
          <XMarkIcon height={20} />
        </IconButton>
      </div>
    </div>
  );
}
