import { createUseStyles } from 'react-jss';

import { Box } from 'external/src/components/ui/Box.tsx';
import { Text } from 'external/src/components/ui/Text.tsx';
import { Sizes } from 'common/const/Sizes.ts';

const useStyles = createUseStyles({
  box: {
    alignItems: 'center',
    cursor: 'default',
    display: 'flex',
    height: Sizes.SMALL_ICON_SIZE,
    justifyContent: 'center',
    width: Sizes.SMALL_ICON_SIZE,
  },
});

type Props = {
  domain: string;
};

export function PlaceholderFavicon({ domain }: Props) {
  const classes = useStyles();
  return (
    <Box className={classes.box} rounded="small" backgroundColor="GREY_LIGHT">
      <Text fontSize="xSmall" color="GREY_DARK">
        {domain[0].toUpperCase()}
      </Text>
    </Box>
  );
}
