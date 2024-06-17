import { globalStyle } from 'common/ui/style.ts';
import { ZINDEX } from '@cord-sdk/react/common/ui/zIndex.ts';

globalStyle(`cord-dev-tools ul`, {
  all: 'unset',
  listStyleType: 'none',
  display: 'flex',
  gap: '4px',
  marginBottom: '16px',
  paddingBottom: '4px',
  borderBottom: '1px solid black',
});
globalStyle(`cord-dev-tools li`, {
  border: '1px solid black',
  padding: '2px 4px',
  boxShadow: '0 0 2px black',
  borderRadius: '4px',
});
globalStyle(`cord-dev-tools li[data-tab-active="true"]`, {
  background: 'aliceblue',
});

globalStyle(`cord-dev-tools > div`, {
  position: 'fixed',
  top: '20px',
  left: '20px',

  border: '1px solid black',
  background: 'antiquewhite',

  width: '350px',
  padding: '8px',

  zIndex: ZINDEX.popup,
});

globalStyle(`cord-dev-tools .optionsContainer`, {
  display: 'flex',
  flexDirection: 'column',
});

globalStyle(`cord-dev-tools .multipleChoice`, {
  display: 'flex',
  flexDirection: 'column',
});
globalStyle(`cord-dev-tools .multipleChoice > label`, {
  textIndent: '8px',
});

globalStyle(`.cord-dev-tools-blocked`, {
  background: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 100 100'><path d='M100 0 L0 100 ' stroke='red' stroke-width='2'/><path d='M0 0 L100 100 ' stroke='red' stroke-width='2'/></svg>")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center center',
  backgroundSize: '100% 100%, auto',
  filter: 'blur(1px)',
});
