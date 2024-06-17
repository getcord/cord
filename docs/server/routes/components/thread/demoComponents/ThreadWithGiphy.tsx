import { Global, css } from '@emotion/react';

// So I blieve this shouldn't be a problem as their API keys are predominantly
// for client side use, no where does it say you must hide this api key...
const GIPHY_API_KEY = 'RLyhf8svqS44wSiiCZS7pvThp330NCL5';

/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs.
 * Also make the necessary changes to clean up the code
 */
import {
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import cx from 'classnames';
import { GifIcon } from '@heroicons/react/24/outline';
import type { IGif } from '@giphy/js-types';
import {
  Grid,
  SearchBar,
  SearchContext,
  SearchContextManager,
} from '@giphy/react-components';
import type { GifsResult } from '@giphy/js-fetch-api';
import type { ClientThreadData } from '@cord-sdk/types';
import { betaV2 } from '@cord-sdk/react';
import { ComposerContext } from '@cord-sdk/react/betaV2.ts';
import type {
  ReplaceConfig,
  ToolbarLayoutProps,
} from '@cord-sdk/react/betaV2.ts';

type ThreadProps = {
  threadData: ClientThreadData;
};

function ThreadWithGiphy({ threadData }: ThreadProps) {
  return <betaV2.Thread threadData={threadData} replace={REPLACEMENT} />;
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const ToolbarLayoutWithGiphyButton = forwardRef(
  function ToolbarLayoutWithGiphyButton(
    props: ToolbarLayoutProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const toolbarItemsWithGiphy = useMemo(() => {
      return [
        ...(props.items ?? []),
        {
          name: 'giphy',
          element: <GiphyMenuButton />,
        },
      ];
    }, [props.items]);

    return (
      <betaV2.ToolbarLayout
        {...props}
        items={toolbarItemsWithGiphy}
        ref={ref}
      />
    );
  },
);

function GiphyMenuButton() {
  const [showGiphyMenu, setShowGiphyMenu] = useState(false);

  return (
    <betaV2.MenuButton
      menuVisible={showGiphyMenu}
      setMenuVisible={setShowGiphyMenu}
      menuItems={[
        {
          name: 'giphy-menu',
          element: (
            <GiphyMenuWithSearchContext setShowGiphyMenu={setShowGiphyMenu} />
          ),
        },
      ]}
      button={
        <betaV2.Button
          onClick={() => setShowGiphyMenu((prev) => !prev)}
          buttonAction="open-giphy"
          className={cx('cord-tertiary', 'add-giphy-button')}
        >
          <GifIcon height={16} width={16} />
        </betaV2.Button>
      }
      buttonTooltipLabel="Send a Giphy"
    />
  );
}

type GiphyMenuProps = {
  setShowGiphyMenu: (showGiphyMenu: boolean) => void;
};

// https://github.com/Giphy/giphy-js/blob/master/packages/react-components/README.md#search-experience
function GiphyMenuWithSearchContext(props: GiphyMenuProps) {
  return (
    <SearchContextManager apiKey={GIPHY_API_KEY}>
      <GiphyMenu {...props} />
    </SearchContextManager>
  );
}

function GiphyMenu({ setShowGiphyMenu }: GiphyMenuProps) {
  const { fetchGifs, searchKey } = useContext(SearchContext);
  // Using the built in composer context to retrieve the attachFilesToComposer function
  const composerContext = useContext(ComposerContext);

  const initialGifsRef = useRef<Promise<GifsResult> | null>(null);
  const fetchGifsFn = useCallback(
    (offset: number) => {
      if (!searchKey) {
        if (initialGifsRef.current !== null) {
          return initialGifsRef.current;
        } else {
          const result = fetchGifs(offset);
          initialGifsRef.current = result;
          return result;
        }
      }
      return fetchGifs(offset);
    },
    [fetchGifs, searchKey],
  );

  const onGiphyClick = useCallback(
    (gif: IGif, e: React.SyntheticEvent<HTMLElement, Event>) => {
      e.preventDefault();
      const gifName = gif.title;
      const downsizedMed = gif.images.downsized_medium;
      void fetch(downsizedMed.url)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], gifName, {
            type: 'image/gif',
          });

          void composerContext?.attachFilesToComposer([file]);
          setShowGiphyMenu(false);
        })
        .catch((error) => {
          console.error('something went wrong', error);
          setShowGiphyMenu(false);
        });
    },
    [composerContext, setShowGiphyMenu],
  );

  return (
    <>
      <SearchBar />
      <Grid
        key={searchKey}
        columns={2}
        width={300}
        fetchGifs={fetchGifsFn}
        onGifClick={onGiphyClick}
        className="giphy-grid"
      />
      <img
        src="/static/images/powered-by-giphy.png"
        className="giphy-logo"
        alt="Giphy attribution"
      />
    </>
  );
}

const REPLACEMENT: ReplaceConfig = {
  ToolbarLayout: ToolbarLayoutWithGiphyButton,
};

