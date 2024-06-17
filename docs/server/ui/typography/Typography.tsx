/** @jsxImportSource @emotion/react */

import type { Interpolation, Theme } from '@emotion/react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { Colors } from 'common/const/Colors.ts';

// If you're reading this file, you're probably wondering what the heck all this
// hacky stuff is for generating IDs. The reason this stuff exists is to solve
// three problems:
//
// 1) We want a nice table of contents on the right side of the page
// 2) To get (1), we need Heading elements with IDs so that we can hash-scroll
//    to them.
// 3) We need all the Heading elements to have unqiue IDs.  This matters for
//    navigating in-page and also for HTML validity. It's an HTML sin to have
//    duplicate ID attributes in the same document.
//
// So, what all this nonsense is about is generating IDs from the text contents
// of the Heading. I'm phoning it in on complex heading children (e.g. children
// with other tags in them.). If the heading has a child that is a string,
// we use it to generate an ID.
//
// On many pages, there are several H<N> tags with the same text. For instance,
// the REST API pages have several secions with 'HTTP Request' as a heading.  We
// *could* force the content editor to come up with a unique ID attribute for
// every Heading. That will work for all of 2 seconds when someone checks in a
// Heading with no ID. So, instead of forcing the content editor to be super
// creative, we just figure out IDs programmatically. If we see "HTTP Request"
// for the 2nd time, its id becomes "HTTP-Request-2". Truly inspired. This code
// keeps a simple count of all the IDs it's seen at the current
// location. If the location changes, it restarts the counts. Yes, I'm
// using sort-of-global module state to do this. If you think it's worth
// fixing... you're probably spending your time on unimportant things (unless
// it's broken in some way I'm not seeing.)
//
// The gnarlier part of this is that we've got server-side rendering to contend
// with. The IDs have to remain stable between server render and client hydration.
// That's what the useMemo() ensures. As long as the location doesn't change,
// we won't regenerate the IDs.
//
// If we didn't useMemo() the IDs, we'd get duplicates for every ID when the
// client hydrates because the server will have already seen them all once
// at the current location and then the client would see them all again
// at the same location, so every one of them would look like a dupe.

const COMMON_CSS: Interpolation<Theme> = {
  maxWidth: '955px',
  scrollMarginTop: '72px',
  fontFamily: 'FavoritWeb',

  '&:hover > a': {
    visibility: 'visible',
  },
};

function replaceNonAlphaChars(s: string): string {
  return s.replace(/[^A-Za-z0-9]/g, '-');
}

let idCountForLocation: { [id: string]: number } = {};
let lastLocationPathname: string | undefined = undefined;
function IDify(
  locationPathname: string,
  thing: React.ReactNode,
): string | undefined {
  if (locationPathname !== lastLocationPathname) {
    idCountForLocation = {};
    lastLocationPathname = locationPathname;
  }

  if (typeof thing === 'string') {
    let id = replaceNonAlphaChars(thing);
    if (idCountForLocation[id]) {
      idCountForLocation[id]++;
      id += '-' + idCountForLocation[id];
    } else {
      idCountForLocation[id] = 1;
    }
    return id;
  }
  return undefined;
}

function useID(children: React.ReactNode): string | undefined {
  const location = useLocation();
  const id = useMemo(
    () => IDify(location.pathname, children),
    [location.pathname, children],
  );
  return id;
}

type HeadingProps = {
  children: React.ReactNode;
  dontShowInTableOfContents?: boolean;
  css?: Interpolation<Theme>;
  style?: React.CSSProperties;
};

export function H2({
  children,
  dontShowInTableOfContents,
  ...rest
}: HeadingProps) {
  const id = useID(children);
  return (
    <h2
      css={{
        ...(COMMON_CSS as object),
        fontSize: 40,
        fontWeight: 400,
        letterSpacing: '-0.065em',
        lineHeight: 1,
        margin: '24px 0',
      }}
      id={id}
      {...(dontShowInTableOfContents ? { 'data-tocignore': true } : {})}
      {...rest}
    >
      {children}
      {id && <LinkToFragment id={id} />}
    </h2>
  );
}

export function H3({
  children,
  dontShowInTableOfContents,
  ...rest
}: HeadingProps) {
  const id = useID(children);
  return (
    <>
      <h3
        css={{
          ...(COMMON_CSS as object),
          fontSize: 32,
          fontWeight: 400,
          lineHeight: 1,
          margin: '24px 0',
        }}
        id={id}
        {...(dontShowInTableOfContents ? { 'data-tocignore': true } : {})}
        {...rest}
      >
        {children}
        {id && <LinkToFragment id={id} />}
      </h3>
    </>
  );
}

export function H4({
  children,
  dontShowInTableOfContents,
  ...rest
}: HeadingProps) {
  const id = useID(children);
  return (
    <h4
      css={{
        ...(COMMON_CSS as object),
        fontSize: 24,
        fontWeight: 400,
        lineHeight: 1.4,
        margin: '24px 0',
      }}
      id={id}
      {...(dontShowInTableOfContents ? { 'data-tocignore': true } : {})}
      {...rest}
    >
      {children}
      {id && <LinkToFragment id={id} />}
    </h4>
  );
}

export function H5({
  children,
  dontShowInTableOfContents,
  ...rest
}: HeadingProps) {
  const id = useID(children);
  return (
    <h5
      css={{
        ...(COMMON_CSS as object),
        fontSize: 16,
        fontWeight: 700,
        lineHeight: 1.4,
        margin: '16px 0',
      }}
      id={id}
      {...(dontShowInTableOfContents ? { 'data-tocignore': true } : {})}
      {...rest}
    >
      {children}
    </h5>
  );
}

export function H6({
  children,
  dontShowInTableOfContents,
  ...rest
}: HeadingProps) {
  const id = useID(children);
  return (
    <h6
      css={{
        ...(COMMON_CSS as object),
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1.4,
        margin: '16px 0',
      }}
      id={id}
      {...(dontShowInTableOfContents ? { 'data-tocignore': true } : {})}
      {...rest}
    >
      {children}
    </h6>
  );
}

export function Strong({
  children,
  dontShowInTableOfContents,
  ...rest
}: HeadingProps) {
  const id = useID(children);
  return (
    <strong
      id={id}
      {...(dontShowInTableOfContents ? { 'data-tocignore': true } : {})}
      {...rest}
    >
      {children}
    </strong>
  );
}

/**
 * Add a "#" that links to a fragment, so it's easy to share
 * a link to a specific part of the document
 */
export function LinkToFragment({ id }: { id: string }) {
  return (
    <a
      data-search-ignore={true}
      data-cord-search-ignore={true}
      href={`#${id}`}
      css={{
        color: Colors.PURPLE,
        visibility: 'hidden',
        textDecoration: 'none',
        ':hover': {
          opacity: 0.6,
        },
      }}
    >
      {` #`}
    </a>
  );
}

export function getHeaderTag(level: number) {
  switch (level) {
    // case 1:
    //   return H1;
    case 2:
      return H2;
    case 3:
      return H3;
    case 4:
      return H4;
    case 5:
      return H5;
    case 6:
      return H6;
    default:
      return Strong;
  }
}
