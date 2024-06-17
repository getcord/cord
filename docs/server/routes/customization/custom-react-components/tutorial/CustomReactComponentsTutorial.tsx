/** @jsxImportSource @emotion/react */

import type { ReactNode } from 'react';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Link } from 'react-router-dom';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import { TutorialStep } from 'docs/server/routes/customization/custom-react-components/tutorial/TutorialStep.tsx';
import { betaV2 } from '@cord-sdk/react';
import {
  GithubMessage,
  SnippetList as MessageSnippetList,
} from 'docs/server/routes/customization/custom-react-components/tutorial/github/GithubMessage.tsx';
import {
  GithubAvatar,
  SnippetList as AvatarSnippetList,
} from 'docs/server/routes/customization/custom-react-components/tutorial/github/GithubAvatar.tsx';
import {
  GithubSendButton,
  SnippetList as SendButtonSnippetList,
} from 'docs/server/routes/customization/custom-react-components/tutorial/github/GithubSendButton.tsx';
import { GithubMenuItem } from 'docs/server/routes/customization/custom-react-components/tutorial/github/GithubMenuItem.tsx';
import {
  GithubComposer,
  SnippetList as ComposerSnippetList,
} from 'docs/server/routes/customization/custom-react-components/tutorial/github/GithubComposer.tsx';
import { LIVE_CUSTOMIZATION_ON_DOCS_REPLACEMENTS_THREAD_ID_PREFIX } from 'common/const/Ids.ts';
import { COMMUNITY_ORIGIN } from 'common/const/Urls.ts';
import {
  GithubMenuButton,
  SnippetList as MenuButtonSnippetList,
} from 'docs/server/routes/customization/custom-react-components/tutorial/github/GithubMenuButton.tsx';

const REPLACE: {
  component: string;
  targetComponent:
    | React.ComponentType<any>
    | Record<string, Record<string, React.ComponentType<any>>>;
  step: number;
}[] = [
  { component: 'Avatar', targetComponent: GithubAvatar, step: 1 },
  { component: 'SendButton', targetComponent: GithubSendButton, step: 2 },
  { component: 'ComposerLayout', targetComponent: GithubComposer, step: 3 },
  { component: 'MessageLayout', targetComponent: GithubMessage, step: 4 },
  {
    component: 'within',
    targetComponent: {
      OptionsMenu: {
        MenuItem: GithubMenuItem,
        MenuButton: GithubMenuButton,
      },
    },
    step: 5,
  },
];

