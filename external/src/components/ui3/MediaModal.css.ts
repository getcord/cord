import { globalStyle } from 'common/ui/style.ts';

import { cssVar } from 'common/ui/cssVariables.ts';
import {
  topBanner,
  bannerText,
  bannerDate,
  imageModalOverlay,
  imageContainer,
  image,
  caption,
} from 'external/src/components/ui3/MediaModal.classnames.ts';

export {
  topBanner,
  bannerText,
  bannerDate,
  imageModalOverlay,
  imageContainer,
  image,
  caption,
};

// calced to match the height of the full page thread page header
// TODO make this logic less sidebar-dependent
const TOP_BAR_HEIGHT = `calc(${cssVar('space-2xl')} + 2*${cssVar(
  'space-2xs',
)})`;

globalStyle(`.${topBanner}`, {
  backgroundColor: cssVar('color-base'),
  borderColor: cssVar('color-base-x-strong'),
  display: 'flex',
  position: 'absolute',
  flex: 'none',
  flexDirection: 'row',
  alignItems: 'center',
  height: TOP_BAR_HEIGHT,
  justifyContent: 'space-between',
  paddingInline: `${cssVar('space-m')} ${cssVar('space-2xs')}`,
  top: 0,
  left: 0,
  right: 0,
  gap: `${cssVar('space-2xs')}`,
});

globalStyle(`:where(.${topBanner}) .${bannerText}`, {
  marginInline: `0 auto`,
  color: cssVar('color-content-emphasis'),
});

globalStyle(`:where(.${topBanner} .${bannerText}) .${bannerDate}`, {
  color: cssVar('color-content-primary'),
});

globalStyle(`.${imageModalOverlay}`, {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingInline: '4px',
});

globalStyle(`.${imageContainer}`, {
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100%',
  maxHeight: `calc(100%  - ${TOP_BAR_HEIGHT})`,
  paddingInline: '38px',
  paddingTop: TOP_BAR_HEIGHT,
});

globalStyle(`:where(.${imageContainer}) .${image}`, {
  display: 'block',
  objectFit: 'contain',
  minHeight: 0,
  maxWidth: '100%',
});

globalStyle(`:where(.${imageContainer}) .${caption}`, {
  background: cssVar('color-base-strong'),
  borderRadius: '0 0 8px 8px',
  color: cssVar('color-content-primary'),
  lineHeight: cssVar('line-height-small'),
  margin: 0,
  overflowX: 'hidden',
  padding: cssVar('space-2xs'),
});
