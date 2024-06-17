import {
  cordifyClassname,
  globalStyle,
  internalStyle,
} from 'common/ui/style.ts';

import { Colors } from 'common/const/Colors.ts';
import { Sizes } from 'common/const/Sizes.ts';

export const cursor = internalStyle({
  cursor: 'pointer',
});

export const linkPreviewWrapper = cordifyClassname('link-preview-wrapper');
globalStyle(`.${linkPreviewWrapper}`, {
  display: 'flex',
  flexDirection: 'row',
  marginBlockStart: Sizes.MEDIUM,
});

export const linkPreviewHide = cordifyClassname('link-preview-hide');
globalStyle(`.${linkPreviewHide}`, {
  height: 16,
  pointerEvents: 'none',
  visibility: 'hidden',
  cursor: 'pointer',
});

globalStyle(`:where(.${linkPreviewWrapper}):hover .${linkPreviewHide}`, {
  visibility: 'visible',
  pointerEvents: 'auto',
});

export const linkPreviewContainer = cordifyClassname('link-preview-container');
globalStyle(`.${linkPreviewContainer}`, {
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
  maxWidth: 500,
});

export const linkPreviewTitle = cordifyClassname('link-preview-title');
globalStyle(`:where(.${linkPreviewContainer}) .${linkPreviewTitle}`, {
  gridArea: 'title',
  fontWeight: 'bold',
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: '2',
});

globalStyle(`:where(.${linkPreviewContainer}) .${linkPreviewTitle}`, {
  textDecoration: 'none',
});

export const linkPreviewDescription = cordifyClassname(
  'link-preview-description',
);
globalStyle(`:where(.${linkPreviewContainer}) .${linkPreviewDescription}`, {
  gridArea: 'description',
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: '3',
});

export const linkPreviewURL = cordifyClassname('link-preview-url');
globalStyle(`:where(.${linkPreviewContainer}) .${linkPreviewURL}`, {
  gridArea: 'url',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  color: Colors.BRAND_PRIMARY,
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
});

export const linkPreviewImage = cordifyClassname('link-preview-image');
globalStyle(`:where(.${linkPreviewContainer}) .${linkPreviewImage}`, {
  gridArea: 'image',
  width: 360,
  maxWidth: '100%',
  maxHeight: 200,
  objectFit: 'contain',
  objectPosition: 'left',
});
