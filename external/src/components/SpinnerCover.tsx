import { createUseStyles } from 'react-jss';

import { Sizes } from 'common/const/Sizes.ts';
import { Spinner } from 'external/src/components/ui/Spinner.tsx';
import type { SpaceVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  spinnerContainer: {
    alignItems: 'center',
    borderRadius: Sizes.SMALL + 'px',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
  },
});

type Props = {
  size?: SpaceVar;
  containerStyle?: React.CSSProperties;
};

export function SpinnerCover({ size, containerStyle }: Props) {
  const classes = useStyles();
  return (
    <div className={classes.spinnerContainer} style={containerStyle}>
      <Spinner size={size} />
    </div>
  );
}
