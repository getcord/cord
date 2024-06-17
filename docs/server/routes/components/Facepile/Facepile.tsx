/** @jsxImportSource @emotion/react */

import { useContext } from 'react';
import { VersionContext } from 'docs/server/App.tsx';
import Facepile3 from 'docs/server/routes/components/Facepile/Facepile3.tsx';
import Facepile4 from 'docs/server/routes/components/Facepile/Facepile4.tsx';

function CordFacepile() {
  const { version } = useContext(VersionContext);

  if (version === '2.0') {
    return <Facepile4 />;
  }
  return <Facepile3 />;
}

export default CordFacepile;
