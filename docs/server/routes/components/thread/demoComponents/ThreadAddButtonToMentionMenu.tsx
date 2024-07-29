import { Global, css } from '@emotion/react';

/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs.
 * Also make the necessary changes to clean up the code
 */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import cx from 'classnames';
import { ChevronLeftIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import type { ClientThreadData } from '@cord-sdk/types';
import { betaV2 } from '@cord-sdk/react';
import type { TextEditorProps } from '@cord-sdk/react/betaV2.ts';
import { EditorCommands, useToast } from '@cord-sdk/react/betaV2.ts';

type ThreadProps = {
  threadData: ClientThreadData;
};

function ThreadAddButtonToMentionMenu({ threadData }: ThreadProps) {
  return <betaV2.Thread threadData={threadData} replace={REPLACEMENTS} />;
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const MentionListMenuWithButton = forwardRef(function MentionListMenuWithButton(
  props: betaV2.VirtualizedMenuProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const itemsWithNewButton = useMemo(() => {
    const mentionsList = {
      name: 'mention-list',
      // We want to keep the virtualized mentions list separate to ensure we
      // always see the new button at the bottom of the list.
      element: <betaV2.VirtualizedMenu {...props} />,
    };
    const inviteButton = {
      name: 'invite-button',
      element: <InviteMemberButton />,
    };
    const separator = {
      name: 'mention-separator',
      element: <betaV2.Separator />,
    };
    return [mentionsList, separator, inviteButton];
  }, [props]);

  return (
    <betaV2.Menu
      ref={ref}
      items={itemsWithNewButton}
      closeMenu={props.closeMenu}
    />
  );
});

function InviteMemberButton() {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState<string>();
  const handleSubmitInviteMember = useCallback(() => {
    if (!email) {
      return;
    }
    // handle invitation process
    console.log('User invitation process for: ', email);

    toast?.showToastPopup?.(
      'invite-member',
      'Successfully sent invitation',
      'success',
    );
    setShowForm(false);
  }, [email, toast]);

  if (!showForm) {
    return (
      <betaV2.MenuItem
        className="invite-new-member-button"
        leftItem={<UserPlusIcon height={16} width={16} />}
        label="Invite new member"
        menuItemAction="invite-new-member"
        onClick={() => {
          setShowForm(true);
        }}
      />
    );
  } else {
    return (
      <form
        className="invite-member-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitInviteMember();
        }}
      >
        <div className="invite-member-go-back-and-input">
          <betaV2.Button
            className="go-back-button"
            buttonAction="go-back"
            onClick={() => setShowForm(false)}
          >
            <ChevronLeftIcon height={20} width={20} />
          </betaV2.Button>
          <input
            className="email-input"
            aria-label="email"
            id="email"
            type="email"
            placeholder="email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          ></input>
        </div>
        <button
          type="submit"
          className={cx(
            'cord-primary',
            'cord-button',
            'invite-member-submit-button',
          )}
          disabled={!email}
        >
          Invite Member
        </button>
      </form>
    );
  }
}

function TextEditorWithOpenMentionsMenu(props: TextEditorProps) {
  // For demo purposes only
  useEffect(() => {
    EditorCommands.addText(props.editor, props.editor.selection, '@');
  }, [props.editor]);
  return <betaV2.TextEditor {...props} />;
}

// Using the within prop allows you to isolate the replacement to specific areas.
const REPLACEMENTS: betaV2.ReplaceConfig = {
  // @ts-expect-error
  within: { MentionList: { VirtualizedMenu: MentionListMenuWithButton } },
  TextEditor: TextEditorWithOpenMentionsMenu,
};

