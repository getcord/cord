import { createUseStyles } from 'react-jss';
import { useCordTranslation } from '@cord-sdk/react';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { addSpaceVars, cssVar } from 'common/ui/cssVariables.ts';

type Props = {
  onClick: () => unknown;
};

const useStyles = createUseStyles({
  container: {
    width: '100%',
  },
  buttonContentsContainer: {
    alignItems: 'center',
    cursor: 'pointer',
    display: 'flex',
    gap: cssVar('space-2xs'),
    justifyContent: 'center',
    padding: `${addSpaceVars('m', '4xs')} 0`,
  },
});

export function AddCommentButton2({ onClick }: Props) {
  const { t } = useCordTranslation('sidebar');
  const classes = useStyles();
  return (
    <button className={classes.container} onClick={onClick} type="button">
      <Box2
        className={classes.buttonContentsContainer}
        backgroundColor="brand-primary"
      >
        <Icon2 name="ChatAdd" size="large" color="base" />
        <Text2 color="base" font="body-emphasis">
          {t('add_comment_action')}
        </Text2>
      </Box2>
    </button>
  );
}
