/** @jsxImportSource @emotion/react */

import { useContext, useEffect, useState } from 'react';
import Page from 'docs/server/ui/page/Page.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import { Warning } from 'docs/server/routes/components/Warning/Warning.tsx';
import { FAQModule } from 'docs/server/ui/faq/FAQModule.tsx';
import { FAQQuestion } from 'docs/server/ui/faq/FAQQuestion.tsx';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { LIVE_COMPONENT_ON_DOCS_MESSAGE_THREAD_ID_PREFIX } from 'common/const/Ids.ts';
import { betaV2, thread } from '@cord-sdk/react';
import type { ThreadSummary } from '@cord-sdk/types';
import { AutoClickAndHideButton } from 'docs/server/routes/customization/custom-react-components/menu-customization/AutoClickButton.tsx';
import { CustomMenuButton } from 'docs/server/routes/customization/custom-react-components/menu-customization/CustomMenuButton.tsx';
import {
  DefaultMenuExamples,
  MenuButtonExamples,
} from 'docs/server/routes/customization/custom-react-components/menu-customization/MenuButtonExamples.tsx';
import { MenuExamples } from 'docs/server/routes/customization/custom-react-components/menu-customization/MenuExamples.tsx';
import { CustomMenu } from 'docs/server/routes/customization/custom-react-components/menu-customization/CustomMenu.tsx';
import { MenuItemsExamples } from 'docs/server/routes/customization/custom-react-components/menu-customization/MenuItemsExamples.tsx';

function MenuCustomization() {
  const { organizationID } = useContext(AuthContext);
  const [threadID, setThreadID] = useState<string | undefined>(undefined);

  useEffect(() => {
    setThreadID(
      `${LIVE_COMPONENT_ON_DOCS_MESSAGE_THREAD_ID_PREFIX}${organizationID}`,
    );
  }, [organizationID, setThreadID]);

  const { thread: threadData } = thread.useThread(threadID, {
    skip: !threadID,
  });

  return (
    <Page
      pretitle="Options Menu Customization"
      pretitleLinkTo="/customization/custom-react-components/options-menu"
      title="Customize Options Menu"
      pageSubtitle="Learn how to customize the options menus in your app."
      showTableOfContents
    >
      <Warning type="beta">
        <p>
          This API is under development and subject to change prior to final
          release.
        </p>
      </Warning>
      <p>
        Multiple customers have requested the ability to customize the options
        menus in messages and threads. With Cord 1.0, this was not possible.
        However, with Cord 2.0, you can do much more. Here, we present a few
        examples to help you make the best use of our components and
        Replacements API.
      </p>
      <H2>Changing the menu button</H2>
      <p>
        By default, the menu button will appear on the right of the message when
        the mouse is hovering the message container. This behavior can be
        changed in CSS. Click on "Show code" to see how it is implemented.
      </p>
      {threadData?.firstMessage && (
        <DefaultMenuExamples message={threadData.firstMessage} />
      )}
      <section>
        The default button <MenuButton /> can be replaced with a custom button
        of your choice, for example <MenuButton replaced />. For this, you need
        to use Cord's Replacement API to substitute the default button by the
        one you provide.
      </section>
      {threadData?.firstMessage && (
        <MenuButtonExamples message={threadData.firstMessage} />
      )}
      <H2>Modifying the appearance of the options menu</H2>
      <section>
        The default menu{' '}
        <span style={{ display: 'inline-block' }}>
          <Menu threadData={threadData} />
        </span>{' '}
        (hover your mouse over the button) can also be styled with CSS. To do
        this, inspect the menu items in your browser and look for the classes
        with the <code>cord-</code> prefix.
      </section>
      <section>
        If you need to add a header, a footer, or completely restyle the menu,
        you can use the replacements API to achieve this. For example, you can
        create a button{' '}
        <span style={{ display: 'inline-block' }}>
          <Menu replaced threadData={threadData} />
        </span>{' '}
        (hover your mouse to see the menu) that meets your specific styling and
        function needs.
      </section>
      {threadData?.firstMessage && (
        <MenuExamples message={threadData.firstMessage} />
      )}
      <H2>Adding or removing items from the options menu</H2>
      <p>
        Depending on where the menu is being shown (e.g., in a thread, a
        message, etc.), it will display different options (items). You can
        remove some of these or add new ones to adapt to your product's needs.
        For example, you might add an option to copy the thread content,
        highlight a message, or generate a summary of the message using AI.
      </p>
      <p>
        To do this, you need to replace the <code>MenuButton</code> component.
        In the following example, we modify the menu to only show the "Edit"
        function and add a "Highlight message" option.
      </p>
      {threadData?.firstMessage && (
        <MenuItemsExamples message={threadData.firstMessage} />
      )}
      <FAQModule>
        <FAQQuestion
          title={'The menu is not showing even though I added one item'}
        >
          <p>
            Please check the "Adding or removing items from the options menu"
            example to ensure that you are indeed replacing{' '}
            <code>MenuButton</code>. Modifying the items shown in other
            components might lead to unexpected results.
          </p>
        </FAQQuestion>
      </FAQModule>
    </Page>
  );
}
export default MenuCustomization;

function MenuButton({ replaced }: { replaced?: boolean }) {
  return replaced ? (
    <CustomMenuButton buttonAction="show-message-options" />
  ) : (
    <betaV2.Button
      icon="DotsThree"
      buttonAction="show-message-options"
      css={{ display: 'inline' }}
      canBeReplaced
    />
  );
}

function Menu({
  replaced,
  threadData,
}: {
  replaced?: boolean;
  threadData: ThreadSummary | undefined | null;
}) {
  if (!threadData?.firstMessage) {
    return <span>loading...</span>;
  }

  const message = threadData?.firstMessage;

  return (
    <betaV2.OptionsMenu
      message={message}
      threadID={message.threadID}
      button={
        <AutoClickAndHideButton
          buttonAction="show-message-options"
          icon="DotsThree"
        />
      }
      showThreadOptions={false}
      showMessageOptions
      setEditing={() => {}}
      replace={replaced ? { Menu: CustomMenu } : {}}
    />
  );
}
