/* eslint-disable i18next/no-literal-string */
import { createUseStyles } from 'react-jss';

import { capitalizeFirstLetter } from 'common/util/index.ts';
import { APP_ORIGIN } from 'common/const/Urls.ts';
import { ContentBox2 } from 'external/src/components/ui2/ContentBox2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';

const useStyles = createUseStyles({
  modalAndContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: cssVar('space-m'),
    marginTop: 90,
  },
  button: {
    alignSelf: 'flex-start',
  },
});

type Props = {
  provider: 'slack' | 'google' | 'ms-teams';
  onCancel: () => void;
  data?: {
    teamName?: string;
    title?: string;
    body?: string;
  };
};

export function ThirdPartyAuthModal({ provider, onCancel, data }: Props) {
  const classes = useStyles();

  const providerName = capitalizeFirstLetter(provider);
  const img = {
    src: `${APP_ORIGIN}/static/connect_slack_demo.gif`,
    alt: 'Screenshot of a user sharing their message with teammates',
  };

  const title =
    data?.title ??
    `Connect ${providerName}${
      data?.teamName ? ' (' + data.teamName + ')' : ''
    }`;

  const subtext =
    data?.body ??
    `Follow the instructions on the ${providerName} pop-up to continue.`;

  return (
    <ContentBox2
      marginHorizontal="m"
      padding="3xl"
      className={classes.modalAndContainer}
      borderRadius="large"
    >
      <img src={img.src} alt={img.alt} />
      <Text2 color="content-emphasis" font="body-emphasis">
        {title}
      </Text2>
      <Text2 color="content-secondary">{subtext}</Text2>
      <Button2
        buttonType="secondary"
        size="medium"
        additionalClassName={classes.button}
        onClick={onCancel}
      >
        Go back
      </Button2>
    </ContentBox2>
  );
}
