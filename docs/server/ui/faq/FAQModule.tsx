import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  container: {
    '& > *': {
      borderBottom: '1px solid #cecfd2',
    },
    '& > *:last-child': { borderBottom: 'none' },
  },
});

type FAQModuleProps = {
  children: React.ReactNode;
};

export function FAQModule({ children }: FAQModuleProps) {
  const classes = useStyles();

  return <div className={classes.container}>{children}</div>;
}