function CustomReactComponentsTutorial() {
  const [step, setStep] = useState(0);

  const [visibleSteps, setVisibleSteps] = useState(new Set([0]));

  const goToStep = useCallback(
    (stepNumber: number) => {
      setStep(stepNumber);
      // TODO make animations work only in the thread
      // document.startViewTransition(() => {
      //   flushSync(() => {
      //     setStep(stepNumber);
      //   });
      // });
    },
    [setStep],
  );

  const onInView = useCallback((stepNumber: number, isInView: boolean) => {
    if (isInView) {
      setVisibleSteps((prev) => new Set([...prev, stepNumber]));
    } else {
      setVisibleSteps((prev) => {
        const next = new Set(prev);
        next.delete(stepNumber);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (visibleSteps.size === 0) {
      return;
    }

    if (visibleSteps.has(REPLACE.length)) {
      setStep(REPLACE.length);
      return;
    }

    const sortedVisibleSteps = [...visibleSteps].sort();
    setStep(sortedVisibleSteps[0]);
  }, [visibleSteps]);

  return (
    <Page
      pretitle="Custom Components"
      title="Custom components step by step"
      pageSubtitle="Learn how to replace components to make Cord your own"
      fullWidth
    >
      <div
        css={{
          display: 'flex',
          flexDirection: 'row',
          height: 'calc(max(100vh - 400px, 400px))',
        }}
      >
        <div
          css={{
            height: '100%',
            overflowY: 'scroll',
            width: '50%',
            paddingRight: 12,
          }}
        >
          <div
            css={{
              ['&>div']: {
                padding: '24px 16px',
                cursor: 'pointer',
                borderLeft: '3px solid transparent',
              },
              [`& .activeStep`]: {
                backgroundColor: '#F6F1FF',
                borderLeftColor: '#9A6AFF',
                boxSizing: 'border-box',
              },
            }}
          >
            <TutorialStep
              key="0"
              onClick={goToStep}
              step={0}
              onInView={onInView}
              isActive={step === 0}
            >
              <h3>Welcome to replacements</h3>
              <p>
                Cord's{' '}
                <Link to="/customization/custom-react-components">
                  Replacements API
                </Link>{' '}
                is the key to customizing your app beyond CSS tweaks. Today,
                we'll learn how to give our app the look of GitHub. Let's jump
                right in.
              </p>
              <ShowCodeButton>
                <CodeBlock
                  snippetList={[
                    {
                      language: 'typescript',
                      languageDisplayName: 'React',
                      snippet: `<betaV2.Thread.ByID
  replace={REPLACE}
  threadID={threadID}
  css={{
    ['.cord-thread-header-container']: { display: 'none' },
  }}
/>`,
                    },
                    {
                      language: 'typescript',
                      languageDisplayName: 'REPLACE',
                      snippet: `const REPLACE = {};`,
                    },
                  ]}
                />
              </ShowCodeButton>
            </TutorialStep>
            <TutorialStep
              key="1"
              step={1}
              onClick={goToStep}
              onInView={onInView}
              isActive={step === 1}
            >
              <h3>
                Adding a status indicator to{' '}
                <Link to="/components/cord-avatar?version=2.0">
                  <code>Avatar</code>
                </Link>
              </h3>
              <p>
                The{' '}
                <Link to="/components/cord-avatar?version=2.0">
                  <code>Avatar</code>
                </Link>{' '}
                component shows the user's profile picture. We want to show the
                user's status indicator on top of their picture.
              </p>
              <p>
                We can replace the default cord{' '}
                <Link to="/components/cord-avatar?version=2.0">
                  <code>Avatar</code>
                </Link>{' '}
                with our own component that renders the default Cord{' '}
                <Link to="/components/cord-avatar?version=2.0">
                  <code>Avatar</code>
                </Link>{' '}
                and the status badge as a sibling.
              </p>
              <p>
                Replacing a component with itself and something more is a common
                use case.
              </p>
              <ShowCodeButton>
                <CodeBlock snippetList={AvatarSnippetList} />
              </ShowCodeButton>
            </TutorialStep>
            <TutorialStep
              key="2"
              step={2}
              onClick={goToStep}
              onInView={onInView}
              isActive={step === 2}
            >
              <h3>
                Show a different <code>SendButton</code>
              </h3>
              <p>
                If the default <code>SendButton</code> (shown in the composer)
                doesn't fit your design, you can replace it with your own.
              </p>
              <p>
                Even as we completely replace the component used, it's important
                to understand that we retain access to the original props. This
                enables us to conveniently reuse them, making the replacement a
                smooth experience.
              </p>
              <ShowCodeButton>
                <CodeBlock snippetList={SendButtonSnippetList} />
              </ShowCodeButton>
            </TutorialStep>
            <TutorialStep
              key="3"
              step={3}
              onClick={goToStep}
              onInView={onInView}
              isActive={step === 3}
            >
              <h3>
                Changing the{' '}
                <Link to="/components/cord-composer?version=2.0">
                  <code>Composer</code>
                </Link>
                's layout
              </h3>
              <p>
                The{' '}
                <Link to="/components/cord-composer?version=2.0">
                  <code>Composer</code>
                </Link>{' '}
                is where you write your messages. Replacing the
                <code>SendButton</code> already made some changes to it, but if
                you want to make more complex changes, you can replace{' '}
                <code>ComposerLayout</code> and shuffle elements around or
                extend the functionality.
              </p>
              <p>
                Through their props, our layout components receive the elements
                they need to show. You can move them around and add some styles.
              </p>
              <ShowCodeButton>
                <CodeBlock snippetList={ComposerSnippetList} />
              </ShowCodeButton>
            </TutorialStep>
            <TutorialStep
              key="4"
              step={4}
              onClick={goToStep}
              onInView={onInView}
              isActive={step === 4}
            >
              <h3>
                Transform{' '}
                <Link to="/components/cord-message?version=2.0">
                  <code>Message</code>
                </Link>
              </h3>
              <p>
                A{' '}
                <Link to="/components/cord-thread?version=2.0">
                  <code>Message</code>
                </Link>{' '}
                is a collection of messages with a composer. You can change how
                each of the messages looks like by replacing the{' '}
                <Link to="/components/cord-message?version=2.0">
                  <code>Message</code>
                </Link>{' '}
                component.
              </p>
              <ShowCodeButton>
                <CodeBlock snippetList={MessageSnippetList} />
              </ShowCodeButton>
            </TutorialStep>
            <TutorialStep
              key="5"
              step={5}
              onClick={goToStep}
              onInView={onInView}
              isActive={step === 5}
            >
              <h3>
                Customize Cord <code>OptionsMenu</code>
              </h3>
              <p>
                Our options menu already includes multiple features and actions.
                You might want to include some functionality specific to your
                product.{' '}
              </p>
              <p>
                You can modify the Cord <code>OptionsMenu</code> to change the
                look of the <code>MenuButton</code> and also add new features or
                change the existing <code>MenuItem</code>s. For this, you need
                to replace <code>MenuItem</code> and <code>MenuButton</code>{' '}
                inside a specific component (<code>OptionsMenu</code>) with the{' '}
                <code>within</code> option in the{' '}
                <Link to="/customization/custom-react-components#ReplaceConfig">
                  <code>ReplaceConfig</code>
                </Link>
                .
              </p>
              <ShowCodeButton>
                <CodeBlock snippetList={MenuButtonSnippetList} />
              </ShowCodeButton>
            </TutorialStep>
            <div>
              <p>
                In these steps, we've learned how to use Cord's{' '}
                <Link to="/customization/custom-react-components">
                  Replacements API
                </Link>{' '}
                to customize the appearance of your application's components and
                enhance their functionality.
              </p>
              <p>
                For further details on which components can be replaced and what
                props they accept, refer to our{' '}
                <Link to="/components">Components page</Link>, or explore more
                about replacements in our{' '}
                <Link to="/customization/custom-react-components">
                  API documentation
                </Link>
                . If you have any remaining questions, feel free to ask within
                our{' '}
                <a href={COMMUNITY_ORIGIN} target="_blank" rel="noreferrer">
                  Cord Community
                </a>
                .
              </p>
            </div>
          </div>
        </div>
        <div css={{ width: '40%', padding: '0 12px', height: '100%' }}>
          <MiniApp step={step} />
        </div>
      </div>
    </Page>
  );
}
export default CustomReactComponentsTutorial;

function MiniApp({ step }: { step: number }) {
  const replace = useMemo(() => {
    return REPLACE.filter((i) => i.step <= step).reduce(
      (
        acc: Record<
          string,
          | React.ComponentType
          | Record<string, Record<string, React.ComponentType>>
        >,
        r,
      ) => {
        acc[r.component] = r.targetComponent;
        return acc;
      },
      {},
    );
  }, [step]);

  const authContext = useContext(AuthContext);
  const [threadID, setThreadID] = useState<string | undefined>(undefined);
  useEffect(() => {
    setThreadID(
      `${LIVE_CUSTOMIZATION_ON_DOCS_REPLACEMENTS_THREAD_ID_PREFIX}${authContext.organizationID}`,
    );
  }, [authContext.organizationID, setThreadID]);

  if (!threadID) {
    return null;
  }

  return (
    <betaV2.Thread.ByID
      replace={replace}
      threadID={threadID}
      css={{
        width: '100%',
        height: '100%',
        viewTransitionName: 'magic',
        '.cord-thread-header-container': { display: 'none' },
      }}
    />
  );
}

function ShowCodeButton({ children }: { children: ReactNode }) {
  const [showCode, setShowCode] = useState(false);

  const onClick = useCallback(() => {
    setShowCode((prev) => !prev);
  }, [setShowCode]);

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        type="button"
        onClick={onClick}
        css={{
          backgroundColor: 'transparent',
          border: '1px solid #D0D7DE',
          borderRadius: 6,
          padding: '8px 16px',
          marginTop: 16,
          cursor: 'pointer',
          [':hover']: {
            backgroundColor: '#F6F8FA',
          },
        }}
      >
        {showCode ? 'Hide code' : 'Show code'}
      </button>
      {showCode && children}
    </div>
  );
}
