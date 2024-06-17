import { createUseStyles } from 'react-jss';
import { useCordTranslation } from '@cord-sdk/react';

import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';

const useStyles = createUseStyles({
  settingsTopNavButtonsContainer: {
    display: 'flex',
    flexGrow: '1',
    justifyContent: 'space-between',
  },
});

type SettingsTopNavProps = {
  onBack: () => void;
  onClose: () => void;
};

export function SettingsTopNav2({ onBack, onClose }: SettingsTopNavProps) {
  const { t } = useCordTranslation('sidebar');
  const classes = useStyles();

  return (
    <Row2 padding="2xs">
      <Row2 className={classes.settingsTopNavButtonsContainer}>
        <Button2
          buttonType="secondary"
          icon="CaretLeft"
          size="medium"
          onClick={onBack}
        >
          {t('inbox_tooltip')}
        </Button2>

        <WithTooltip2
          label={t('close_settings_tooltip')}
          popperPosition="bottom"
        >
          <Button2
            buttonType="secondary"
            icon="X"
            size="medium"
            onClick={onClose}
          />
        </WithTooltip2>
      </Row2>
    </Row2>
  );
}
