import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import 'emoji-picker-element';

import { cssVar } from 'common/ui/cssVariables.ts';
import { BoxWithPopper2 } from 'external/src/components/ui2/BoxWithPopper2.tsx';
import { APP_ORIGIN } from 'common/const/Urls.ts';

const useStyles = createUseStyles({
  emojiPicker: {
    boxShadow: cssVar('shadow-small'),
    border: `1px solid ${cssVar('color-base-x-strong')}`,
    borderRadius: cssVar('border-radius-medium'),
    overflow: 'hidden',
  },
});

type EmojiEvent = {
  detail: {
    unicode: string; // The actual emoji, e.g. 😀
    skinTone: number;
    emoji: {
      emoticon: string; // The text version, e.g. ":D"
      annotation: string; // Description, e.g. "grinning face"
    };
  };
};

type EmojiButtonRef = {
  /**
   * The emoji to use for the skin tone picker
   */
  skinToneEmoji: string;
  /**
   * URL to fetch the emoji data from.
   */
  dataSource: string;
} & HTMLDivElement;

function EmojiPicker(props: {
  onClose: () => void;
  onClickEmoji: (emoji: string) => void;
}) {
  const classes = useStyles();

  const ref = useRef<EmojiButtonRef | null>(null);

  const addEmoji = useCallback(
    (event: any) => {
      const {
        detail: { unicode: emoji },
      } = event as EmojiEvent;

      props.onClickEmoji(emoji);
      props.onClose();
    },
    [props],
  );

  useEffect(
    () => ref.current?.shadowRoot?.getElementById('search')?.focus(),
    [],
  );

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const { current } = ref;

    // Serve emoji data from our own domain, so that clients CSP
    // won't block the request.
    ref.current.dataSource = `${APP_ORIGIN}/static/emoji-data.json`;

    current.addEventListener('emoji-click', addEmoji);

    return () => current.removeEventListener('emoji-click', addEmoji);
  }, [addEmoji, props]);

  return React.createElement('emoji-picker', {
    ref,
    style: {
      width: '270px',
      height: '300px',
      // https://www.npmjs.com/package/emoji-picker-element#css-variables
      '--border-size': '0px',
      '--category-emoji-size': cssVar('space-s'),
      '--category-font-size': cssVar('space-m'),
      '--emoji-padding': cssVar('space-2xs'),
      '--emoji-size': cssVar('space-l'),
      '--input-border-color': cssVar('color-base-x-strong'),
      '--input-border-radius': cssVar('border-radius-medium'),
      '--input-font-color': cssVar('color-content-primary'),
      '--input-font-size': cssVar('space-s'),
      '--input-padding': `${cssVar('space-3xs')} ${cssVar('space-2xs')}`,
      '--input-placeholder-color': cssVar('color-content-secondary'),
      '--num-columns': 6,
      '--outline-color': cssVar('color-base-x-strong'),
      '--skintone-border-radius': cssVar('space-m'),
      '--background': cssVar('color-base'),
    },
    class: `light ${classes.emojiPicker}`,
  });
}

/**
 * @deprecated Use ui3/EmojiPicker instead
 */
export function useEmojiPicker2(
  emojiButton: React.ReactNode,
  onClickEmoji: (emoji: string) => void,
  asChild?: boolean,
) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const closeEmojiPicker = useCallback(() => setShowEmojiPicker(false), []);

  return {
    EmojiPicker: (
      <BoxWithPopper2
        asChild={asChild}
        popperElement={
          <EmojiPicker onClose={closeEmojiPicker} onClickEmoji={onClickEmoji} />
        }
        popperElementVisible={showEmojiPicker}
        popperPosition="bottom-end"
        onShouldHide={closeEmojiPicker}
        onClick={(event) => {
          event.stopPropagation();
          setShowEmojiPicker(!showEmojiPicker);
        }}
        withBlockingOverlay={true}
      >
        {emojiButton}
      </BoxWithPopper2>
    ),
    emojiPickerVisible: showEmojiPicker,
  };
}

async function hasIDB() {
  if (typeof indexedDB === 'undefined') {
    return false;
  }

  try {
    const idbFailed = await new Promise((resolve) => {
      const db = indexedDB.open('test-idb');
      db.onerror = () => resolve(true);
      db.onsuccess = () => {
        indexedDB.deleteDatabase('test-idb');
        resolve(false);
      };
    });
    if (idbFailed) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}

async function polyfillIDB() {
  // @ts-ignore the fact that we don't have types;
  const fakeIndexedDB = await import('fake-indexeddb');
  // @ts-ignore the fact that we don't have types;
  const fakeIDBKeyRange = await import('fake-indexeddb/lib/FDBKeyRange');

  // Can't override the indexedDB global, but we can monkey-patch it
  const IDBFactoryFnToOverride: Array<keyof IDBFactory> = [
    'open',
    'deleteDatabase',
  ];
  for (const fn of IDBFactoryFnToOverride) {
    indexedDB[fn] = fakeIndexedDB[fn].bind(fakeIndexedDB);
  }
  const IDBKeyRangeFnToOverride: Array<keyof typeof IDBKeyRange> = [
    'bound',
    'lowerBound',
    'upperBound',
    'only',
  ];
  for (const func of IDBKeyRangeFnToOverride) {
    IDBKeyRange[func] = fakeIDBKeyRange[func].bind(fakeIDBKeyRange);
  }
}

void (async () => {
  if (!(await hasIDB())) {
    await polyfillIDB();
  }
})();