const code = `import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import cx from 'classnames';
import { ChevronLeftIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import type { ClientThreadData } from '@cord-sdk/types';
import { betaV2 } from '@cord-sdk/react';
import type { TextEditorProps } from '@cord-sdk/react/betaV2.ts';
import { EditorCommands, useToast } from '@cord-sdk/react/betaV2.ts';

type ThreadProps = {
  threadData: ClientThreadData;
};

function ThreadAddButtonToMentionMenu({ threadData }: ThreadProps) {
  return <betaV2.Thread threadData={threadData} replace={REPLACEMENTS} />;
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const MentionListMenuWithButton = forwardRef(function MentionListMenuWithButton(
  props: betaV2.VirtualizedMenuProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const itemsWithNewButton = useMemo(() => {
    const mentionsList = {
      name: 'mention-list',
      // We want to keep the virtualized mentions list separate to ensure we
      // always see the new button at the bottom of the list.
      element: <betaV2.VirtualizedMenu {...props} />,
    };
    const inviteButton = {
      name: 'invite-button',
      element: <InviteMemberButton />,
    };
    const separator = {
      name: 'mention-separator',
      element: <betaV2.Separator />,
    };
    return [mentionsList, separator, inviteButton];
  }, [props]);

  return (
    <betaV2.Menu
      ref={ref}
      items={itemsWithNewButton}
      closeMenu={props.closeMenu}
    />
  );
});

function InviteMemberButton() {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState<string>();
  const handleSubmitInviteMember = useCallback(() => {
    if (!email) {
      return;
    }
    // handle invitation process
    console.log('User invitation process for: ', email);

    toast?.showToastPopup?.(
      'invite-member',
      'Successfully sent invitation',
      'success',
    );
    setShowForm(false);
  }, [email, toast]);

  if (!showForm) {
    return (
      <betaV2.MenuItem
        className="invite-new-member-button"
        leftItem={<UserPlusIcon height={16} width={16} />}
        label="Invite new member"
        menuItemAction="invite-new-member"
        onClick={() => {
          setShowForm(true);
        }}
      />
    );
  } else {
    return (
      <form
        className="invite-member-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitInviteMember();
        }}
      >
        <div className="invite-member-go-back-and-input">
          <betaV2.Button
            className="go-back-button"
            buttonAction="go-back"
            onClick={() => setShowForm(false)}
          >
            <ChevronLeftIcon height={20} width={20} />
          </betaV2.Button>
          <input
            className="email-input"
            aria-label="email"
            id="email"
            type="email"
            placeholder="email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          ></input>
        </div>
        <button
          type="submit"
          className={cx(
            'cord-primary',
            'cord-button',
            'invite-member-submit-button',
          )}
          disabled={!email}
        >
          Invite Member
        </button>
      </form>
    );
  }
}

function TextEditorWithOpenMentionsMenu(props: TextEditorProps) {
  // For demo purposes only
  useEffect(() => {
    EditorCommands.addText(props.editor, props.editor.selection, '@');
  }, [props.editor]);
  return <betaV2.TextEditor {...props} />;
}

// Using the within prop allows you to isolate the replacement to specific areas.
const REPLACEMENTS: betaV2.ReplaceConfig = {
  within: { MentionList: { VirtualizedMenu: MentionListMenuWithButton } },
  TextEditor: TextEditorWithOpenMentionsMenu,
};`;

// styles the component
const cssStyling = `
.cord-thread.cord-v2 {
  max-height: 400px; 
  width: 300px; 
}

/* Want to remove the menu styling on the virtualized mention list */
.cord-mention-menu {
  border: none;
  margin: 0;
  padding: 0;
  box-shadow: none;
}

.invite-new-member-button {
  border: 2px solid #9a6aff;
  border-radius: 4px;
}

.invite-member-form {
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invite-member-go-back-and-input {
  display: flex;
  gap: 8px;
  align-items: center;
}

.go-back-button {
  flex-shrink: 0
}

.email-input {
  flex-grow: 1;
}

.invite-member-submit-button {
  flex-shrink: 0; 
  padding: 4px;
}
`;

const styles = css(cssStyling);

export const THREAD_ADD_BUTTON_TO_MENTION_MENU_SNIPPETS = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function ThreadAddButtonToMentionMenuWrapper(props: ThreadProps) {
  return (
    <>
      <Global styles={styles} />
      <ThreadAddButtonToMentionMenu {...props} />
    </>
  );
}
