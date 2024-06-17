import { LinearProgress, Typography } from '@mui/material';
import type { LinearProgressProps } from '@mui/material';
import { createUseStyles } from 'react-jss';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    width: '100%',
  },
});

export function BillingProgress({
  name,
  currentValue,
  maxValue,
  isLoading,
}: {
  name: string;
  currentValue: number | undefined;
  maxValue: number | 'unlimited';
  isLoading: boolean;
}) {
  const classes = useStyles();

  let color: LinearProgressProps['color'] = 'primary';
  const progress =
    currentValue !== undefined
      ? (currentValue * 100) / (maxValue === 'unlimited' ? 100 : maxValue)
      : 0;
  if (progress >= 90) {
    color = 'error';
  }

  return (
    <div className={classes.container}>
      <span>
        {isLoading || currentValue === undefined ? (
          `Loading ${name}...`
        ) : (
          <Typography fontSize={Sizes.SMALL_TEXT_SIZE_PX}>
            <Typography
              variant="h3"
              component="span"
              fontSize={Sizes.X_LARGE_TEXT_SIZE_PX}
            >
              {currentValue}
            </Typography>
            {` of ${maxValue} ${name}`}
          </Typography>
        )}
      </span>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, progress)}
        color={color}
        style={{ width: '100%', borderRadius: Sizes.DEFAULT_BORDER_RADIUS }}
      />
    </div>
  );
}
