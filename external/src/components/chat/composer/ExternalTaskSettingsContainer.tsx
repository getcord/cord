import { createUseStyles } from 'react-jss';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  settingsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar('space-3xs'),
  },
});

export function ExternalTaskSettingsContainer({
  children,
}: React.PropsWithChildren<any>) {
  const classes = useStyles();

  return (
    <Box2
      backgroundColor="base-strong"
      padding="2xs"
      marginHorizontal={'2xs'}
      borderRadius="medium"
    >
      <Box2
        style={{
          borderLeft: `1px solid ${cssVar('color-content-secondary')}`,
        }}
        paddingHorizontal="2xs"
        paddingVertical="3xs"
        className={classes.settingsContainer}
      >
        {children}
      </Box2>
    </Box2>
  );
}
