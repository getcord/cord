import { createUseStyles } from 'react-jss';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { SpinnerIcon2 } from 'external/src/components/ui2/icons/SpinnerIcon2.tsx';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
});
export function ExternalTaskSettingsLoading2() {
  const classes = useStyles();
  return (
    <Box2
      className={classes.container}
      backgroundColor="base-strong"
      padding="2xs"
      borderRadius="medium"
    >
      <SpinnerIcon2 />
    </Box2>
  );
}
