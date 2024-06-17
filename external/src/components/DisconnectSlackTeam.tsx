/* eslint-disable i18next/no-literal-string */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { useLogger } from 'external/src/logging/useLogger.ts';
import { Sizes } from 'common/const/Sizes.ts';
import { Colors } from 'common/const/Colors.ts';
import { useUnlinkOrgMutation } from 'external/src/graphql/operations.ts';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import {
  SOMETHING_WENT_WRONG_TEXT,
  UNLINK_SLACK_SUCCESS_TEXT,
} from 'common/const/Strings.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { ApplicationContext } from 'external/src/context/embed/ApplicationContext.tsx';
import { ContentBox2 } from 'external/src/components/ui2/ContentBox2.tsx';
import { BasicButtonWithUnderline2 } from 'external/src/components/ui2/BasicButtonWithUnderline2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { SettingsSection2 } from 'external/src/components/ui2/SettingsSection2.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const useStyles = createUseStyles({
  buttonIcon: {
    flexShrink: 0,
    marginRight: Sizes.SMALL,
    padding: Sizes.XSMALL,
  },
  centerText: {
    textAlign: 'center',
  },
  finalStepModal: {
    backgroundColor: Colors.ALERT_LIGHT,
    borderBottomLeftRadius: Sizes.SMALL,
    borderBottomRightRadius: Sizes.SMALL,
    padding: Sizes.LARGE,
  },
  slackButton: {
    display: 'flex',
  },
  alertColor: {
    borderColor: cssVar('color-alert'),
    padding: 0,
  },
  finalStepModal2: {
    backgroundColor: cssVar('color-base-strong'),
    borderBottomLeftRadius: cssVar('space-3xs'),
    borderBottomRightRadius: cssVar('space-3xs'),
  },
  paddingMedium: {
    padding: cssVar('space-m'),
  },
  fullWidth: {
    width: '100%',
  },
});

export function DisconnectSlackTeam() {
  const [showFinalStep, setShowFinalStep] = useState(false);
  const classes = useStyles();
  const { logEvent } = useLogger();
  const finalStepRef = useRef<HTMLDivElement>(null);

  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const [unlinkFromSlack] = useUnlinkOrgMutation();

  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;

  const applicationName =
    useContextThrowingIfNoProvider(ApplicationContext)?.applicationName ?? '';

  useEffect(() => {
    if (showFinalStep) {
      finalStepRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showFinalStep]);

  const handleUnlinkFromSlack = useCallback(async () => {
    logEvent('click-settings-final-step-disconnect-slack');
    const result = await unlinkFromSlack({
      variables: {
        _externalOrgID: organization?.externalID,
      },
    });

    if (result.data?.unlinkOrgs.success) {
      logEvent(`disconnect-service`, { service: 'slack' });
      showToastPopup?.(UNLINK_SLACK_SUCCESS_TEXT);
    } else {
      // not sure if this would ever be the case?
      showToastPopup?.(SOMETHING_WENT_WRONG_TEXT);
    }
  }, [logEvent, unlinkFromSlack, showToastPopup, organization?.externalID]);

  const onFirstStepClick = useCallback(() => {
    setShowFinalStep(true);
    logEvent('click-settings-first-step-disconnect-slack');
  }, [logEvent]);

  const onCancelDisconnect = useCallback(() => {
    logEvent('click-settings-cancel-final-step-disconnect-slack');
    setShowFinalStep(false);
  }, [logEvent]);

  return (
    <ContentBox2 borderRadius="medium" className={classes.alertColor}>
      <SettingsSection2
        title="Disconnect your Slack team"
        subtext={`This will remove Slack for everyone in this ${applicationName} account.
          It will no longer be possible to mention anyone in Slack, or receive
          replies.`}
        subtextFontStyle="body"
        className={classes.paddingMedium}
      >
        <BasicButtonWithUnderline2
          label={`Disconnect Slack (${organization?.linkedOrganization?.name})`}
          labelColor={!showFinalStep ? 'alert' : 'content-secondary'}
          disabled={showFinalStep}
          onClick={onFirstStepClick}
          labelFontStyle="body"
          iconName="Slack"
          iconPosition="start"
          className={classes.fullWidth}
        />
      </SettingsSection2>
      {showFinalStep && (
        <SettingsSection2
          forwardRef={finalStepRef}
          className={cx(classes.finalStepModal2, classes.paddingMedium)}
          title="Are you sure?"
          subtext={`Confirm you understand that this will disconnect Slack for everyone
          using this ${applicationName} account.`}
          subtextFontStyle="body"
        >
          <Button2
            size="medium"
            buttonType="primary"
            onClick={handleUnlinkFromSlack}
            isFullWidth={true}
            cssVariablesOverride={{
              backgroundColor: 'color-alert',
              backgroundColorHover: 'color-alert',
              colorHover: 'color-base',
            }}
          >
            Disconnect my Slack team
          </Button2>
          <BasicButtonWithUnderline2
            label="No, cancel"
            labelFontStyle="body"
            onClick={onCancelDisconnect}
          />
        </SettingsSection2>
      )}
    </ContentBox2>
  );
}
