import { Button, Typography } from '@mui/material';
import { createUseStyles } from 'react-jss';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import WebinarBanner from 'external/src/entrypoints/console/components/WebinarBanner.tsx';
import { usePlan } from 'external/src/entrypoints/console/hooks/usePlan.tsx';
import {
  ConsoleRoutes,
  ConsoleSettingsRoutes,
} from 'external/src/entrypoints/console/routes.ts';

const useStyles = createUseStyles({
  container: {
    borderRadius: Sizes.LARGE_BORDER_RADIUS,
    background: Colors.BRAND_PURPLE_LIGHT,
    padding: Sizes.XLARGE,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sizes.MEDIUM,
  },
  text: { flexGrow: 1 },
  ctaRow: {
    display: 'flex',
    gap: Sizes.MEDIUM,
  },
});

export function PlanBanner() {
  const classes = useStyles();

  const planDetails = usePlan();

  const isBillingInConsoleEnabled = useFeatureFlag(
    FeatureFlags.BILLING_ENABLED_IN_CONSOLE,
  );

  if (!isBillingInConsoleEnabled) {
    return <WebinarBanner />;
  }

  if (planDetails?.planName === 'Starter') {
    return (
      <div className={classes.container}>
        <Typography variant="body2" className={classes.text}>
          You are using Cord&#39;s Starter Plan. Ready for more? Head to Billing
          for more options.
        </Typography>
        <div className={classes.ctaRow}>
          <Button
            size="small"
            href={`${ConsoleRoutes.SETTINGS}/${ConsoleSettingsRoutes.SETTINGS_BILLING}`}
            variant="contained"
            sx={{ flex: 'none' }}
          >
            Go to Billing
          </Button>
        </div>
      </div>
    );
  }
  return null;
}
