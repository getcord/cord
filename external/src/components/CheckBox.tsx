import { createUseStyles } from 'react-jss';
import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';

const useStyles = createUseStyles({
  checkBox: {
    alignItems: 'center',
    background: Colors.WHITE,
    border: `1px solid`,
    borderRadius: 2,
    display: 'flex',
    height: Sizes.CHECKBOX_DEFAULT_SIZE_PX,
    justifyContent: 'center',
    width: Sizes.CHECKBOX_DEFAULT_SIZE_PX,
  },
});

type Props = {
  done: boolean;
  setDone?: (done: boolean, eventLogMethod?: string) => void;
};

/**
 * @deprecated Use `ui3/Checkbox` instead
 */
export function CheckBox({ done, setDone }: Props) {
  const classes = useStyles();
  return (
    <div
      className={classes.checkBox}
      onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        setDone?.(!done, 'checked-task');
      }}
      style={{
        cursor: setDone ? 'pointer' : 'default',
        borderColor: done ? Colors.GREY_X_DARK : Colors.GREY_DARK,
      }}
    >
      {done && <Icon2 name="Check" />}
    </div>
  );
}
