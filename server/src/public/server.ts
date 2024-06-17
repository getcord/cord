import 'reflect-metadata';

import type { ListenPort } from 'server/src/util/port.ts';
import { getHostPortion } from 'server/src/util/port.ts';
import { drainHelper } from 'server/src/serverStatus.ts';
import { createExpressApp } from 'server/src/public/app.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';
import { warmup } from 'server/src/public/warmup.ts';

export async function serverMain(port: ListenPort) {
  const { httpServer, apolloServer } = await createExpressApp();

  await warmup();

  drainHelper.install(httpServer);

  // Start our server
  return await new Promise<void>((resolve, reject) => {
    httpServer.addListener('error', reject);
    httpServer.listen(port, () => {
      httpServer.removeListener('error', reject);
      resolve();
      const host = getHostPortion(httpServer.address());
      anonymousLogger().info(`🚀 Server ready at https://${host}/`);
      anonymousLogger().info(
        `🚀 GraphQL ready at https://${host}${apolloServer.graphqlPath}`,
      );
    });
  });
}
