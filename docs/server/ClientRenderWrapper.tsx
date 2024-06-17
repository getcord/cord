import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

// This is a silly hack to force everything inside to client side render rather
// than server side render.  We are using it for the demo apps to suppress some
// errors where the code is trying to SSR in the docs (because that's what the
// docs generally do) and then is freaking out because the client side code is
// being changed by us manually loading the demo apps in .js scripts (see
// usePrepareMiniApp).  The code still works like that because React decides to
// switch to only client side rendering, but you're stuck with the error.  So to
// get rid of the error, wrap the apps in this hacky component which forces
// its children to be client side rendered because useEffect runs after mount,
// which is a client-only event.
const ClientSideRender = ({ children }: { children: ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <>{children}</> : null;
};

export default ClientSideRender;
