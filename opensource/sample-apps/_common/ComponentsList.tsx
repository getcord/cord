import { useCallback } from 'react';
import cx from 'classnames';
import { ComponentNameToIcon } from './ComponentNameToIcon';
import type { ComponentNames } from './ComponentNameToIcon';

const CSS = `
hr {
  border: 0;
  border-top: 1px solid #CECFD2;  
  margin: 0;
}

.drawer-container {
  display: flex;
  gap: 32px;
  margin: auto;
  /* Shifting up the text so it appears over the hr */
  margin-top: -18px;
}

.pill {
  align-items: center;
  background-color: #DCDCE2;
  border-radius: 16px;
  color: black;
  display: flex;
  font-size: 12px;
  gap: 4px;
  min-height: 24px;
  padding: 4px 8px;
  text-decoration: none;
  white-space: nowrap;
}

.pill.dark {
  background-color: #4C4C4C;
  color: #F5F5F5;
}

.pill:hover {
  background-color: #9A6AFF;
  color: white;
}

.api.pill::after,
.github-logo.pill::after {
  content: '↗︎';
}

.section {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  color: #9a6aff;
  background-color: #F8F4F4;
  border-radius: 8px;
  font-size: 12px;
  padding: 0 4px;
  white-space: nowrap;
}

.section-title.dark {
  background-color: #302C2C;
  color: white;
}

.section-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Don't display the drawer on mobile */
@media only screen and (max-width: 650px) {
  .drawer-container, hr {
    display: none;
  }
}
`;

export type DemoApp = 'dashboard' | 'canvas-new' | 'video-player' | 'document';

export function ComponentsList({
  api,
  components,
  darkMode,
  app,
}: {
  components?: ComponentNames[];
  api?: string[];
  darkMode?: boolean;
  app: DemoApp;
}) {
  const setHoveredComponent = useCallback((componentString: string) => {
    const rootDiv = document.getElementById('root');
    rootDiv?.setAttribute('data-hovered-component', componentString);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <hr />
      <div className="drawer-container">
        <div className="section">
          <div
            className={cx('section-title', {
              ['dark']: darkMode,
            })}
          >
            Explore components
          </div>
          <div className="section-items">
            {components?.map((component) => {
              const lowercaseComponent = component.toLowerCase();
              const prettyComponentName = lowercaseComponent
                .slice(4) // Remove `cord-`
                .split('-')
                .join(' ')
                .toLowerCase();
              return (
                <a
                  href={`https://docs.cord.com/components/${lowercaseComponent}`}
                  key={component}
                  className={cx('pill', {
                    ['dark']: darkMode,
                  })}
                  onMouseEnter={() => setHoveredComponent(component)}
                  onMouseLeave={() => setHoveredComponent('')}
                >
                  {ComponentNameToIcon(component, !!darkMode)}
                  {capitalize(prettyComponentName)}
                </a>
              );
            })}
          </div>
        </div>
        <div className="section">
          <div
            className={cx('section-title', {
              ['dark']: darkMode,
            })}
          >
            Explore APIs
          </div>
          <div className="section-items">
            {api?.map((apiName) => (
              <a
                href={`https://docs.cord.com/js-apis-and-hooks/${apiName}-api`}
                key={apiName}
                className={cx('api', 'pill', {
                  ['dark']: darkMode,
                })}
              >
                {capitalize(apiName)}
              </a>
            ))}
          </div>
        </div>
        <div className="section">
          <div
            className={cx('section-title', {
              ['dark']: darkMode,
            })}
          >
            View source code
          </div>
          <div className="section-items">
            <GithubLink app={app} darkMode={!!darkMode} />
            <SandpackLink app={app} darkMode={!!darkMode} />
          </div>
        </div>
      </div>
    </>
  );
}

function capitalize(componentName: string) {
  return componentName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join(' ');
}

function GithubLogo() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_1906_7113)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.97616 0C3.56555 0 0 3.66667 0 8.20283C0 11.8288 2.28457 14.8982 5.45388 15.9845C5.85012 16.0662 5.99527 15.808 5.99527 15.5908C5.99527 15.4007 5.9822 14.7488 5.9822 14.0697C3.76343 14.5587 3.30139 13.0918 3.30139 13.0918C2.94482 12.1412 2.41649 11.8968 2.41649 11.8968C1.69029 11.3943 2.46939 11.3943 2.46939 11.3943C3.27494 11.4487 3.69763 12.2363 3.69763 12.2363C4.41061 13.4857 5.55951 13.1327 6.02171 12.9153C6.08767 12.3857 6.2991 12.019 6.52359 11.8153C4.75396 11.6252 2.89208 10.919 2.89208 7.76817C2.89208 6.87183 3.20882 6.1385 3.71069 5.56817C3.63151 5.3645 3.35412 4.52233 3.79004 3.39517C3.79004 3.39517 4.46351 3.17783 5.98204 4.23717C6.63218 4.05761 7.30265 3.96627 7.97616 3.9655C8.64963 3.9655 9.33616 4.06067 9.97012 4.23717C11.4888 3.17783 12.1623 3.39517 12.1623 3.39517C12.5982 4.52233 12.3207 5.3645 12.2415 5.56817C12.7566 6.1385 13.0602 6.87183 13.0602 7.76817C13.0602 10.919 11.1984 11.6115 9.41551 11.8153C9.70612 12.0733 9.9569 12.5622 9.9569 13.3363C9.9569 14.4363 9.94384 15.3192 9.94384 15.5907C9.94384 15.808 10.0891 16.0662 10.4852 15.9847C13.6545 14.898 15.9391 11.8288 15.9391 8.20283C15.9522 3.66667 12.3736 0 7.97616 0Z"
          fill="black"
        />
      </g>
      <defs>
        <clipPath id="clip0_1906_7113">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

