import type { HTMLCordElement } from '@cord-sdk/types';

export type WebComponentProps<T extends HTMLCordElement> = {
  thisElement: T;
};
