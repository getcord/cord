import { createUseStyles } from 'react-jss';
import { Button, Typography } from '@mui/material';
import {
  ConsoleAppBar,
  ConsoleAppDrawer,
  ConsoleAppMainContent,
  ConsolePageWrapper,
} from 'external/src/entrypoints/console/components/ConsolePageLayout.tsx';
import { TOOLBAR_HEIGHT } from 'external/src/entrypoints/console/const.ts';
import { Colors } from 'common/const/Colors.ts';
import { ConsoleThemeProvider } from 'external/src/entrypoints/console/contexts/ConsoleThemeProvider.tsx';
import { TopLeftLogo } from 'external/src/entrypoints/console/components/TopLeftLogo.tsx';

const useStyles = createUseStyles({
  logoBox: {
    minHeight: TOOLBAR_HEIGHT + 'px',
    borderBottom: `1px solid ${Colors.GREY_LIGHT}`,
    display: 'flex',
    alignItems: 'center',
    paddingInlineStart: '24px',
  },
  wrapper: {
    maxWidth: '75%',
    margin: '0 auto',
  },
});

export function AuthErrorPage({
  email,
  errorMessage,
  logout,
}: {
  email?: string;
  errorMessage: string;
  logout: () => void;
}) {
  const classes = useStyles();
  return (
    <ConsoleThemeProvider>
      <ConsolePageWrapper helmetTitle="Auth Error">
        <ConsoleAppBar />
        <ConsoleAppDrawer>
          <div className={classes.logoBox}>
            <TopLeftLogo />
          </div>
        </ConsoleAppDrawer>
        <ConsoleAppMainContent>
          <div className={classes.wrapper}>
            {errorMessage === 'duplicate_auth0_account' ? (
              <Typography variant="body2">
                {`There is already a Cord account associated with ${
                  email ?? 'this email'
                }, please retry logging in or contact `}
                <a href="mailto:support@cord.com">support@cord.com</a>
              </Typography>
            ) : (
              <Typography variant="body2">
                Something went wrong, please contact{' '}
                <a href="mailto:support@cord.com">support@cord.com</a>
              </Typography>
            )}

            <Button sx={{ mt: 2 }} variant="contained" onClick={() => logout()}>
              Retry Login
            </Button>
          </div>
        </ConsoleAppMainContent>
      </ConsolePageWrapper>
    </ConsoleThemeProvider>
  );
}
