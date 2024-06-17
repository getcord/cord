import * as fs from 'fs';
import * as path from 'path';
import type { RequestHandler } from 'express';

import Env from 'server/src/config/Env.ts';

const extToMime = new Map<string, string>();
extToMime.set('.css', 'text/css');
extToMime.set('.js', 'text/javascript');
extToMime.set('.js.map', 'text/javascript');
extToMime.set('.svg', 'image/svg+xml');
extToMime.set('.png', 'image/png');
extToMime.set('.jpg', 'image/jpeg');
extToMime.set('.jpeg', 'image/jpeg');
extToMime.set('.gif', 'image/gif');
extToMime.set('.woff', 'font/woff');
extToMime.set('.woff2', 'font/woff2');

export const staticResourcePathRegexp =
  /^\/static\/([a-zA-Z\-_0-9/]+)(\.css|\.js|\.js\.map|\.png|\.jpg|\.jpeg|\.svg|\.woff|\.woff2)$/;

export const staticResource: RequestHandler = (req, res) => {
  const match: RegExpMatchArray | null = req.path.match(
    staticResourcePathRegexp,
  );
  if (!match || match.length !== 3) {
    console.log('No match: ' + req.path);
    res.status(500);
    res.send('Bad request');
    return;
  }

  const fileName = match[1];
  const fileExt = match[2].toLowerCase();

  const filePath = path.join(
    process.cwd(),
    Env.DOCS_SERVER_STATIC_PATH,
    fileName + fileExt,
  );

  try {
    const buf = fs.readFileSync(filePath);
    res.status(200);
    const mime = extToMime.get(fileExt) || 'application/octet-stream';
    res.type(mime);
    res.send(buf);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send('Bad request');
    return;
  }
};
