import { cssVar } from 'common/ui/cssVariables.ts';
import { cordifyClassname, globalStyle } from 'common/ui/style.ts';

export const emptyStatePlaceholderContainer = cordifyClassname(
  'empty-state-placeholder',
);
export const emptyStatePlaceholderTitle = cordifyClassname(
  'empty-state-placeholder-title',
);
export const emptyStatePlaceholderBody = cordifyClassname(
  'empty-state-placeholder-body',
);

globalStyle(`.${emptyStatePlaceholderContainer}`, {
  fontFamily: cssVar('font-family'),
  fontSize: cssVar('font-size-body'),
  lineHeight: cssVar('line-height-body'),
  margin: 'auto 0',
  overflow: 'auto',
  padding: cssVar('space-m'),
});

globalStyle(
  `.${emptyStatePlaceholderContainer} :where(.${emptyStatePlaceholderTitle})`,
  {
    color: cssVar('color-content-emphasis'),
    margin: `0 0 ${cssVar('space-2xs')} 0`,
    fontWeight: cssVar('font-weight-bold'),
  },
);

globalStyle(
  `.${emptyStatePlaceholderContainer} :where(.${emptyStatePlaceholderBody})`,
  {
    color: cssVar('color-content-primary'),
    fontWeight: cssVar('font-weight-regular'),
  },
);
