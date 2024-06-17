import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { DevTools } from 'sdk/client/core/react/DevTools.tsx';

export class CordDevTools extends HTMLElement {
  connectedCallback() {
    ReactDOM.render(
      <StrictMode>
        <DevTools />
      </StrictMode>,
      this,
    );
  }
}
