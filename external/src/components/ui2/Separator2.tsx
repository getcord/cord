import { createUseStyles } from 'react-jss';

import type { SpaceVar } from 'common/ui/cssVariables.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';

const useStyles = createUseStyles({
  separator: {
    height: `calc(${cssVar('space-4xs')}/2)`,
    flex: 'none',
  },
});

type Props = {
  marginVertical?: SpaceVar;
};

/**
 * @deprecated Use ui3/Separator instead
 */
export function Separator2({ marginVertical = '2xs' }: Props) {
  const classes = useStyles();
  return (
    <Box2
      className={classes.separator}
      marginVertical={marginVertical}
      backgroundColor="base-x-strong"
    />
  );
}
