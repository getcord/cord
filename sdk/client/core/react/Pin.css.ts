import * as classes from '@cord-sdk/react/components/Pin.classnames.ts';
import { CORD_V1, defaultGlobalStyle, globalStyle } from 'common/ui/style.ts';
export default classes;

const { pinContainer } = classes;

defaultGlobalStyle(`:where(.${CORD_V1}).cord-component-pin`, {
  // position cord-pin by default relatively, so that children are
  // position with respect to the pin (see below). Also, set display to
  // inline-block, so that the box of the Pin is just the square around the
  // pin rather than as wide as parent element. Otherwise the relative
  // positioning is relative to this wider box.
  position: 'relative',
  display: 'inline-block',
});

globalStyle(`.${pinContainer}`, {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  position: 'relative',
  transformOrigin: 'bottom left',
});
