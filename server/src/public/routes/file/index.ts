import type { Request, Response } from 'express';
import { FileEntity } from 'server/src/entity/file/FileEntity.ts';
import { decodeFileProxyToken } from 'server/src/files/download.ts';

export async function FileProxyHandler(req: Request, res: Response) {
  const token = req.query.token;
  if (!token || typeof token !== 'string') {
    return res.status(400).send();
  }

  try {
    const { id } = decodeFileProxyToken(token);

    const file = await FileEntity.findByPk(id);
    if (!file) {
      return res.status(404).send();
    }

    const signedDownloadURL = await file.getSignedDownloadURL();
    return res.redirect(302, signedDownloadURL);
  } catch (e) {
    return res.status(400).send();
  }
}
