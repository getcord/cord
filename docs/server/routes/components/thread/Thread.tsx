/** @jsxImportSource @emotion/react */

import { useContext } from 'react';

import { VersionContext } from 'docs/server/App.tsx';
import Thread4 from 'docs/server/routes/components/thread/Thread4.tsx';
import Thread3 from 'docs/server/routes/components/thread/Thread3.tsx';

function CordThread() {
  const { version } = useContext(VersionContext);

  return version === '2.0' ? <Thread4 /> : <Thread3 />;
}

export default CordThread;
