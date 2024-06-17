/** @jsxImportSource @emotion/react */
import { Link } from 'react-router-dom';

import type { ChangeEvent } from 'react';
import React, { useCallback, useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import i18next from 'i18next';
import Page from 'docs/server/ui/page/Page.tsx';
import { H3 } from 'docs/server/ui/typography/Typography.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';

void i18next.init();

function CustomizeCordsText() {
  const [lang, setLang] = useState<string>('en');
  const onChangeLang = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLang(e.target.value);
  }, []);
  const suffixes: string[] = i18next.services.pluralResolver.getSuffixes(lang);
  return (
    <Page
      pretitle="Customization"
      pretitleLinkTo="/customization"
      title="Customize Cord's UI text"
      pageSubtitle="Translate Cord to another language or change the text of components"
      showTableOfContents
    >
      <section>
        <H3>Introduction</H3>
        <p>
          Cord's SDK comes with a translation framework that allows you to
          replace the strings in Cord components. You can use this to replace
          Cord's default messages and labels with ones of your own or translate
          the SDK into another language.
        </p>
        <p>
          We use the popular{' '}
          <Link to="https://www.i18next.com/">i18next framework</Link> to handle
          our translations, so if you're familiar with it, you'll be right at
          home with our system.
        </p>
        <H3>Basic Usage</H3>
        <ul>
          <li>
            Change the strings using the <code>translations</code>{' '}
            <Link to="/js-apis-and-hooks/initialization#translations">
              configuration option
            </Link>{' '}
            to the SDK's initialization.
          </li>
          <li>
            Each string in the SDK has an identifier, and they're organized into
            namespaces (such as <code>composer</code> or <code>message</code>)
            that give you a clue as to where they'll be used.
          </li>
          <li>
            The default language is <code>en</code> (English), so to change the
            default values, set new values for the <code>en</code> language.
          </li>
          <li>
            You can specify as many or as few of the strings as you want, with
            anything that's unspecified falling back to Cord's default value, so
            you can override only the strings you need to.
          </li>
        </ul>
        <EmphasisCard>
          💡 To see the strings we support, you can browse the default values in
          our{' '}
          <Link to="https://github.com/getcord/sdk-js/blob/master/packages/types/i18n.ts">
            open source repository
          </Link>
          .
        </EmphasisCard>

        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            /* eslint-disable @cspell/spellchecker */
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `<CordProvider
  translations={{
    en: {
      composer: {
        reply_placeholder: 'Reply...',
      },
    },
    de: {
      composer: {
        reply_placeholder: 'Antworten...',
      },
    },
  }}
>
  <!-- Your application -->
</CordProvider>`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `CordSDK.updateOptions({
  translations: {
    en: {
      composer: {
        reply_placeholder: 'Reply...',
      },
    },
    de: {
      composer: {
        reply_placeholder: 'Antworten...',
      },
    },
  },
})`,
              /* eslint-enable */
            },
          ]}
        />

        <H3>Interpolation</H3>
        <p>
          Some strings need to have values filled in, such as a user's name or
          the number of unread replies. These are placed into the string with{' '}
          <code>{'{{double braces}}'}</code>.
        </p>

        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `<CordProvider
  translations={{
    en: {
      message: {
        deleted_message: 'A message was deleted by {{user.displayName}}',
      },
    },
  }}
>
  <!-- Your application -->
</CordProvider>`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `CordSDK.updateOptions({
  translations: {
    en: {
      message: {
        deleted_message: 'A message was deleted by {{user.displayName}}',
      },
    },
  },
})`,
            },
          ]}
        />

        <p>
          For any string that uses a user, the <code>user</code> object will
          have all the fields returned by the{' '}
          <Link to="/js-apis-and-hooks/user-api/observeUserData">User API</Link>
          . In particular, you can use the user's <code>metadata</code> to store
          any additional information that you want to use in your strings, such
          as additional name components or pronouns.
        </p>
        <H3>Plurals</H3>
        <p>
          When a count of items is shown, the identifier for the string will be
          appended with an appropriate suffix, such as <code>_zero</code> or{' '}
          <code>_one</code>, to allow customizing based on the language's
          pluralization rules. See the full details in{' '}
          <Link to="https://www.i18next.com/translation-function/plurals">
            the i18next documentation
          </Link>
          .
        </p>
        <p>
          You need to supply a message for every suffix used in the language,
          otherwise missing forms will fall back to English text. You can use
          the below tool to see all the suffixes you need to supply for each
          language.
        </p>
        <div>
          <div>
            Language code:{' '}
            <input type="text" value={lang} onChange={onChangeLang} size={6} />
          </div>
          <div>
            Plural suffixes needed:{' '}
            {suffixes.length === 0 ? (
              <i>unknown language code</i>
            ) : (
              suffixes.map((v, i) => (
                <React.Fragment key={v}>
                  {i === 0 ? '' : ', '}
                  <code>{v}</code>
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              // NOTE(flooey): This snippet has invisible U+2067 and U+2069
              // characters in it to make the RTL text show up properly when
              // rendered, so be careful when editing it
              snippet: `<CordProvider
  translations={{
    en: {
      thread: {
        new_replies_status_one: 'One new reply',
        new_replies_status_other: '{{count}} new replies',
      },
    },
    he: {
      thread: {
        new_replies_status_one: 'תגובה חדשה אחת',
        new_replies_status_two: '⁧2 תגובות חדשות⁩',
        new_replies_status_other: '⁧{{count}} תגובות חדשות⁩',
      },
    },
  }}
>
  <!-- Your application -->
</CordProvider>`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `CordSDK.updateOptions({
  translations: {
    en: {
      thread: {
        new_replies_status_one: 'One new reply',
        new_replies_status_other: '{{count}} new replies',
      },
    },
    he: {
      thread: {
        new_replies_status_one: 'תגובה חדשה אחת',
        new_replies_status_two: '⁧2 תגובות חדשות⁩',
        new_replies_status_other: '⁧{{count}} תגובות חדשות⁩',
      },
    },
  },
})`,
            },
          ]}
        />

        <H3>Changing Languages</H3>
        <p>
          To change the language of the SDK, set the <code>language</code>{' '}
          <Link to="/js-apis-and-hooks/initialization#language">
            configuration option
          </Link>{' '}
          to the language code of your choice. The SDK only ships with values
          for <code>en</code> (English), so for any other language, you'll need
          to supply all the translations. Any strings that don't have a value
          for that language will fall back to the <code>en</code> string.
        </p>
        <p>
          Language dialects and scripts are supported, and will fall back to the
          base language if a string is not available in that language, so you
          can avoid specifying the same string in more than one place.
        </p>

        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            /* eslint-disable @cspell/spellchecker */
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `<CordProvider
  translations={{
    en: {
      thread: {
        placeholder_title: 'Socialize here!',
        placeholder_body: 'This is the place to send messages to your friends.',
      },
    },
    'en-GB': {
      thread: {
        placeholder_title: 'Socialise here!',
      },
    },
  }}
>
  <!-- Your application -->
</CordProvider>`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `CordSDK.updateOptions({
  translations: {
    en: {
      thread: {
        placeholder_title: 'Socialize here!',
        placeholder_body: 'This is the place to send messages to your friends.',
      },
    },
    'en-GB': {
      thread: {
        placeholder_title: 'Socialise here!',
      },
    },
  },
})`,
            },
            /* eslint-enable */
          ]}
        />

        <EmphasisCard>
          ⚠️ Our components don't currently adapt their layout for right-to-left
          languages, so while you can specify translations for those languages,
          the result may not look ideal.
        </EmphasisCard>
        <EmphasisCard>
          💡 You can set the language to the special value <code>cimode</code>{' '}
          to replace all strings with their identifiers.
        </EmphasisCard>
        <H3>Customizing Messages</H3>
        <p>
          In some cases, you may want to customize the content of a message
          inside a thread. For example, when a user resolves a thread, Cord
          inserts an action message saying who resolved the thread, and you can
          customize that text.
        </p>
        <p>
          To support this, messages have a <code>translationKey</code> property.
          When a message with a translation key is rendered, that key is looked
          up in the <code>message_templates</code> namespace, and if a
          translation is present, it will be used rather than the content of the
          message object. This translation can be either a plain string or a
          structured message object.
        </p>
        <p>
          Any mentions in the message content will be passed in values named{' '}
          <code>message1</code> through <code>messageN</code> based on their
          position in the message, to allow you to use them in the message. See
          the existing translations in the <code>message_templates</code>{' '}
          namespace for examples.
        </p>
      </section>
      <NextUp>
        <NextUpCard
          linkTo="/customization/add-custom-page-title"
          title="Customize conversation titles"
        >
          Add more context to conversations
        </NextUpCard>
        <NextUpCard linkTo="/customization/emails" title="Email Notifications">
          Configuring where emails come from, and how they look
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default CustomizeCordsText;
