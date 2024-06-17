import { Divider } from '@material-ui/core';
import { createUseStyles } from 'react-jss';
import { TOOLBAR_HEIGHT } from 'external/src/entrypoints/console/const.ts';

type MainProps = React.PropsWithChildren<{
  header: React.ReactNode;
  withoutDivider?: boolean;
}>;

const useStyles = createUseStyles({
  container: {
    display: 'grid',
    gap: '24px',
    height: `calc(100% - ${TOOLBAR_HEIGHT}px)`,
    gridTemplateRows: 'auto auto 1fr',
    gridTemplateColumns: '100%',
  },
  content: { display: 'flex', flexDirection: 'column' },
});

export default function Main({ header, children, withoutDivider }: MainProps) {
  const classes = useStyles();

  return (
    <article className={classes.container}>
      <header>{header}</header>
      {withoutDivider ? null : <Divider />}
      <section className={classes.content}>{children}</section>
    </article>
  );
}
