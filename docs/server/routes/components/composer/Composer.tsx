/** @jsxImportSource @emotion/react */

import { useContext } from 'react';
import { VersionContext } from 'docs/server/App.tsx';
import { CordComposer4 } from 'docs/server/routes/components/composer/Composer4.tsx';
import { CordComposer3 } from 'docs/server/routes/components/composer/Composer3.tsx';

function CordComposer() {
  const { version } = useContext(VersionContext);
  if (version === '2.0') {
    return <CordComposer4 />;
  }

  return <CordComposer3 />;
}

export default CordComposer;
