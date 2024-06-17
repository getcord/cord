import { createContext } from 'react';

import type {
  CustomLinks,
  UUID,
  ApplicationEnvironment,
} from 'common/types/index.ts';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type ComputedCustomNUX = {
  initialOpen: {
    title: string;
    text: string;
    imageURL: string;
  };
  welcome: {
    title: string;
    text: string;
    imageURL: string | undefined | null;
  };
};

export type ApplicationContextType = {
  applicationID: UUID;
  applicationName: string;
  applicationLinks: CustomLinks;
  applicationIconURL: string | null;
  applicationNUX: ComputedCustomNUX | null;
  applicationEnvironment: ApplicationEnvironment;
} | null;
export const ApplicationContext = createContext<
  ApplicationContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
