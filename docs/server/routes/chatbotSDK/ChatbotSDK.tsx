/** @jsxImportSource @emotion/react */

import GettingStarted from 'docs/server/routes/chatbotSDK/GettingStarted.tsx';
import BaseReference from 'docs/server/routes/chatbotSDK/BaseReference.tsx';
import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import OpenAIReference from 'docs/server/routes/chatbotSDK/OpenAIReference.tsx';
import AnthropicReference from 'docs/server/routes/chatbotSDK/AnthropicReference.tsx';

const uri = '/chatbot-ai-sdk';
const title = 'Chatbot and AI SDK';
const subtitle =
  'Quickly and easily put a beautiful UI in front of your AI chatbot';

const navItems = [
  {
    name: GettingStarted.title,
    linkTo: GettingStarted.uri,
    description: GettingStarted.subtitle,
    component: <GettingStarted.Element />,
  },
  {
    name: BaseReference.title,
    linkTo: BaseReference.uri,
    description: BaseReference.subtitle,
    component: <BaseReference.Element />,
  },
  {
    name: OpenAIReference.title,
    linkTo: OpenAIReference.uri,
    description: OpenAIReference.subtitle,
    component: <OpenAIReference.Element />,
  },
  {
    name: AnthropicReference.title,
    linkTo: AnthropicReference.uri,
    description: AnthropicReference.subtitle,
    component: <AnthropicReference.Element />,
  },
];

function Chatbot() {
  return (
    <Page title={title} pageSubtitle={subtitle}>
      <IndexCardTiles cardList={navItems} />
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: Chatbot,
  navItems,
};