type ViewSourceLinkProps = {
  app: DemoApp;
  darkMode: boolean;
};

function GithubLink({ app, darkMode }: ViewSourceLinkProps) {
  const to = `https://github.com/getcord/demo-apps/tree/master/${app}`;

  return (
    <a
      href={to}
      className={cx('github-logo', 'pill', {
        ['dark']: darkMode,
      })}
      target="_blank"
      rel="noreferrer"
    >
      <GithubLogo />
      <span>Github</span>
    </a>
  );
}

function CodeEditorLogo() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.4001 1.60156C2.92271 1.60156 2.46487 1.7912 2.12731 2.12877C1.78974 2.46634 1.6001 2.92417 1.6001 3.40156V12.6016C1.6001 13.079 1.78974 13.5368 2.12731 13.8744C2.46487 14.2119 2.92271 14.4016 3.4001 14.4016H12.6001C13.0775 14.4016 13.5353 14.2119 13.8729 13.8744C14.2105 13.5368 14.4001 13.079 14.4001 12.6016V3.40156C14.4001 2.92417 14.2105 2.46634 13.8729 2.12877C13.5353 1.7912 13.0775 1.60156 12.6001 1.60156H3.4001ZM6.6241 6.62556C6.73008 6.51182 6.78778 6.36139 6.78504 6.20594C6.7823 6.0505 6.71933 5.9022 6.6094 5.79226C6.49946 5.68233 6.35116 5.61937 6.19572 5.61662C6.04028 5.61388 5.88984 5.67158 5.7761 5.77756L3.9761 7.57756C3.86374 7.69006 3.80063 7.84256 3.80063 8.00156C3.80063 8.16056 3.86374 8.31306 3.9761 8.42556L5.7761 10.2256C5.88984 10.3315 6.04028 10.3892 6.19572 10.3865C6.35116 10.3838 6.49946 10.3208 6.6094 10.2109C6.71933 10.1009 6.7823 9.95262 6.78504 9.79718C6.78778 9.64174 6.73008 9.4913 6.6241 9.37756L5.2481 8.00156L6.6241 6.62556ZM10.2241 5.77756C10.1692 5.71861 10.1029 5.67133 10.0293 5.63854C9.95573 5.60574 9.87628 5.58811 9.79572 5.58669C9.71515 5.58527 9.63513 5.60009 9.56042 5.63026C9.48571 5.66044 9.41784 5.70536 9.36087 5.76233C9.30389 5.81931 9.25898 5.88717 9.2288 5.96188C9.19862 6.03659 9.1838 6.11662 9.18522 6.19718C9.18665 6.27774 9.20428 6.35719 9.23707 6.43079C9.26987 6.50439 9.31715 6.57063 9.3761 6.62556L10.7521 8.00156L9.3761 9.37756C9.31715 9.43249 9.26987 9.49873 9.23707 9.57233C9.20428 9.64593 9.18665 9.72538 9.18522 9.80595C9.1838 9.88651 9.19862 9.96653 9.2288 10.0412C9.25898 10.116 9.30389 10.1838 9.36087 10.2408C9.41784 10.2978 9.48571 10.3427 9.56042 10.3729C9.63513 10.403 9.71515 10.4179 9.79572 10.4164C9.87628 10.415 9.95573 10.3974 10.0293 10.3646C10.1029 10.3318 10.1692 10.2845 10.2241 10.2256L12.0241 8.42556C12.1365 8.31306 12.1996 8.16056 12.1996 8.00156C12.1996 7.84256 12.1365 7.69006 12.0241 7.57756L10.2241 5.77756Z"
        fill="black"
      />
    </svg>
  );
}

function SandpackLink({ app, darkMode }: ViewSourceLinkProps) {
  const appPath =
    app === 'canvas-new' ? 'canvas' : app === 'video-player' ? 'video' : app;
  const to = `https://cord.com/demos/${appPath}`;

  return (
    <a
      href={to}
      className={cx('github-logo', 'pill', {
        ['dark']: darkMode,
      })}
      target="_blank"
      rel="noreferrer"
    >
      <CodeEditorLogo />
      <span>Live code editor</span>
    </a>
  );
}
