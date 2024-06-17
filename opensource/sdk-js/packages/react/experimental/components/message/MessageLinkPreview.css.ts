import { Colors } from '../../../common/const/Colors.js';
import { Sizes } from '../../../common/const/Sizes.js';
import { cssVar } from '../../../common/ui/cssVariables.js';
import { globalStyle } from '../../../common/ui/style.js';
import * as classes from '../../../components/message/MessageLinkPreview.classnames.js';
export default classes;

export const {
  linkPreviewContainer,
  linkPreviewHide,
  linkPreview,
  linkPreviewTitle,
  linkPreviewDescription,
  linkPreviewURL,
  linkPreviewImage,
} = classes;

globalStyle(`.${linkPreviewContainer}`, {
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'row',
  marginBlockStart: Sizes.MEDIUM,
  userSelect: 'none',
});

globalStyle(`.${linkPreviewHide}`, {
  height: cssVar('space-m'),
  pointerEvents: 'none',
  visibility: 'hidden',
  cursor: 'pointer',
});

globalStyle(`.${linkPreviewContainer}:hover .${linkPreviewHide}`, {
  visibility: 'visible',
  pointerEvents: 'auto',
  background: 'none',
});

globalStyle(`.${linkPreview}`, {
  borderLeft: `${Sizes.SMALL}px solid ${Colors.GREY_LIGHT}`,
  display: 'grid',
  gridTemplateAreas: `
        "url"
        "title"
        "description"
        "image"`,
  rowGap: Sizes.SMALL,
  paddingInlineStart: Sizes.LARGE,
  flex: 1,
});

globalStyle(`.${linkPreview} .${linkPreviewTitle}`, {
  gridArea: 'title',
  fontWeight: 'bold',
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: '2',
});

globalStyle(`.${linkPreview} .${linkPreviewTitle}`, {
  textDecoration: 'none',
});

globalStyle(`.${linkPreview} .${linkPreviewDescription}`, {
  gridArea: 'description',
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: '3',
});

globalStyle(`.${linkPreview} .${linkPreviewURL}`, {
  gridArea: 'url',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  color: Colors.BRAND_PRIMARY,
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
});

globalStyle(`.${linkPreview} .${linkPreviewImage}`, {
  gridArea: 'image',
  maxWidth: '100%',
  objectFit: 'contain',
  objectPosition: 'left',
});
