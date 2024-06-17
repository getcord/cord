import type { WithContext, BreadcrumbList, ListItem } from 'schema-dts';
import type { Location } from 'react-router-dom';
import { DOCS_ORIGIN } from 'common/const/Urls.ts';
import { capitalizeFirstLetter } from 'common/util/index.ts';

// Refer to https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
export function generateBreadcrumbList(path: Location['pathname']) {
  const itemsInOrder = extractListItems(path);
  // One of rules of using breadcrumbs is you need at least 2 levels of items
  if (itemsInOrder.length < 2) {
    return null;
  }
  const content: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itemsInOrder,
  };

  return content;
}

function extractListItems(path: string) {
  const pathArray = path.split('/').filter((part) => part.length > 0);
  const listItems: ListItem[] = [];
  let itemPath = DOCS_ORIGIN;
  let position = 0;
  pathArray.forEach((pathSection) => {
    itemPath += '/' + pathSection;
    position++;
    const name = capitalizeFirstLetter(pathSection).split('-').join(' ');

    const listItem: ListItem = {
      '@type': 'ListItem',
      position,
      item: itemPath,
      name,
    };
    listItems.push(listItem);
  });
  return listItems;
}
