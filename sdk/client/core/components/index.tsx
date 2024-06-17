import { v4 as uuid } from 'uuid';

import type {
  PropertyTypes,
  ComponentAttributeTypes,
} from '@cord-sdk/components';
import {
  attributeNameToPropName,
  attributeToPropertyConverters,
} from '@cord-sdk/components';
import type { IPrivateCordSDK } from 'sdk/client/core/index.tsx';
import type { HTMLCordElement } from '@cord-sdk/types';
import { CORD_COMPONENT_WRAPS_DOM_DATA_ATTRIBUTE } from '@cord-sdk/types';
import { DO_NOT_USE_injectCordCss } from 'sdk/client/core/util.ts';
import type { NewComponentSwitchConfig } from 'external/src/components/ui3/withNewComponent.tsx';
import { CORD_COMPONENT_BASE_CLASS, CORD_V1 } from 'common/ui/style.ts';

type CordComponentPropsChangedCallback = (props: object) => unknown;
export interface ICordComponent extends HTMLCordElement {
  render(): JSX.Element;
  readonly componentID: string;
  renderTarget: HTMLElement;
  virtual: boolean;
  wrapsDom: boolean;
  useShadowRoot: boolean;
  props: object;
  onPropsChanged: CordComponentPropsChangedCallback | undefined;
}

export interface IPrivateCordComponent extends ICordComponent {
  newComponentSwitchConfig?: NewComponentSwitchConfig;
}

const CORD_STYLE = 'cord_style';

