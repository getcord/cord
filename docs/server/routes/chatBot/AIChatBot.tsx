/** @jsxImportSource @emotion/react */
import { useCallback, useEffect, useState } from 'react';
import { PHOSPHOR_ICONS } from '@cord-sdk/react/components/helpers/Icon.tsx';
import CordMascot from 'docs/server/routes/chatBot/CordAIMascot.svg';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';
import WithTooltip from 'docs/server/ui/tooltip/WithTooltip.tsx';

const AI_CHAT_BOT_STATE = 'cord-ai-chat-state';

function AIChatBot() {
  const [showChat, setShowChat] = useState<boolean>(false);

  useEffect(() => {
    const existingValue = window.localStorage.getItem(AI_CHAT_BOT_STATE);
    if (existingValue && existingValue === 'collapsed') {
      setShowChat(false);
      return;
    }
    setShowChat(true);
  }, []);

  const [showUnreadMessageBadge, setShowUnreadMessageBadge] =
    useState<boolean>();

  const updateChatState = useCallback((expanded: boolean) => {
    setShowChat(expanded);
    window.localStorage.setItem(
      AI_CHAT_BOT_STATE,
      expanded ? 'expanded' : 'collapsed',
    );
  }, []);

  useEffect(() => {
    // We recevied this event from the iframe to tell us if
    // we should show a badge
    function handleMessage(event: MessageEvent) {
      if (event.data.type !== 'show_badge') {
        return;
      }

      if (!('showBadge' in event.data.data)) {
        return;
      }
      setShowUnreadMessageBadge(event.data.data.showBadge);
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div
      data-search-ignore={true}
      data-cord-search-ignore={true}
      css={{
        background: 'var(--color-base)',
        position: 'fixed',
        bottom: 0,
        right: 16,
        zIndex: 800,
        width: 350,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        boxShadow: 'var(--box-shadow-large)',
        // making cordy popup when we hover over the button
        '& button:hover ~ #cord-mascot': {
          transform: 'translateY(-35px)',
        },
        [breakpoints.tablet]: {
          display: 'none',
        },
      }}
    >
      <div css={{ position: 'relative' }}>
        <div
          onClick={() => {
            if (!showChat) {
              setShowUnreadMessageBadge(false);
            }
            updateChatState(!showChat);
          }}
          css={{
            alignItems: 'center',
            background: showChat ? 'var(--color-base)' : 'var(--color-purple)',
            border: 'none',
            borderColor: 'var(--color-purple)',
            borderStyle: 'solid',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            borderWidth: '1px 1px 0px 1px',
            color: showChat ? 'var(--color-notionBlack)' : 'var(--color-base)',
            cursor: 'pointer',
            display: 'flex',
            fontSize: 12,
            padding: '12px 12px 8px 12px',
            position: 'relative',
            width: '100%',
            zIndex: 1,
            '& p': {
              margin: 0,
            },
            '& svg': {
              background: showChat ? 'var(--color-baseStrong)' : undefined,
              borderRadius: 4,
            },
            '& > a': {
              color: 'inherit',
            },
          }}
        >
          <p>Ask Cordy</p>
          {showUnreadMessageBadge && !showChat && (
            <div
              css={{
                marginLeft: 8,
                height: 8,
                width: 8,
                borderRadius: '50%',
                background: 'var(--color-purpleLight)',
                animation: 'pulse 1500ms infinite',

                '@keyframes pulse': {
                  '0%': {
                    boxShadow: 'var(--color-purpleLight) 0 0 0 0',
                  },
                  '75%': {
                    boxShadow: '#ff69b400 0 0 0 4px',
                  },
                },
              }}
            ></div>
          )}

          <WithTooltip label="Learn about Cord's AI Chat Interface">
            <a
              href="https://cord.com/blog/build-a-chatbot-with-cord"
              target="_blank"
              rel="noreferrer"
              css={{
                flexShrink: 0,
                marginLeft: 'auto',
                '&:hover': { color: 'inherit' },
              }}
              onClick={(e) => e.stopPropagation()} // stop the click from registering in the button above
            >
              <PHOSPHOR_ICONS.Info
                size="24"
                css={{
                  padding: 4,
                }}
              />
            </a>
          </WithTooltip>
          <PHOSPHOR_ICONS.CaretUp
            id="caret"
            weight="fill"
            size="24"
            css={{
              flexShrink: 0,
              marginLeft: 4,
              padding: 4,
              transition: 'transform 0s linear',
              transform: showChat ? 'rotate(180deg)' : undefined,
            }}
          />
        </div>
        {!showChat && (
          <CordMascot
            id="cord-mascot"
            css={{
              position: 'absolute',
              right: 20,
              top: 0,
              transition: 'transform 250ms',
              zIndex: 0,
            }}
          />
        )}
        <div
          css={{
            height: showChat ? 'auto' : 0,
            borderColor: 'var(--color-purple)',
            borderStyle: 'solid',
            borderWidth: '0px 1px',
            lineHeight: 0,
            position: 'relative',
            width: 350,
            maxHeight: showChat ? 'clamp(350px, 45vh,  45vh)' : 0,
            transition: showChat ? 'max-height 0.1s ease-in' : undefined,
          }}
        >
          <iframe
            src="https://ask.cord.com/cordy-embed"
            css={{
              width: '100%',
              minHeight: 350,
              height: '45vh',
              border: 'none',
            }}
          ></iframe>
        </div>
      </div>
    </div>
  );
}
export default AIChatBot;
