import { useCallback, useEffect, useMemo, useState } from 'react';

import { Sizes } from 'common/const/Sizes.ts';

const INTERCOM_LAUNCHER = '.intercom-lightweight-app-launcher';
const INTERCOM_LAUNCHER_FRAME = '.intercom-launcher-frame';
const INTERCOM_LAUNCHER_BADGE = '.intercom-launcher-badge-frame';

const HUBSPOT = '#hubspot-messages-iframe-container';

const ZENDESK_LAUNCHER =
  'body > div > iframe#launcher[title*="Opens a widget where you can chat to one of our agents"]';
const ZENDESK_CHAT =
  'body > div > iframe#webWidget[title*="Find more information here"]';

const NOTION_HELP_BUTTON = 'body.notion-body #notion-app .notion-help-button';

const DRIFT_LAUNCHER = 'div#drift-frame-controller';
const DRIFT_CHAT = 'div#drift-frame-chat';

const TYPEFORM_MOBILE_ADD_BLOCK_BUTTON =
  'div[data-mobile-view=true] button[data-qa=add-new-block-button]';

const NETPURPOSE_ADD_BUTTON =
  '#root .ant-layout .MuiButtonBase-root.MuiFab-root.MuiFab-primary.jss8';

const PENDO_BUTTON = '._pendo-badge_';

// An element's position from the left side of the screen is taken into account
// to avoid moving launchers set on the left-hand side of a website out of view.
const MINIMUM_LEFT_POSITION_IN_PX = 300;

function useTranslateElement(
  element: Element | undefined,
  translateXAmount: number,
  translateYAmount = 0,
) {
  useEffect(() => {
    if (
      element &&
      element.getBoundingClientRect().left > MINIMUM_LEFT_POSITION_IN_PX
    ) {
      (element as HTMLElement).style.transform = `
        translate(-${translateXAmount}px, ${translateYAmount}px)
      `;
    }
  }, [element, translateXAmount, translateYAmount]);
}

export function useObserveElementWidth(
  elementRef: React.RefObject<HTMLElement>,
) {
  const element = elementRef.current;
  const [elementWidth, setElementWidth] = useState<number>();

  useEffect(() => {
    // observe the width of our element so we can auto-adjust the other launchers
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver((entry) => {
      if (entry.length > 0) {
        setElementWidth(entry[0].contentRect.width);
      }
    });

    resizeObserver.observe(element);
    return () => {
      resizeObserver.disconnect();
    };
  }, [element]);

  return elementWidth;
}

const GAP_BETWEEN_ICONS = Sizes.LARGE;

export function useRearrangeOtherLaunchers(
  ourElementWidth: number | undefined,
) {
  const translateAmount = useMemo(
    // add 16 to leave some space between
    () => (ourElementWidth ? ourElementWidth + GAP_BETWEEN_ICONS : 0),
    [ourElementWidth],
  );

  const [intercomElement, setIntercomElement] = useState<Element>();
  const [intercomFrameElement, setIntercomFrameElement] = useState<Element>();
  const [intercomBadgeFrameElement, setIntercomBadgeFrameElement] =
    useState<Element>();
  const [hubspotContainer, setHubspotContainer] = useState<Element>();
  const [zendeskLauncher, setZendeskLauncher] = useState<Element>();
  const [zendeskChat, setZendeskChat] = useState<Element>();
  const [notionHelpButton, setNotionHelpButton] = useState<Element>();
  const [driftLauncher, setDriftLauncher] = useState<Element>();
  const [driftChat, setDriftChat] = useState<Element>();
  const [netPurposeAddButton, setNetPurposeAddButton] = useState<Element>();
  const [pendoButton, setPendoButton] = useState<Element>();

  const [typeformMobileAddBlockButton, setTypeformMobileAddBlockButton] =
    useState<Element>();

  useTranslateElement(intercomElement, translateAmount);
  useTranslateElement(intercomFrameElement, translateAmount);
  useTranslateElement(intercomBadgeFrameElement, translateAmount);
  useTranslateElement(hubspotContainer, translateAmount);
  useTranslateElement(zendeskLauncher, translateAmount);
  useTranslateElement(zendeskChat, translateAmount);
  useTranslateElement(notionHelpButton, translateAmount);
  // Already has a big enough gap; Line up vertically by eye
  useTranslateElement(driftLauncher, translateAmount - GAP_BETWEEN_ICONS, 22);
  useTranslateElement(driftChat, translateAmount - GAP_BETWEEN_ICONS, 22);
  useTranslateElement(typeformMobileAddBlockButton, translateAmount);
  useTranslateElement(netPurposeAddButton, translateAmount);
  useTranslateElement(pendoButton, translateAmount);

  const findElements = useCallback(() => {
    setIntercomElement(document.querySelector(INTERCOM_LAUNCHER) ?? undefined);
    setIntercomFrameElement(
      document.querySelector(INTERCOM_LAUNCHER_FRAME) ?? undefined,
    );
    setIntercomBadgeFrameElement(
      document.querySelector(INTERCOM_LAUNCHER_BADGE) ?? undefined,
    );
    setHubspotContainer(document.querySelector(HUBSPOT) ?? undefined);
    setZendeskLauncher(document.querySelector(ZENDESK_LAUNCHER) ?? undefined);
    setZendeskChat(document.querySelector(ZENDESK_CHAT) ?? undefined);
    setNotionHelpButton(
      document.querySelector(NOTION_HELP_BUTTON) ?? undefined,
    );
    setDriftLauncher(document.querySelector(DRIFT_LAUNCHER) ?? undefined);
    setDriftChat(document.querySelector(DRIFT_CHAT) ?? undefined);
    setTypeformMobileAddBlockButton(
      document.querySelector(TYPEFORM_MOBILE_ADD_BLOCK_BUTTON) ?? undefined,
    );

    if (document.location.host.endsWith('netpurpose.com')) {
      setNetPurposeAddButton(
        document.querySelector(NETPURPOSE_ADD_BUTTON) ?? undefined,
      );
    }
    if (!document.location.host.endsWith('finmark.com')) {
      setPendoButton(document.querySelector(PENDO_BUTTON) ?? undefined);
    }
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(findElements);

    observer.observe(document.body, {
      subtree: true,
      attributes: false,
      childList: true,
    });

    findElements(); // fire once to catch any elements already in the page

    return () => observer.disconnect();
  }, [findElements]);
}
