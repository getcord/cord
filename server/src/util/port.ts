import type { AddressInfo } from 'net';
import { resolve } from 'path';
import { promises as fs } from 'fs';

export type ListenPort =
  | { port: number }
  | { path: string; readableAll: boolean; writableAll: boolean };

export function parseListenPort(
  portOrPath: string | null | undefined,
): ListenPort | null {
  if (!portOrPath) {
    return null;
  }

  if (/^\s*\d+\s*$/.test(portOrPath)) {
    const port = Number(portOrPath);
    if (port < 1 || port > 65535) {
      throw new Error(`Invalid port number: ${port}`);
    }

    return { port };
  }

  // If the path is prefixed with a `+`, the socket will be made
  // readable/writeable for all users (that's the unix users on the server
  // machine)
  const allowAllUsersToConnect = portOrPath[0] === '+';
  const path = resolve(
    allowAllUsersToConnect ? portOrPath.substring(1) : portOrPath,
  );

  return {
    path,
    readableAll: allowAllUsersToConnect,
    writableAll: allowAllUsersToConnect,
  };
}

export function getHostPortion(addr: AddressInfo | string | null): string {
  if (addr === null) {
    return '(null)';
  } else if (typeof addr === 'string') {
    return `unix:${addr}:`;
  } else {
    return `localhost:${addr.port}`;
  }
}

export async function preparePort(port: ListenPort) {
  if ('path' in port) {
    // For unix domain sockets, remove any pre-existing file or socket under that path name.
    await fs.unlink(port.path).catch((err) =>
      // Ignore ENOENT (file does not exist) error, pass on everything else
      err.code === 'ENOENT' ? undefined : Promise.reject(err),
    );
  }
}
