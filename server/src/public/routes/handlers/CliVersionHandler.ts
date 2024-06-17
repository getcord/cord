import type { Request, Response } from 'express';
// eslint-disable-next-line no-restricted-imports
import cliPackageData from 'opensource/cli/package.json';
import { forwardHandlerExceptionsToNext } from 'server/src/public/routes/platform/util.ts';

async function CliVersionHandler(_: Request, res: Response) {
  res.send({ version: cliPackageData.version });
}

export default forwardHandlerExceptionsToNext(CliVersionHandler);
