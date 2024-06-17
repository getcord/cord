/** @jsxImportSource @emotion/react */

import { useEffect, useState } from 'react';
import { hasOwnProperty } from 'docs/lib/hasOwnProperty.ts';

type LinkList = {
  title: string;
  id: string;
  tag: string;
  isPropertyHeader?: boolean;
  isCollapsible?: boolean;
  isCollapsed: boolean;
}[];

function makeLinkList() {
  // We omit the H1 because there should be only one of those.
  const headings = Array.from(document.querySelectorAll('h2,h3,h4,h5,h6'));
  const newList: LinkList = [];
  for (const heading of headings) {
    const h = heading as HTMLHeadingElement;
    if (!h.id) {
      continue;
    }

    if (
      hasOwnProperty(h.dataset, 'tocignore') &&
      h.dataset.tocignore === 'true'
    ) {
      continue;
    }

    newList.push({
      id: h.id,
      title: h.innerText,
      tag: h.tagName,
      isPropertyHeader: hasOwnProperty(h.dataset, 'propertiesheader'),
      isCollapsible: hasOwnProperty(h.dataset, 'collapsible'),
      isCollapsed: false,
    });
  }

  let i = 0;
  while (i < newList.length) {
    if (newList[i].isCollapsible) {
      newList[i].isCollapsed = true;
      i++;

      while (i < newList.length && newList[i].isPropertyHeader) {
        newList[i].isCollapsed = !newList[i].isCollapsed;
        i++;
      }
    } else {
      i++;
    }
  }

  return newList;
}

function AutomagicTableOfContents() {
  const [list, setList] = useState<LinkList>([]);

  // This is necessary because of the in-page tabs which don't refresh the
  // page/change the location, but do alter the Table of Contents pretty
  // significantly. We look out for any updates to the DOM and we re-build the
  // TOC. If there was a frequently-changing thing in the page, we'd probably
  // want to debounce this otherwise we'll end up with a perf problem. So far,
  // the docs contain nothing like that, so I'm not going to prematurely
  // optimize it.
  useEffect(() => {
    const pageContent = document.getElementById('page-content');
    if (!pageContent) {
      return;
    }
    const onDOMChange = () => {
      setList(makeLinkList());
    };
    const observer = new MutationObserver(onDOMChange);

    observer.observe(pageContent, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, [setList]);

  useEffect(() => {
    setList(makeLinkList());
  }, [setList]);

  const contents = list.map((l, idx) => {
    if (l.isPropertyHeader && l.isCollapsed) {
      return null;
    }
    return (
      <li
        key={l.id}
        css={{ listStyleType: 'none', padding: 4, display: 'flex' }}
        className={[l.tag, l.isCollapsible ? 'collapsible' : null].join(' ')}
      >
        {l.isCollapsible ? (
          <button
            type="button"
            className={['chevron', l.isCollapsed ? 'collapsed' : null].join(
              ' ',
            )}
            onClick={() => {
              setList((oldList) => {
                oldList[idx].isCollapsed = !oldList[idx].isCollapsed;
                let i = idx + 1;
                while (i < oldList.length && oldList[i].isPropertyHeader) {
                  oldList[i].isCollapsed = !oldList[i].isCollapsed;
                  i++;
                }
                return [...oldList];
              });
            }}
          >
            <Chevron />
          </button>
        ) : null}
        <a
          href={'#' + l.id}
          className={[
            l.isPropertyHeader ? 'propertyheader' : undefined,
            l.isCollapsible ? 'collapsible' : undefined,
          ].join(' ')}
          css={{
            '&&': {
              maxWidth: 240,
              display: 'block',
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
        >
          {l.title}
        </a>
      </li>
    );
  });

  if (contents.length === 0) {
    return null;
  }

  return (
    <nav>
      <div
        css={{ color: 'var(--color-greyDark)', padding: 4 }}
        data-cord-search-ignore="true"
        data-search-ignore="true"
      >
        On this page
      </div>
      <ul
        css={{
          padding: 0,
          '& .H2': { paddingLeft: 0, paddingTop: 4 },
          '& .H3': { paddingLeft: 16, paddingTop: 0 },
          '& .H4': { paddingLeft: 32, paddingTop: 4 },
          '& .H4.collapsible': { paddingLeft: 12 },
          '& .H5': { paddingLeft: 40, paddingTop: 4 },
          '& .H6': { paddingLeft: 48, paddingTop: 4 },
          '& .propertyheader': { fontFamily: 'monospace' },
          '& .chevron': {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--color-purple)',
          },
          '& .chevron svg': {
            transition: 'transform 0.2s linear',
          },
          '& .chevron.collapsed svg': {
            transform: 'rotate(-90deg)',
          },
        }}
        data-cord-search-ignore="true"
        data-search-ignore="true"
      >
        {contents}
      </ul>
    </nav>
  );
}

export default AutomagicTableOfContents;

export function Chevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.23002 7.20999C5.37328 7.07216 5.5654 6.99685 5.76416 7.0006C5.96292 7.00435 6.15206 7.08686 6.29002 7.22999L10 11.168L13.71 7.22999C13.7775 7.15565 13.8591 7.0956 13.9502 7.0534C14.0413 7.01119 14.1399 6.9877 14.2402 6.98431C14.3405 6.98093 14.4405 6.99771 14.5342 7.03366C14.6279 7.06962 14.7135 7.12402 14.7858 7.19365C14.8581 7.26327 14.9157 7.3467 14.9551 7.43899C14.9946 7.53127 15.0151 7.63055 15.0155 7.73092C15.0159 7.83129 14.9962 7.93072 14.9574 8.02332C14.9187 8.11592 14.8618 8.1998 14.79 8.26999L10.54 12.77C10.4701 12.8426 10.3862 12.9003 10.2934 12.9398C10.2006 12.9792 10.1008 12.9995 10 12.9995C9.8992 12.9995 9.79942 12.9792 9.70664 12.9398C9.61386 12.9003 9.52998 12.8426 9.46002 12.77L5.21002 8.26999C5.07219 8.12674 4.99687 7.93462 5.00062 7.73585C5.00437 7.53709 5.08688 7.34795 5.23002 7.20999Z"
        fill="currentColor"
      />
    </svg>
  );
}
