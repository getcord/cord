/** @jsxImportSource @emotion/react */
import { Global, css } from '@emotion/react';

/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs.
 * Also make the necessary changes to clean up the code
 */
import { useContext, useMemo } from 'react';
import { betaV2 } from '@cord-sdk/react/';
import { DOCS_ORIGIN } from 'common/const/Urls.ts'; // not req in code sample
import { AuthContext } from 'docs/server/state/AuthProvider.tsx'; // not req in code sample

function ComposerDefault() {
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

  return <betaV2.SendComposer createThread={createThreadOptions} />;
}

const code = `import { useMemo } from 'react';
import { betaV2 } from '@cord-sdk/react/';

function ComposerDefault() {
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
      createThread={createThreadOptions}
    />
  );
}`;

// styles the component
const cssStyling = `
.cord-composer.cord-v2 {
  width: 300px;
}`;
const styles = css(cssStyling);

export const COMPOSER_DEFAULT_SNIPPETS = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function ComposerDefaultWrapper() {
  return (
    <>
      <Global styles={styles} />
      <ComposerDefault />
    </>
  );
}
