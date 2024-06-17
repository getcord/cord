/** @jsxImportSource @emotion/react */
import { Global, css } from '@emotion/react';

/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs
 */
import { forwardRef, useCallback, useContext, useMemo, useState } from 'react';
import cx from 'classnames';
import { betaV2 } from '@cord-sdk/react/index.ts';
import type { ComposerLayoutProps } from '@cord-sdk/react/betaV2.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx'; // not req in code sample
import { DOCS_ORIGIN } from 'common/const/Urls.ts'; // not req in code sample

function ComposerWithNudgeButton() {
  const authContext = useContext(AuthContext);
  const createThreadOptions = useMemo(() => {
    return {
      name: 'Docs Composer Beta',
      location: { component: 'composer' },
      url: `${DOCS_ORIGIN}/components/cord-composer`,
      groupID: authContext.organizationID,
    };
  }, [authContext.organizationID]);
  // Above to be replaced with
  // const createThreadOptions = useMemo(() => {
  //   return {
  //     name: 'Thread Name',
  //     location: { page: 'Composer Component' },
  //     url: 'https://www.myawesomeweb.com/',
  //     groupID: 'YOUR GROUP ID',
  //   };
  // }, []);
  return (
    <betaV2.SendComposer
      replace={REPLACE_TOOLBAR}
      createThread={createThreadOptions}
    />
  );
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const ComposerLayoutWithAdditionalButton = forwardRef(
  function ComposerLayoutWithAdditionalButton(
    props: ComposerLayoutProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const [nudge, setNudge] = useState(false);

    const nudgeComposer = useCallback(() => {
      setNudge(true);
      setTimeout(() => {
        if (setNudge) {
          setNudge(false);
        }
      }, 1000);
    }, []);

    const nudgeButton = useMemo(() => {
      return {
        name: 'nudge',
        element: (
          <betaV2.Button
            buttonAction="nudge"
            onClick={nudgeComposer}
            className="cord-tertiary nudge-button"
          >
            😵‍💫
          </betaV2.Button>
        ),
      };
    }, [nudgeComposer]);

    const itemsWithAdditionalButton = useMemo(() => {
      if (props.toolbarItems) {
        return [...props.toolbarItems, nudgeButton];
      }
      return props.toolbarItems;
    }, [nudgeButton, props.toolbarItems]);
    return (
      <betaV2.ComposerLayout
        {...props}
        ref={ref}
        toolbarItems={itemsWithAdditionalButton}
        className={cx(props.className, { ['shake']: nudge })}
      />
    );
  },
);

const REPLACE_TOOLBAR: betaV2.ReplaceConfig = {
  ComposerLayout: ComposerLayoutWithAdditionalButton,
};

const code = `import { useCallback, useMemo, useState } from 'react';
import cx from 'classnames';
import { keyframes } from '@emotion/react';
import { betaV2 } from '@cord-sdk/react/index.ts';
import type { ComposerLayoutProps } from '@cord-sdk/react/betaV2.ts';

export function ComposerWithNudgeButton() {
  const createThreadOptions = useMemo(() => {
    return {
      name: 'Thread Name',
      location: { page: 'Composer Component' },
      url: 'https://www.myawesomeweb.com/',
      groupID: 'YOUR GROUP ID',
    };
  }, []);
  return (
    <betaV2.SendComposer
      replace={REPLACE_TOOLBAR}
      css={{
        width: 300,
      }}
      createThread={createThreadOptions}
    />
  );
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const ComposerLayoutWithAdditionalButton = forwardRef(
  function ComposerLayoutWithAdditionalButton(
    props: ComposerLayoutProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const [nudge, setNudge] = useState(false);

    const nudgeComposer = useCallback(() => {
      setNudge(true);
      setTimeout(() => {
        if (setNudge) {
          setNudge(false);
        }
      }, 1000);
    }, []);

    const nudgeButton = useMemo(() => {
      return {
        name: 'nudge',
        element: (
          <betaV2.Button
            buttonAction="nudge"
            onClick={nudgeComposer}
            className="cord-tertiary nudge-button"
          >
            😵‍💫
          </betaV2.Button>
        ),
      };
    }, [nudgeComposer]);

    const itemsWithAdditionalButton = useMemo(() => {
      if (props.toolbarItems) {
        return [...props.toolbarItems, nudgeButton];
      }
      return props.toolbarItems;
    }, [nudgeButton, props.toolbarItems]);
    return (
      <betaV2.ComposerLayout
        {...props}
        ref={ref}
        toolbarItems={itemsWithAdditionalButton}
        className={cx(props.className, { ['shake']: nudge })}
      />
    );
  },
);

const REPLACE_TOOLBAR: betaV2.ReplaceConfig = {
  ComposerLayout: ComposerLayoutWithAdditionalButton,
};`;

// styles the component
const cssStyling = `
.cord-composer.cord-v2 {
  width: 300px;
  animationIterationCount: infinite;
}

.nudge-button {
  width: 24px;
  height: 24px;
  font-size: 12px;
}

.shake {
  animation: shake 0.5s;
}

@keyframes shake {
  0% {
    transform: translate(1px, 1px) rotate(0deg);
  }
  10% {
    transform: translate(-1px, -2px) rotate(-1deg);
  }
  20% {
    transform: translate(-3px, 0px) rotate(1deg);
  }
  30% {
    transform: translate(3px, 2px) rotate(0deg);
  }
  40% {
    transform: translate(1px, -1px) rotate(1deg);
  }
  50% {
    transform: translate(-1px, 2px) rotate(-1deg);
  }
  60% {
    transform: translate(-3px, 1px) rotate(0deg);
  }
  70% {
    transform: translate(3px, 1px) rotate(-1deg);
  }
  80% {
    transform: translate(-1px, -1px) rotate(1deg);
  }
  90% {
    transform: translate(1px, 2px) rotate(0deg);
  }
  100% {
    transform: translate(1px, -2px) rotate(-1deg);
  }
}`;
const styles = css(cssStyling);

export const COMPOSER_WITH_NUDGE_BUTTON_SNIPPETS = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function ComposerWithNudgeButtonWrapper() {
  return (
    <>
      <Global styles={styles} />
      <ComposerWithNudgeButton />
    </>
  );
}
