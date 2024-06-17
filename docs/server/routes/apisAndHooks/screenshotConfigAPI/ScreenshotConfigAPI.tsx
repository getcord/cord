/** @jsxImportSource @emotion/react */
import { Link } from 'react-router-dom';

import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';

const uri = '/js-apis-and-hooks/screenshotconfig-api';
const title = 'ScreenshotConfig API';
const subtitle =
  "Control what to include in Cord's screenshots or provide your own screenshot";

function ScreenshotConfigAPI() {
  return (
    <Page
      pretitle="JavaScript APIs & Hooks"
      pretitleLinkTo="/js-apis-and-hooks"
      title={title}
      pageSubtitle={subtitle}
      showTableOfContents={true}
    >
      <section>
        <H3>About Cord screenshots</H3>
        <p>
          When users place an annotation, Cord takes a screenshot of the current
          viewport. The screenshot is attached to the Slack and email
          notifications. Screenshots are useful as they capture what the user is
          currently seeing. If the content of that page changes, users can still
          refer to the screenshot to get more context.
        </p>
        <p>
          The <code>screenshotConfig</code> API allows developers to specify
          exactly what to screenshot: the <code>targetElement</code>. This
          element can be anywhere in the current <code>document</code>, not
          necessarily within the viewport. You can use{' '}
          <code>screenshotConfig</code> with the{' '}
          <Link to="/components/cord-thread">Thread</Link> and{' '}
          <Link to="/components/cord-thread">FloatingThreads</Link> components.
        </p>
        <p>
          If you already have a screenshot of the page, and don't want Cord to
          take one, you can specify a <code>screenshotUrlOverride</code>. The
          URL can be a link to a hosted image, or a{' '}
          <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs">
            DataURL
          </a>
          . This resource will be used as the screenshot. For best results, the
          provided image size should be as close as possible as the user's
          current viewport size.
        </p>
      </section>
      <section>
        <H3>Examples</H3>
        <p>
          For the examples, we will use Cord{' '}
          <Link to="/components/cord-thread">Thread</Link> component. However,
          you can also use{' '}
          <Link to="/components/cord-thread">FloatingThreads</Link>.
        </p>
        <H4>Screenshot a specific element</H4>
        With the following snippet, the screenshot will only include our target
        element and its children.
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'tsx',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { Thread } from '@cord-sdk/react';

export const Example = () => {
    const screenshotTargetRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <Thread
                threadId={'<any string that is unique across your entire project>'}
                location={{ page: 'index' }}
                screenshotConfig={{ targetElement: screenshotTargetRef.current }}
            />
            <div ref={screenshotTargetRef}>Anything inside this element will be in the screenshot</div>
        </>
    );
};`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `const thread = document.querySelector('cord-thread');
const screenshotTarget = document.querySelector('.my-screenshot-target');
thread.screenshotConfig = { targetElement: screenshotTarget };`,
            },
          ]}
        />
        <H4>Screenshot a specific element and crop it</H4>
        To more exactly control the screenshot crop, you can specify a{' '}
        <code>cropRectangle</code>. This can be useful to screenshot part of the
        page where there isn't a suitable common ancestor to use as a{' '}
        <code>targetElement</code>.
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'tsx',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { Thread } from '@cord-sdk/react';

export const Example = () => {
    const screenshotTargetRef = useRef<HTMLDivElement>(null);
    // Crop 20px from the bottom of the screenshot
    const cropRectangle = { height: screenshotTargetRef.current.clientHeight - 20 };

    return (
        <>
            <Thread
                threadId={'<any string that is unique across your entire project>'}
                location={{ page: 'index' }}
                screenshotConfig={{ targetElement: screenshotTargetRef.current, cropRectangle }}
            />
            <div ref={screenshotTargetRef}>Anything inside this element will be in the screenshot</div>
        </>
    );
};`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `const thread = document.querySelector('cord-thread');
const screenshotTarget = document.querySelector('.my-screenshot-target');
// Crop 20px from the bottom of the screenshot
const cropRectangle = { height: screenshotTargetRef.clientHeight - 20 };
thread.screenshotConfig = { targetElement: screenshotTarget, cropRectangle };`,
            },
          ]}
        />
        The ScreenshotConfig API pairs well with{' '}
        <Link to="/how-to/improve-annotation-accuracy#Only-allow-annotations-on-some-parts-of-your-page--Optional-">
          cord-annotation-allowed API
        </Link>
        . If you are restricting what can be annotated, you might also want to
        restrict what gets in the screenshot.
        <H4>Provide your own Screenshot</H4>
        If you don't want Cord to take a screenshot of the page, you can specify
        an image in the form of an URL to <code>screenshotUrlOverride</code>.
        When Cord is about to take a screenshot, it will check this property. If
        it's defined, Cord will <code>fetch</code> the image and attach it to
        the message. For this reason, it's best to set{' '}
        <code>screenshotUrlOverride</code> as soon as you know what the
        screenshot should be. Note that the <code>screenshotUrlOverride</code>{' '}
        takes precedence over the <code>targetElement</code>.
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'tsx',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { FloatingThreads } from '@cord-sdk/react';

export const Example = () => {
    return (
          <FloatingThreads
              location={{ page: 'index' }}
              screenshotConfig={{ screenshotUrlOverride: "https://picsum.photos/200" }}
          />
    );
};`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `const floatingThreads = document.querySelector('cord-thread');
floatingThreads.screenshotConfig = { screenshotUrlOverride: "https://picsum.photos/200" };`,
            },
          ]}
        />
        <H4>Remove screenshotConfig</H4>
        Removing the <code>screenshotConfig</code> restores Cord's default
        screenshot behavior: screenshot the whole viewport.
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'tsx',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { Thread } from '@cord-sdk/react';

export const Example = () => {
    return (
        <Thread
            threadId={'<any string that is unique across your entire project>'}
            location={{ page: 'index' }}
            // no screenshotConfig specified
        />
    );
};`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `const thread = document.querySelector('cord-thread');
const screenshotTarget = document.querySelector('.my-screenshot-target');
thread.screenshotConfig = undefined;`,
            },
          ]}
        />
      </section>
      <section>
        <H4>Types</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'typescript',
              languageDisplayName: 'TypeScript',
              snippet: `/**
* Specify what DOM element to screenshot. This overrides Cord's
* default screenshot behavior, which is to take a screenshot of
* the current viewport.
*
* You can set this to \`undefined\` to enable Cord's default behavior again.
*/
export type ScreenshotConfig =
| {
    /**
    * The screenshot will only include this DOM
    * element and all of its children.
    */
    targetElement: HTMLElement;
    /**
    * Crop the screenshot to a specific rectangle within the target element. 
    * All values must be specified in pixels.
    */
    cropRectangle?: Partial<{
        /** X coordinate of the top left corner of the rectangle. 
         * By default, this matches the top left corner of the \`targetElement\` */
        x: number;
        /** Y coordinate of the top left corner of the rectangle. 
         * By default, this matches the top left corner of the \`targetElement\` */
        y: number;
        /** By default, this is the width of the \`targetElement\` */
        width: number;
        /** By default, this is the height of the \`targetElement\` */
        height: number;
     }>;
    }
| undefined;`,
            },
          ]}
        />
      </section>
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: ScreenshotConfigAPI,
};
