import type { Request, Response, NextFunction } from 'express';
import {
  AdminGoRedirectEntity,
  canonicalizeRedirectName,
} from 'server/src/entity/go_redirect/AdminGoRedirectEntity.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

export async function goHandler(
  req: Request,
  resp: Response,
  next: NextFunction,
) {
  const [originalName, rest] = splitRedirect(req.path);
  const name = canonicalizeRedirectName(originalName);
  if (name === '' || name === 'edit') {
    // These URL patterns are handled by the UI, so skip the redirector
    next();
    return;
  }
  const redirect = await AdminGoRedirectEntity.findOne({ where: { name } });
  if (redirect) {
    let dest = redirect.url;
    if (redirect.url.includes('{*}')) {
      dest = redirect.url.replace('{*}', rest ?? '');
    } else if (rest) {
      dest += '/' + rest;
    }
    // Intentionally don't await to make redirect faster
    redirect
      .increment('redirectCount')
      .catch((e) =>
        anonymousLogger().logException('Increment redirectCount failed', e),
      );
    resp.redirect(dest);
  } else {
    resp.redirect('/go/edit/' + name);
  }
}

function splitRedirect(path: string): [string, string | null] {
  const cleanedPath = decodeURI(path)
    .replaceAll('+', ' ') // decodeURI doesn't decode this shorthand for you
    .replaceAll(/\/\/+/g, '/') // Replace multiple slashes with one
    .replace(/\/+$/g, '') // Remove trailing slahes
    .replace(/^\/go\//, ''); // Remove the /go/ prefix
  const match = /[ /]/.exec(cleanedPath);
  if (match) {
    const splitPoint = match.index;
    return [
      cleanedPath.substring(0, splitPoint),
      cleanedPath.substring(splitPoint + 1).trim(),
    ];
  } else {
    return [cleanedPath, null];
  }
}
