import type { useApplicationSpecificationsQuery } from 'external/src/graphql/operations.ts';
import { createDefaultCustomNUX } from 'external/src/components/util.ts';
import { ApplicationContext } from 'external/src/context/embed/ApplicationContext.tsx';

// NOTE: ApplicationContext is provided by BootstrapProvider

export function DisabledApplicationProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <ApplicationContext.Provider value={null}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function createApplicationPreferences(
  data: ReturnType<typeof useApplicationSpecificationsQuery>['data'],
) {
  if (!data || !data.application) {
    return null;
  }
  const customNUXData = data.application.customNUX;
  const customNUXDataIsEmpty =
    !customNUXData?.initialOpen?.title &&
    !customNUXData?.initialOpen?.text &&
    !customNUXData?.initialOpen?.imageURL &&
    !customNUXData?.welcome?.title &&
    !customNUXData?.welcome?.text &&
    !customNUXData?.welcome?.imageURL;
  const defaultCustomNUX = createDefaultCustomNUX(data.application.name);

  const customNUX = {
    initialOpen: {
      title:
        customNUXData?.initialOpen?.title ?? defaultCustomNUX.initialOpen.title,
      text:
        customNUXData?.initialOpen?.text ?? defaultCustomNUX.initialOpen.text,
      imageURL:
        customNUXData?.initialOpen?.imageURL ?? // empty string = intentionally no image
        defaultCustomNUX.initialOpen.imageURL,
    },
    // nb welcome is only used in cord1
    welcome: {
      title: customNUXData?.welcome?.title ?? defaultCustomNUX.welcome.title,
      text: customNUXData?.welcome?.text ?? defaultCustomNUX.welcome.text,
      imageURL:
        customNUXData?.welcome?.imageURL ?? defaultCustomNUX.welcome.imageURL, // empty string = intentionally no image
    },
  };

  return {
    applicationID: data.application.id,
    applicationName: data.application.name,
    applicationLinks: data.application.customLinks,
    applicationIconURL: data.application.iconURL,
    applicationNUX: customNUXDataIsEmpty ? null : customNUX,
    applicationEnvironment: data.application.environment,
  };
}
