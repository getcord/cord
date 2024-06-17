import type { RequestHandler } from 'express';
import navigation from 'docs/server/navigation.tsx';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';

function makeURLNode(url: string): string {
  return `  <url>
    <loc>${DOCS_ORIGIN}${url}</loc>
  </url>`;
}

const Sitemap: RequestHandler = (req, res) => {
  // https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#xml

  const urls: string[] = [];
  nav: for (const navItem of navigation) {
    if (navItem.hidden || navItem.linkTo.startsWith('http')) {
      continue nav;
    }
    urls.push(makeURLNode(navItem.linkTo));

    if (navItem.subnav) {
      subNav: for (const subNavItem of navItem.subnav) {
        if (subNavItem.hidden || navItem.linkTo.startsWith('http')) {
          continue subNav;
        }
        urls.push(makeURLNode(subNavItem.linkTo));
        if (subNavItem.subnav) {
          subsubNav: for (const subsubNavItem of subNavItem.subnav) {
            if (subsubNavItem.hidden || navItem.linkTo.startsWith('http')) {
              continue subsubNav;
            }
            urls.push(makeURLNode(subsubNavItem.linkTo));
          }
        }
      }
    }
  }

  // Demo apps
  urls.push(makeURLNode('/get-started/demo-apps/document'));
  urls.push(makeURLNode('/get-started/demo-apps/dashboard'));
  urls.push(makeURLNode('/get-started/demo-apps/canvas'));
  urls.push(makeURLNode('/get-started/demo-apps/video-player'));

  const output = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.status(200);
  res.header('Content-type', 'text/xml');
  res.send(output);
};

export default Sitemap;
