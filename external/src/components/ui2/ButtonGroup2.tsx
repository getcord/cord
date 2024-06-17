import cx from 'classnames';
import { createUseStyles } from 'react-jss';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { Button2 } from 'external/src/components/ui2/Button2.tsx';

type Props = {
  children:
    | React.ReactElement<typeof Button2>
    | boolean
    | Array<React.ReactElement<typeof Button2> | boolean>;
  className?: string;
};

const useStyles = createUseStyles({
  buttonContainer: {
    gap: cssVar('space-3xs'),
  },
});

/** @deprecated Please use a styled div instead */
export const ButtonGroup2 = ({ children, className }: Props) => {
  const classes = useStyles();
  // filter to remove any false values resulting from conditional rendering
  // i.e. (featureEnabled && <Button ...>) where featureEnabled is false
  const elementChildren = Array.isArray(children)
    ? children.filter(Boolean)
    : children;
  return (
    <Row2 className={cx(className, classes.buttonContainer)}>
      {elementChildren}
    </Row2>
  );
};
