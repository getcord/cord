import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Typography } from '@material-ui/core';

import { Colors } from 'common/const/Colors.ts';
import { TOOLBAR_HEIGHT } from 'external/src/entrypoints/console/const.ts';
import {
  ConsoleAppBar,
  ConsoleAppDrawer,
  ConsoleAppMainContent,
  ConsolePageWrapper,
} from 'external/src/entrypoints/console/components/ConsolePageLayout.tsx';
import { ConsoleThemeProvider } from 'external/src/entrypoints/console/contexts/ConsoleThemeProvider.tsx';
import { TopLeftLogo } from 'external/src/entrypoints/console/components/TopLeftLogo.tsx';

const useStyles = createUseStyles({
  logoBox: {
    height: TOOLBAR_HEIGHT + 'px',
    borderBottom: `1px solid ${Colors.GREY_LIGHT}`,
    display: 'flex',
    alignItems: 'center',
    paddingInlineStart: '24px',
  },
  title: {
    maxWidth: '75%',
    margin: '0 auto',
  },
  wrapper: {
    backgroundColor: Colors.WHITE,
    display: 'flex',
  },
  '@keyframes animateDots': {
    '50%': {
      content: '".."',
    },
    '100%': {
      content: '"..."',
    },
  },
  loadingIndicator: {
    '&::after': {
      content: '"."',
      animation: '$animateDots 1s linear infinite',
    },
  },
});

export function Loading({ message = 'Loading' }: { message?: string }) {
  const classes = useStyles();
  return (
    <ConsoleThemeProvider>
      <ConsolePageWrapper helmetTitle={message}>
        <ConsoleAppBar />
        <ConsoleAppDrawer>
          <div className={classes.logoBox}>
            <TopLeftLogo />
          </div>
        </ConsoleAppDrawer>
        <ConsoleAppMainContent>
          <Typography
            variant="body2"
            className={cx(classes.title, classes.loadingIndicator)}
          >
            {message}
          </Typography>
        </ConsoleAppMainContent>
      </ConsolePageWrapper>
    </ConsoleThemeProvider>
  );
}
