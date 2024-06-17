import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import type {
  componentAttributes,
  componentNames,
  ElementName,
} from '@cord-sdk/components';

// This lets us return custom elements in React tsx code, with typed props
type CordComponentReactInterface<T extends string> = DetailedHTMLProps<
  HTMLAttributes<HTMLElement> & { [P in T]?: string } & { class?: string },
  HTMLElement
>;

type AttributeNames = {
  [N in ElementName]: keyof (typeof componentAttributes)[(typeof componentNames)[N]];
};

type CordElements = {
  [N in ElementName]: CordComponentReactInterface<AttributeNames[N]>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface IntrinsicElements extends CordElements {}
  }
}
