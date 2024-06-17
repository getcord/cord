import { Button, Typography } from '@mui/material';
import { createUseStyles } from 'react-jss';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  container: {
    borderRadius: Sizes.LARGE_BORDER_RADIUS,
    background: Colors.BRAND_PURPLE_LIGHT,
    padding: Sizes.XLARGE,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: Sizes.MEDIUM,
  },
  text: { flexGrow: 1 },
  ctaRow: {
    display: 'flex',
    gap: Sizes.MEDIUM,
  },
});

export function ByeByeBanner() {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <Typography variant="body2" className={classes.text}>
        <p>
          Cord&apos;s hosted service (both free and paid versions), and the
          company, is shutting down in August. However, Cord&apos;s code is
          becoming open source, and you can freely use it in your own
          infrastructure.
        </p>
        <p>
          Shutting down is sad for us - Cord&apos;s employees, the clients who
          supported us along the journey, and investors. But we are very happy
          to be supported by our team and our investors in the decision to make
          Cord free for everyone to use. We have worked hard for years to make
          it easy for any developer to add real-time commenting and
          collaboration in their app, and we&apos;ve built a solution used by
          tens of thousands of people across products and industries - from
          video players to digital whiteboards, collaborative drawing
          applications to finance and BI tools, and many more. We are deeply
          thankful to our customers for their support, feedback, and belief in
          us. We are incredibly proud of what we&apos;ve accomplished, and
          incredibly grateful to our investors for their trust, support, advice
          - and for pushing for the right ending, where Cord is available for
          everyone to use.
        </p>
        <p>
          If you&apos;re using Cord now, or want to get collaboration into your
          app, our Open Source repository (<i>more details coming shortly</i>)
          contains all the details about how to install the backend service, and
          the entire code for the SDK that you can host, package and ship with
          your application.
        </p>
        <p>
          We hope that Cord will continue to benefit people, develop and grow in
          your applications. We can&apos;t wait to see what you build next.
        </p>
      </Typography>
      <div className={classes.ctaRow}>
        <Button
          size="small"
          href={`https://docs.cord.com/`}
          variant="contained"
          sx={{ flex: 'none' }}
          disabled={true}
        >
          Open Source Repository
        </Button>
      </div>
    </div>
  );
}
