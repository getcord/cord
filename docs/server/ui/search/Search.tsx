/** @jsxImportSource @emotion/react */
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';
import { hasOwnProperty } from 'docs/lib/hasOwnProperty.ts';
import SearchResult from 'docs/server/ui/search/SearchResult.tsx';

type SearchResultType = {
  url: string;
  name: string;
  plainText?: string;
  parentName?: string;
};

const assertIsSearchResult = (thing: unknown) => {
  if (
    thing &&
    typeof thing === 'object' &&
    hasOwnProperty(thing, 'url') &&
    typeof thing.url === 'string' &&
    hasOwnProperty(thing, 'name') &&
    typeof thing.name === 'string' &&
    (!hasOwnProperty(thing, 'parentName') ||
      typeof thing.parentName === 'string') &&
    (!hasOwnProperty(thing, 'plainText') || typeof thing.plainText === 'string')
  ) {
    return thing as SearchResultType;
  }
  throw new Error('Invalid search result');
};

type SearchProps = {
  fullPage: boolean;
  limit?: number;
  offset?: number;
};

function Search({ fullPage, limit = 20, offset = 0 }: SearchProps) {
  const shimRef = useRef<HTMLDivElement>();
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState([]);

  const navigate = useNavigate();

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const search = useCallback(
    (s: string, _limit: number, _offset: number) => {
      void (async () => {
        const resp = await fetch(
          '/api/search?s=' +
            encodeURIComponent(s) +
            '&limit=' +
            encodeURIComponent(_limit) +
            '&offset=' +
            encodeURIComponent(_offset) +
            '&ref=' +
            encodeURIComponent(window.location.toString()),
          {
            method: 'post',
          },
        );
        if (!resp.ok) {
          return;
        }

        const scores = await resp.json();
        setResults(scores);
      })();
    },
    [setResults],
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val !== '') {
        window.location.hash = '#!?s=' + encodeURIComponent(val);
      } else {
        window.location.hash = '';
      }

      setSearchValue(val);
      setResults([]);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        if (val !== '') {
          search(val, limit, offset);
        }
      }, 300);
    },
    [setSearchValue, setResults, search, limit, offset],
  );

  const onKeyUp = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        navigate('/search#!?s=' + encodeURIComponent(searchValue));
      }
    },
    [searchValue, navigate],
  );

  useEffect(() => {
    if (window.location.hash && window.location.hash.startsWith('#!?s=')) {
      const val = decodeURIComponent(window.location.hash.replace('#!?s=', ''));
      setSearchValue(val);
      search(val, limit, offset);
    }
  }, [search, setSearchValue, limit, offset]);

  const inputRef = useRef<HTMLInputElement>(null);

  const nukeTheSearch = useCallback(() => {
    const el = document.getElementById('searchShim');
    if (el) {
      document.body.removeChild(el);
    }
    setResults([]);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  }, [setResults]);

  useEffect(() => {
    if (!search && !results.length) {
      return;
    }

    const callback = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        nukeTheSearch();
      }
    };

    window.addEventListener('keyup', callback);
    return () => {
      window.removeEventListener('keyup', callback);
    };
  }, [search, results, nukeTheSearch]);

  useEffect(() => {
    if (fullPage) {
      return;
    }

    if (!shimRef.current) {
      shimRef.current = document.createElement('div');
      shimRef.current.style.position = 'fixed';
      shimRef.current.style.top = '0px';
      shimRef.current.style.right = '0px';
      shimRef.current.style.bottom = '0px';
      shimRef.current.style.left = '0px';
      shimRef.current.style.background = 'var(--color-notionBlack)';
      shimRef.current.style.opacity = '0.5';
      shimRef.current.style.zIndex = '1';
      shimRef.current.id = 'searchShim';
    }

    if (results.length && shimRef.current) {
      shimRef.current.addEventListener('click', nukeTheSearch);
      document.body.appendChild(shimRef.current);
    }
    return () => {
      if (shimRef.current) {
        shimRef.current.removeEventListener('click', nukeTheSearch);
      }
    };
  }, [results, fullPage, nukeTheSearch]);

  // Make sure we remove the shim on onload. When client-side
  // navigation happens via react-router-dom, we don't want to
  // leave the shim covering the page.
  useEffect(() => {
    return () => {
      const el = document.getElementById('searchShim');
      if (el) {
        document.body.removeChild(el);
      }
    };
  }, []);

  return (
    <div
      css={{ position: 'relative', flex: 1, [breakpoints.tablet]: { flex: 0 } }}
    >
      <div
        css={{
          display: 'flex',
          flex: 1,
          position: 'relative',
          // Magnifying glass circle
          '&::before': {
            background:
              results.length || fullPage
                ? 'var(--color-greyXlight)'
                : '#d9d9d9',
            border: '1px var(--color-purple) solid',
            borderRadius: '100%',
            content: '" "',
            display: 'block',
            height: '14px',
            left: 34,
            position: 'absolute',
            top: 9,
            width: '14px',
            zIndex: 6,
          },
          // Magnifying glass tail
          '&::after': {
            background: 'var(--color-purple)',
            borderRadius: '1px',
            content: '" "',
            display: 'block',
            height: '5px',
            left: 47,
            position: 'absolute',
            transform: 'rotate(-45deg)',
            top: 20,
            width: '1px',
            zIndex: 6,
          },
        }}
      >
        <input
          ref={inputRef}
          tabIndex={1}
          type="text"
          value={searchValue}
          onChange={onChange}
          onKeyUp={onKeyUp}
          placeholder="Search"
          autoFocus={fullPage ? true : false}
          css={{
            background: '#ffffffcc',
            border: fullPage
              ? '2px var(--color-purple) solid'
              : '2px #fff solid',
            borderRadius: 20,
            flex: 1,
            isolation: 'isolate',
            margin: '0 16px',
            outline: 'none',
            padding: '2.5px 16px 2.5px 47px',
            position: 'relative',
            zIndex: fullPage ? 'auto' : 5,
            ...(results.length && !fullPage
              ? {
                  background: 'var(--color-greyXlight)',
                  border: 'none',
                  borderBottom: '1px var(--color-purple) solid',
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                }
              : null),
            '&::placeholder': {
              color: 'var(--color-notionBlack)',
            },
            [breakpoints.tablet]: {
              flexGrow: fullPage ? 1 : 0,
              width: fullPage ? 'unset' : 120,
              marginRight: 24,
            },
          }}
        />
      </div>
      {results.length > 0 && (
        <div
          css={{
            background: 'var(--color-greyXlight)',
            borderRadius: 16,
            ...(!fullPage
              ? {
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                }
              : null),
            boxShadow: fullPage
              ? 'none'
              : '0px 10px 40px -12px rgba(0,0,0,0.75)',
            left: 0,
            right: 0,
            margin: '0 16px',
            ...(fullPage ? { marginTop: 32 } : null),
            isolation: 'isolate',
            padding: 24,
            position: fullPage ? 'static' : 'absolute',
            top: fullPage ? 0 : 30,
            zIndex: fullPage ? 'auto' : 4,
            [breakpoints.tablet]: {
              left: 'unset',
              maxWidth: '90vw',
            },
          }}
        >
          <ol css={{ listStyle: 'none', padding: 0 }}>
            {results.map((res, idx) => {
              const r = assertIsSearchResult(res);
              return (
                <SearchResult
                  key={r.url}
                  url={r.url}
                  name={r.name}
                  parentName={r?.parentName}
                  plainText={r.plainText}
                  index={idx + 1}
                />
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

export default Search;