export const code = `import {
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import cx from 'classnames';
import { GifIcon } from '@heroicons/react/24/outline';
import type { IGif } from '@giphy/js-types';
import {
  Grid,
  SearchBar,
  SearchContext,
  SearchContextManager,
} from '@giphy/react-components';
import type { GifsResult } from '@giphy/js-fetch-api';
import type { ClientThreadData } from '@cord-sdk/types';
import { betaV2 } from '@cord-sdk/react';
import { ComposerContext } from '@cord-sdk/react/betaV2.ts';
import type {
  ReplaceConfig,
  ToolbarLayoutProps,
} from '@cord-sdk/react/betaV2.ts';

type ThreadProps = {
  threadData: ClientThreadData;
};

function ThreadWithGiphy({ threadData }: ThreadProps) {
  return <betaV2.Thread threadData={threadData} replace={REPLACEMENT} />;
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const ToolbarLayoutWithGiphyButton = forwardRef(
  function ToolbarLayoutWithGiphyButton(
    props: ToolbarLayoutProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const toolbarItemsWithGiphy = useMemo(() => {
      return [
        ...(props.items ?? []),
        {
          name: 'giphy',
          element: <GiphyMenuButton />,
        },
      ];
    }, [props.items]);

    return (
      <betaV2.ToolbarLayout
        {...props}
        items={toolbarItemsWithGiphy}
        ref={ref}
      />
    );
  },
);

function GiphyMenuButton() {
  const [showGiphyMenu, setShowGiphyMenu] = useState(false);

  return (
    <betaV2.MenuButton
      menuVisible={showGiphyMenu}
      setMenuVisible={setShowGiphyMenu}
      menuItems={[
        {
          name: 'giphy-menu',
          element: (
            <GiphyMenuWithSearchContext setShowGiphyMenu={setShowGiphyMenu} />
          ),
        },
      ]}
      button={
        <betaV2.Button
          onClick={() => setShowGiphyMenu((prev) => !prev)}
          buttonAction="open-giphy"
          className={cx('cord-tertiary', 'add-giphy-button')}
        >
          <GifIcon height={16} width={16} />
        </betaV2.Button>
      }
      buttonTooltipLabel="Send a Giphy"
    />
  );
}

type GiphyMenuProps = {
  setShowGiphyMenu: (showGiphyMenu: boolean) => void;
};

// https://github.com/Giphy/giphy-js/blob/master/packages/react-components/README.md#search-experience
function GiphyMenuWithSearchContext(props: GiphyMenuProps) {
  return (
    <SearchContextManager apiKey={GIPHY_API_KEY}>
      <GiphyMenu {...props} />
    </SearchContextManager>
  );
}

function GiphyMenu({ setShowGiphyMenu }: GiphyMenuProps) {
  const { fetchGifs, searchKey } = useContext(SearchContext);
  // Using the built in composer context to retrieve the attachFilesToComposer function
  const composerContext = useContext(ComposerContext);

  const initialGifsRef = useRef<Promise<GifsResult> | null>(null);
  const fetchGifsFn = useCallback(
    (offset: number) => {
      if (!searchKey) {
        if (initialGifsRef.current !== null) {
          return initialGifsRef.current;
        } else {
          const result = fetchGifs(offset);
          initialGifsRef.current = result;
          return result;
        }
      }
      return fetchGifs(offset);
    },
    [fetchGifs, searchKey],
  );

  const onGiphyClick = useCallback(
    (gif: IGif, e: React.SyntheticEvent<HTMLElement, Event>) => {
      e.preventDefault();
      const gifName = gif.title;
      const downsizedMed = gif.images.downsized_medium;
      void fetch(downsizedMed.url)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], gifName, {
            type: 'image/gif',
          });

          void composerContext?.attachFilesToComposer([file]);
          setShowGiphyMenu(false);
        })
        .catch((error) => {
          console.error('something went wrong', error);
          setShowGiphyMenu(false);
        });
    },
    [composerContext, setShowGiphyMenu],
  );

  return (
    <>
      <SearchBar />
      <Grid
        key={searchKey}
        columns={2}
        width={300}
        fetchGifs={fetchGifsFn}
        onGifClick={onGiphyClick}
        className="giphy-grid"
      />
      <img
        src="/static/images/powered-by-giphy.png"
        className="giphy-logo"
        alt="Giphy attribution"
      />
    </>
  );
}

const REPLACEMENT: ReplaceConfig = {
  ToolbarLayout: ToolbarLayoutWithGiphyButton,
};`;

// styles the component
const cssStyling = `
.cord-thread.cord-v2 {
  max-height: 400px; 
  width: 300px; 
}

.add-giphy-button {
  padding: 4px;
}

.giphy-grid {
  height: 300px;
  overflow-y: auto;
  margin-top: 8px
}

.cord-attachments .cord-image-attachment {
  height: 50px;
  width: 50px;
}

.giphy-logo {
  height: 16px;
  margin-left:auto;
  padding-top: 4px;
}`;

const styles = css(cssStyling);

export const THREAD_WITH_GIPHY_SNIPPETS = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function ThreadWithGiphyWrapper(props: ThreadProps) {
  return (
    <>
      <Global styles={styles} />
      <ThreadWithGiphy {...props} />
    </>
  );
}
