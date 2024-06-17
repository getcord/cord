import type { RequestHandler } from 'express';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';

const Robots: RequestHandler = (req, res) => {
  res.status(200);
  res.header('Content-type', 'text/plain');
  res.send(`Sitemap: ${DOCS_ORIGIN}/sitemap.xml`);
};

export default Robots;
