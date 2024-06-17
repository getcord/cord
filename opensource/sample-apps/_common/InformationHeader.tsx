import cx from 'classnames';
import type { DemoApp } from './ComponentsList';
import { ComponentsList } from './ComponentsList';
import type { ComponentNames } from './ComponentNameToIcon';
import cord from './images/cord.svg';
import './informationHeader.css';

export function InformationHeader({
  app,
  api,
  darkTheme = false,
  components,
}: {
  app: DemoApp;
  darkTheme?: boolean;
  components: ComponentNames[];
  api: string[];
}) {
  return (
    <header className={cx({ ['dark']: darkTheme })}>
      <div id="links">
        <div id="logo">
          <img src={cord} />
        </div>
        <a
          className="button"
          href="https://console.cord.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Get your API keys
        </a>
      </div>
      <ComponentsList
        components={components}
        api={api}
        darkMode={darkTheme}
        app={app}
      />
    </header>
  );
}
