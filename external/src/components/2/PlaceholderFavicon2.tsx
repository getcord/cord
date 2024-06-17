import { createUseStyles } from 'react-jss';

import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';

const useStyles = createUseStyles({
  placeholderFavicon: {
    alignItems: 'center',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
  },
});

type Props = {
  domain: string;
};

export function PlaceholderFavicon2({ domain }: Props) {
  const classes = useStyles();
  return (
    <Box2
      className={classes.placeholderFavicon}
      backgroundColor="base-x-strong"
      borderRadius="small"
      width="m"
      height="m"
    >
      <Text2 font="small" color="content-primary">
        {domain[0].toUpperCase()}
      </Text2>
    </Box2>
  );
}
