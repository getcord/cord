import { createUseStyles } from 'react-jss';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { Colors } from 'common/const/Colors.ts';

const useStyles = createUseStyles({
  darkModal: {
    backgroundColor: Colors.BLACK,
    bottom: 0,
    left: 0,
    opacity: 0.6,
    position: 'fixed',
    right: 0,
    top: 0,
    zIndex: ZINDEX.popup,
  },
});

// this component is the grey background on app.cord.com when you open a Modal,
// which should go on top
export const DarkModal = () => {
  const classes = useStyles();

  return <div className={classes.darkModal} />;
};
