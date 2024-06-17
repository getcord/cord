// import { useLocation } from 'react-router-dom';
import { Typography } from '@mui/material';
import { createUseStyles } from 'react-jss';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
// import { PlanBanner } from 'external/src/entrypoints/console/components/PlanBanner.tsx';
import { ByeByeBanner } from 'external/src/entrypoints/console/components/ByeByeBanner.tsx';
// import {
//   ConsoleRoutes,
//   ConsoleSettingsRoutes,
// } from 'external/src/entrypoints/console/routes.ts';

const useStyles = createUseStyles({
  title: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  banner: {
    borderRadius: Sizes.LARGE_BORDER_RADIUS,
    background: Colors.GREY_X_LIGHT,
    padding: `${Sizes.XLARGE}px`,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: Sizes.XLARGE,
  },
  leftContent: {
    display: 'flex',
    flexDirection: 'row',
    gap: `${Sizes.DEFAULT_PADDING_PX}px`,
  },
});

type HeaderProps = React.PropsWithChildren<{
  text: string;
  rightContent?: React.ReactNode;
}>;

export default function Header({ text, rightContent }: HeaderProps) {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <Banners />
      <div className={classes.title}>
        <section className={classes.leftContent}>
          <Typography variant="h1">{text}</Typography>
        </section>
        {rightContent}
      </div>
    </div>
  );
}

function Banners() {
  return <ByeByeBanner />;
  // const location = useLocation();
  // const billingPath = `${ConsoleRoutes.SETTINGS}/${ConsoleSettingsRoutes.SETTINGS_BILLING}`;
  // const shouldShowPlanBanner = !(
  //   location.pathname.includes('getting-started') ||
  //   location.pathname === billingPath
  // );

  // return <>{shouldShowPlanBanner ? <PlanBanner /> : null}</>;
}
