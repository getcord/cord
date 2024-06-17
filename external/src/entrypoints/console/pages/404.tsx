import { createUseStyles } from 'react-jss';
import { Link } from 'react-router-dom';
import { Typography } from '@material-ui/core';
import { Helmet } from 'react-helmet';
import { ConsoleRoutes } from 'external/src/entrypoints/console/routes.ts';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  header: {
    color: Colors.GREY_X_DARK,
    marginBottom: Sizes.LARGE,
  },
});

export function NotFound() {
  const classes = useStyles();
  return (
    <>
      <Helmet>
        <title>Page not found</title>
      </Helmet>
      <Typography className={classes.header} variant="h4">
        Uh Oh
      </Typography>
      <p>
        <Typography>
          We couldn&apos;t find that page. Sorry about that.
        </Typography>
      </p>
      <p>
        <Typography>
          <Link to={ConsoleRoutes.HOME}>Return home</Link>
        </Typography>
      </p>
    </>
  );
}
