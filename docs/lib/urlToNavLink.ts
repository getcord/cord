import type { NavLink } from 'docs/server/navigation.tsx';
import navigation from 'docs/server/navigation.tsx';

// This library does the reverse mapping from a URL back to the nav link that uses it.
// This is useful for rendering search results and showing the parent pages to a given
// page. Useful for rendering breadcrumbs, too.

const urlToNavLink: { [url: string]: { item: NavLink; parent?: NavLink } } = {};

for (const item of navigation) {
  urlToNavLink[item.linkTo] = { item };
  if (item.subnav) {
    for (const subitem of item.subnav) {
      urlToNavLink[subitem.linkTo] = { item: subitem, parent: item };
      if (subitem.subnav) {
        for (const subsubitem of subitem.subnav) {
          urlToNavLink[subsubitem.linkTo] = {
            item: subsubitem,
            parent: subitem,
          };
        }
      }
    }
  }
}

export default urlToNavLink;
