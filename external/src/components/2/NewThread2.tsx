import { createUseStyles } from 'react-jss';
import { CordTrans, useCordTranslation } from '@cord-sdk/react';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import type { UUID } from 'common/types/index.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import type { ComposerAction } from 'external/src/context/composer/ComposerState.ts';
import type { SlackChannelType } from 'external/src/graphql/custom.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { Composer3 } from 'external/src/components/2/Composer3.tsx';
import NewThread2Provider from 'external/src/context/thread2/NewThread2Provider.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useComposerActions } from 'external/src/components/chat/composer/hooks/useComposerActions.ts';
import { Link2 } from 'external/src/components/ui2/Link2.tsx';

const useStyles = createUseStyles({
  newThreadPageContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'flex-end',
  },
  threadContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  newThreadComposer: {
    flexShrink: 0,
    padding: cssVar('space-2xs'),
    paddingTop: '0',
  },
});

type Props = {
  threadID: UUID;
  initialComposerAction?: ComposerAction;
  slackChannelToShareTo: SlackChannelType | null;
};

function NewThread2Impl() {
  const { t } = useCordTranslation('sidebar');
  const classes = useStyles();
  const { enableAnnotations } =
    useContextThrowingIfNoProvider(ConfigurationContext);

  // useComposerActions requires a ComposerContext, which is provided by
  // NewThread2Provider, which is instantiated in this file's exported function.
  // Hence this private, inner component.
  const { createAnnotation } = useComposerActions();

  return (
    <Box2 className={classes.newThreadPageContainer}>
      <Box2 className={classes.threadContainer} padding="m">
        <Text2
          color="content-emphasis"
          font="small-emphasis"
          marginBottom="3xs"
        >
          {t('add_comment_instruction')}
        </Text2>
        {enableAnnotations && (
          <Text2 color="content-primary" font="small">
            <CordTrans
              t={t}
              i18nKey={'annotation_nudge'}
              components={{
                l: (
                  <Link2
                    linkStyle="primary-small"
                    onClick={() => void createAnnotation()}
                  />
                ),
              }}
            ></CordTrans>
          </Text2>
        )}
      </Box2>
      <Box2 className={classes.newThreadComposer}>
        <Composer3
          size={'large'}
          shouldFocusOnMount={true}
          showBorder={true}
          showExpanded={true}
        />
      </Box2>
    </Box2>
  );
}

export function NewThread2({
  threadID,
  initialComposerAction,
  slackChannelToShareTo,
}: Props) {
  return (
    <NewThread2Provider
      threadID={threadID}
      initialComposerAction={initialComposerAction}
      slackChannelToShareTo={slackChannelToShareTo}
    >
      <NewThread2Impl />
    </NewThread2Provider>
  );
}
