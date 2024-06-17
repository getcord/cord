/** @jsxImportSource @emotion/react */
import { Global, css } from '@emotion/react';

/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs
 */
import { useContext, useMemo } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/20/solid';
import { betaV2 } from '@cord-sdk/react';
import type { SendButtonProps } from '@cord-sdk/react/betaV2.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx'; // not req in code sample
import { DOCS_ORIGIN } from 'common/const/Urls.ts'; // not req in code sample

const REPLACE_SEND_BUTTON: betaV2.ReplaceConfig = {
  SendButton: PaperPlaneSendButton,
};

function ComposerWithCustomizedSendButton() {
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
      replace={REPLACE_SEND_BUTTON}
      createThread={createThreadOptions}
    />
  );
}

function PaperPlaneSendButton(props: SendButtonProps) {
  return (
    <button type="button" className="plane-send-button" {...props}>
      <PaperAirplaneIcon
        className={
          props.disabled ? 'plane-send-icon-disabled' : 'plane-send-icon'
        }
      />
    </button>
  );
}

export const code = `import { PaperAirplaneIcon } from '@heroicons/react/20/solid';
import { betaV2 } from '@cord-sdk/react';
import type { SendButtonProps } from '@cord-sdk/react/betaV2.ts';

const REPLACE_SEND_BUTTON: betaV2.ReplaceConfig = {
  SendButton: PaperPlaneSendButton,
};

function ComposerWithCustomizedSendButton() {
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
      replace={REPLACE_SEND_BUTTON}
      createThread={createThreadOptions}
    />
  );
}

function PaperPlaneSendButton(props: SendButtonProps) {
  return (
    <button type="button" className="plane-send-button" {...props}>
      <PaperAirplaneIcon
        className={
          props.disabled ? 'plane-send-icon-disabled' : 'plane-send-icon'
        }
      />
    </button>
  );
}`;

// styles the component
const cssStyling = `
.cord-composer.cord-v2 {
  width: 300px;
}

.plane-send-button {
  height: 32px;
  width: 32px;
  cursor: pointer;
  background-color: transparent;
}

.plane-send-icon-disabled {
  color: grey;
}

.plane-send-icon {
  color: black;
}`;
const styles = css(cssStyling);

export const COMPOSER_WITH_CUSTOMIZED_SEND_BUTTON_SNIPPETS = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function ComposerWithCustomizedSendButtonWrapper() {
  return (
    <>
      <Global styles={styles} />
      <ComposerWithCustomizedSendButton />
    </>
  );
}