abstract class CordComponentBase<
    WebComponentAttributes extends string,
    ReactComponentProps extends Record<string, unknown>,
  >
  extends HTMLElement
  implements IPrivateCordComponent
{
  // props are Partial<..> because we're not guaranteed that all the needed
  // attributes are passed to the webcomponent
  props: Partial<ReactComponentProps> = {};
  onPropsChanged: CordComponentPropsChangedCallback | undefined = undefined;
  renderTarget: HTMLElement = document.createElement('div');
  componentID = uuid();

  // Our react component wrappers need to make sure that our web-components do
  // not fire cord events before we attach listeners for them.
  bufferEvents = false;
  bufferedEvents: Event[] = [];

  // This property should be set to true on components that do not produce visible DOM nodes.
  virtual = false;
  // If true, we don't attach the shadow root to the web component, but to a wrapper div so
  // that all the HTML within the web component will be rendered.
  // https://stackoverflow.com/questions/61852233/what-happens-to-child-nodes-if-there-is-no-slot-but-a-shadow-root
  wrapsDom = false;
  // [21 March 23] Our initial implementation of Web Components used a shadowRoot.
  // We are moving away from it. See Notion's "RFC: Goodbye CSS Variables; Hello Vanilla CSS"
  // [21 June 23] We moved away 🎉. For compatibility, users can opt back in with `canOptInShadow`.
  useShadowRoot = false;
  canOptInShadow = true;
  readonly initialised = true;
  _newComponentSwitchConfig?: NewComponentSwitchConfig = {};
  abstract attributeTypes: ComponentAttributeTypes<WebComponentAttributes>;
  // With WebComponents, we could target e.g. `cord-avatar`. Without WebComponents
  // we need another way. The component class name: `cord-component-<component>`. So
  // `<cord-avatar class="cord-component" />` becomes
  // `<div class="cord-component cord-component-avatar" />`
  componentClassName = `${this.nodeName
    .toLowerCase()
    .replace('cord-', 'cord-component-')}`;

  abstract render(): JSX.Element;

  constructor() {
    super();

    this.dispatchEvent(
      new CustomEvent(`${this.nodeName.toLowerCase()}:initialised`, {
        bubbles: false,
      }),
    );
    // Unfortunately, this can be set before the class was initialized,
    // therefore it bypassed the setter and will bypass the setter/getter for ever.
    // So we delete it, and reset it (the setter will be called).
    const tempNewComponentSwitchConfig = this.newComponentSwitchConfig;
    // We appease typescript by marking `this`'s properties as optional
    delete (this as Partial<typeof this>).newComponentSwitchConfig;
    this.newComponentSwitchConfig = tempNewComponentSwitchConfig;
  }

  get newComponentSwitchConfig() {
    return this._newComponentSwitchConfig ?? {};
  }

  // TODO(ludo) add some validation before making this public
  set newComponentSwitchConfig(
    newComponentSwitchConfig: NewComponentSwitchConfig,
  ) {
    if (
      newComponentSwitchConfig === undefined ||
      newComponentSwitchConfig === null
    ) {
      this._newComponentSwitchConfig = {};
    } else {
      this._newComponentSwitchConfig = newComponentSwitchConfig;
    }
    // We want the component to rerender when the config changes.
    this.onPropsChanged?.({
      ...this.props,
    });
  }

  connectedCallback() {
    // We can reliably read the WC attributes only once connected.
    this.useShadowRoot =
      this.canOptInShadow &&
      (this.getAttribute('use-shadow-root') === 'false' ? false : true);
    if (!this.useShadowRoot) {
      this.classList.add(
        CORD_COMPONENT_BASE_CLASS,
        CORD_V1,
        this.componentClassName,
      );
      // This is needed for Portal, JSS injection and so on
      this.renderTarget = this;
      (window.CordSDK as IPrivateCordSDK | undefined)?.registerComponent(this);
      return;
    }

    // TODO(am) when we get rid of useShadowRoot, we won't need to inject
    // styles inside each shadowRoot.
    DO_NOT_USE_injectCordCss(this.renderTarget);
    if (!this.wrapsDom && !this.virtual) {
      const shadowRoot = this.shadowRoot || this.attachShadow({ mode: 'open' });
      this.renderTarget.classList.add(
        CORD_COMPONENT_BASE_CLASS,
        this.componentClassName,
        CORD_V1,
      );
      shadowRoot.appendChild(this.renderTarget);
      const cordStyle = window.top?.document.getElementById(CORD_STYLE);
      const shadowCordStyle = shadowRoot.getElementById(CORD_STYLE);
      if (cordStyle && !shadowCordStyle) {
        shadowRoot.appendChild(cordStyle.cloneNode(true));
      }
    } else if (this.wrapsDom) {
      const wrapperDiv = document.createElement('div');
      wrapperDiv.classList.add(CORD_COMPONENT_BASE_CLASS, CORD_V1);
      wrapperDiv.setAttribute(CORD_COMPONENT_WRAPS_DOM_DATA_ATTRIBUTE, 'true');
      const shadowRoot = wrapperDiv.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(this.renderTarget);
      this.appendChild(wrapperDiv);
    }

    (window.CordSDK as IPrivateCordSDK | undefined)?.registerComponent(this);
  }

  disconnectedCallback() {
    (window.CordSDK as IPrivateCordSDK | undefined)?.unregisterComponent(this);
  }

  attributeChangedCallback(
    attributeName: WebComponentAttributes,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (attributeName === 'class') {
      // We want `CORD_COMPONENT_BASE_CLASS` to remain, always, or the reset css breaks.
      if (oldValue !== newValue) {
        this.classList.add(
          CORD_COMPONENT_BASE_CLASS,
          CORD_V1,
          this.componentClassName,
        );
      }
      return;
    }
    if (attributeName === 'buffer-events') {
      this.setBufferEvents(newValue === 'true');
      return;
    }
    const propConverter =
      attributeToPropertyConverters[this.attributeTypes[attributeName]];
    if (propConverter) {
      const propName = attributeNameToPropName(attributeName);

      this.props = {
        ...this.props,
        [propName]: propConverter(newValue),
        newComponentSwitchConfig: this.newComponentSwitchConfig,
      };

      if (this.isConnected) {
        // TODO: is this if needed?
        this.onPropsChanged?.(this.props);
      }
    } else {
      console.warn(
        'Observed attribute',
        attributeName,
        "doesn't have a converter defined.",
      );
    }
  }

  dispatchCordEvent(event: CustomEvent) {
    if (this.bufferEvents) {
      this.bufferedEvents.push(event);
    } else {
      this.dispatchEvent(event);
    }
  }

  setBufferEvents(newVal: boolean) {
    this.bufferEvents = newVal;
    if (!this.bufferEvents) {
      for (const event of this.bufferedEvents) {
        this.dispatchEvent(event);
      }
      this.bufferedEvents = [];
    }
  }

  customEventDispatcher =
    (
      event: string,
      // Events fired by a specific Cord component have a `cord-<component>:` prefix.
      // However, for some events, we want the name to always be the same no matter
      // what component is dispatching it. An example of this is `cord-composer:focus`.
      // We want developers to be able to listen just to that event, rather than every
      // combination of `cord-<component>:focus`.
      options?: { sourceComponentName: string },
    ) =>
    (...args: unknown[]) => {
      this.dispatchCordEvent(
        new CustomEvent(
          `${
            options?.sourceComponentName ?? this.nodeName.toLowerCase()
          }:${event}`,
          {
            bubbles: true,
            composed: true,
            detail: args,
          },
        ),
      );
    };
}

export function CordComponent<WebComponentAttributes extends string>(
  attributes: Record<WebComponentAttributes, keyof PropertyTypes>,
) {
  abstract class AbstractCordComponent<
    ReactComponentProps extends Record<string, unknown> = any,
  > extends CordComponentBase<WebComponentAttributes, ReactComponentProps> {
    static observedAttributes = [
      ...Object.keys(attributes),
      'buffer-events',
      'class',
    ];
    attributeTypes: ComponentAttributeTypes<WebComponentAttributes> =
      attributes;
  }
  return AbstractCordComponent;
}
