import { createUseStyles } from 'react-jss';

import { useCordTranslation } from '@cord-sdk/react';
import { BasicButtonWithUnderline2 } from 'external/src/components/ui2/BasicButtonWithUnderline2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';

const useStyles = createUseStyles({
  editState: {
    display: 'flex',
    borderRadius: `${cssVar('space-2xs')} ${cssVar('space-2xs')} 0 0`,
    // Adding a negative margin-bottom because we want this banner
    // to hide behind the composer. Without this, we will see the
    // the bottom corners of the banner when the composer is out of
    // focus which looks bad
    marginBottom: `calc(${cssVar('space-4xs')} * -1)`,
  },
  cancelEdit: {
    marginLeft: 'auto',
  },
  bannerWrapper: {
    margin: cssVar('space-2xs'),
    marginBottom: '0',
  },
});

type EditingMessageBannerProps = {
  cancelEdit: () => void;
};

export function EditingMessageBanner({
  cancelEdit,
}: EditingMessageBannerProps) {
  const { t } = useCordTranslation('composer');
  const classes = useStyles();

  return (
    <div className={classes.bannerWrapper}>
      <Box2
        paddingVertical="2xs"
        paddingHorizontal="m"
        backgroundColor="base-strong"
        className={classes.editState}
      >
        <Text2 font="small-light" color="content-primary">
          {t('editing_status')}
        </Text2>
        <BasicButtonWithUnderline2
          label={t('cancel_editing_action')}
          onClick={cancelEdit}
          className={classes.cancelEdit}
          labelFontStyle="small-light"
          labelColor="content-primary"
        />
      </Box2>
    </div>
  );
}
