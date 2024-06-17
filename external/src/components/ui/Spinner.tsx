import { createUseStyles } from 'react-jss';

import { Colors } from 'common/const/Colors.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import type { SpaceVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  spinner: {
    animation: `$spin 1s linear infinite`,
    border: '3px solid' + Colors.GREY_X_LIGHT,
    borderRadius: '100%',
    borderTopColor: Colors.GREY,
    borderRightColor: Colors.GREY,
    content: '""',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
});

type Props = {
  size?: SpaceVar;
};

export function Spinner({ size = 'l' }: Props) {
  const classes = useStyles();

  return <Box2 width={size} height={size} className={classes.spinner} />;
}
