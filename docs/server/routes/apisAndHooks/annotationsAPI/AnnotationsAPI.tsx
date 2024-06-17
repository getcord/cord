/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import { H3, H4, H5 } from 'docs/server/ui/typography/Typography.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import CordDocsMarkdown from 'docs/server/ui/markdown/CordDocsMarkdown.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';

const jsMethodData = apiData.types.ICordAnnotationSDK.methods.methods;

const uri = '/js-apis-and-hooks/annotations-api';
const title = 'Annotations API';
const subtitle = `A powerful and flexible API for adding annotations to your project`;

function AnnotationsAPI() {
  return (
    <Page
      pretitle="JavaScript APIs & Hooks"
      pretitleLinkTo="/js-apis-and-hooks"
      title={title}
      pageSubtitle={subtitle}
      showTableOfContents={true}
    >
      <section>
        <H3>How Cord decides where to place the annotation pin</H3>
        <ol>
          <li>
            <p>
              If there is a <code>useCordAnnotationRenderer</code> handler
              registered for the exact location of the annotation, we use the
              return value of that handler.
            </p>
          </li>
          <li>
            <p>
              If there is an element on the page decorated with a{' '}
              <code>data-cord-annotation-location</code> attribute with the
              exact location of the annotation, we place the pin at the x/y
              coordinates (scaled proportional to the dimensions of the
              element), where the user clicked when they placed the annotation.
            </p>
          </li>
          <li>
            <p>
              If there is a <code>useCordAnnotationRenderer</code> handler
              registered on a{' '}
              <Link to="/reference/location/#partial-matching">
                partial match
              </Link>{' '}
              of the annotation location, we use the return value of that
              handler.
            </p>
          </li>
          <li>
            <p>
              If there is an element on the page decorated with a{' '}
              <code>data-cord-annotation-location</code> attribute which
              partially matches the location of the annotation, we place the pin
              in the center of that element and show a tooltip indicating that
              the content may have changed.
            </p>
          </li>
        </ol>
      </section>
      <HR />
      <section>
        <H3>API Objects</H3>
        <section>
          <H4 data-propertiesheader={true}>Location</H4>
          <p>
            Type definition of a location: flat object where the values can be
            either <code>string</code>, <code>number</code> or{' '}
            <code>boolean</code>.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `type Location = Record<string, string | number | boolean>;
  
// Example:
// { route: '/dashboard/2', graph: '30d Revenue', x: 379, y: 231 }`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>Annotation</H4>
          <p>Type definition of an annotation.</p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `type Annotation<L extends Location = {}> = {
  id: string;
  location: L;
};`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>AnnotationCapturePosition</H4>
          <p>
            Type definition for the first argument received by the handler you
            provide to <code>useCordAnnotationCaptureHandler</code>, indicates
            the position the user clicked relative to an annotation target
            element.
          </p>
          <ul css={{ paddingBottom: 16 }}>
            <li>
              element is the DOM element that the annotation was captured
              within.
            </li>
            <li>
              x and y are the pixel coordinates of the user click relative to
              the annotation target element.
            </li>
          </ul>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `type AnnotationCapturePosition = {
  element: HTMLElement;
  x: number;
  y: number;
};`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>AnnotationCaptureResult</H4>
          <p>
            Type definition for the return value of the handler you provide to
            <code>useCordAnnotationCaptureHandler</code>.
          </p>
          <ul css={{ paddingBottom: 16 }}>
            <li>
              <code>extraLocation</code>: data to be added to the location of
              the annotation that was captured.
            </li>
            <li>
              <code>label</code>: the user-visible label of the annotation.
            </li>
          </ul>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `type AnnotationCaptureResult<L extends Location = {}> = {
  extraLocation?: Partial<L>;
  label?: string;
};`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>
            AnnotationPositionRendererCallback
          </H4>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `type AnnotationPositionRendererCallback<L extends Location = {}> = (
  annotation: Annotation<L>,
  coordsRelativeToTarget: { x: number; y: number },
) => AnnotationRenderPosition | null | undefined | void;`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>AnnotationRenderPosition</H4>
          <p>
            Type definition for the return value of the handler you provide to
            <code>useCordAnnotationRenderer</code>. This object lets you
            customize where the annotation pointer should be rendered.
          </p>
          <ul css={{ paddingBottom: 16 }}>
            <li>
              <code>coordinates</code>: lets you specify x and y coordinates for
              the annotation pointer, relative to element. The coordinates can
              also be provided as percentages of the dimensions of element, for
              example "30%". If element is not specified, the coordinates will
              be interpreted relative to the document.
            </li>
            <li>
              <code>element</code>: the HTML element the coordinates should be
              relative to.
            </li>
          </ul>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `type AnnotationRenderPosition = {
  coordinates?: {
    x: number | string;
    y: number | string;
  };
  element?: HTMLElement;
};`,
              },
            ]}
          />
        </section>
        <HR />
      </section>
      <section>
        <H3>API Functions</H3>
        <section>
          <H4 data-propertiesheader={true}>setCaptureHandler</H4>
          <p>
            Registers a handler function that will be called by Cord when the
            user places an annotation pin inside an annotation target element
            that matches the <code>location</code>.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `// defined in window.CordSDK.annotation
function setCaptureHandler<L extends Location>(
  location: L,
  handler: (
    capturePosition: AnnotationCapturePosition,
    element: HTMLElement,
  ) => AnnotationCaptureResult | undefined | void,
): void;`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>clearCaptureHandler</H4>
          <p>
            Clears any capture handler function previously defined on the{' '}
            <code>location</code>.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `// defined in window.CordSDK.annotation
function clearCaptureHandler(location: Location): void;`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>setRenderHandler</H4>
          <p>
            Registers a handler function that will be called by Cord when an
            annotation needs to be rendered, allowing you to provide a specific
            position for the annotation pin, either absolute or relative to an
            element.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `// defined in window.CordSDK.annotation
function setRenderHandler<L extends Location>(
  location: L,
  handler: AnnotationPositionRendererCallback<L>,
): void;`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>clearRenderHandler</H4>
          <p>
            Clears any render handler function previously defined on the{' '}
            <code>location</code>.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `// defined in window.CordSDK.annotation
function clearRenderHandler(location: Location): void;`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>setClickHandler</H4>
          <p>
            Registers a handler function that will be called by Cord when the
            user clicks an annotation in the sidebar whose <code>location</code>{' '}
            matches the <code>location</code> argument.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `// defined in window.CordSDK.annotation
function setClickHandler<L extends Location>(
  location: L,
  handler: (annotation: Annotation<L>) => unknown,
): void;`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>clearClickHandler</H4>
          <p>
            Clears any click handler function previously defined on the{' '}
            <code>location</code>.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `// defined in window.CordSDK.annotation
function clearClickHandler(location: Location): void;`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>useCordAnnotationTargetRef</H4>
          <p>
            Helper function that annotates an element with the
            <code>data-cord-annotation-location</code> attribute, the value
            being a stable serialization of the location you provide. Returns a
            React ref object.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `// exported by @cord-sdk/react
function useCordAnnotationTargetRef<
  E extends HTMLElement,
  L extends Location = {}
>(location: Partial<L>): React.MutableRefObject<E | null>;`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>useCordAnnotationCaptureHandler</H4>
          <p>
            Registers a handler function that will be called by Cord when the
            user places an annotation pin inside an annotation target element
            that matches the <code>location</code>.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `// exported by @cord-sdk/react
function useCordAnnotationCaptureHandler<L extends Location = {}>(
  location: Partial<L>,
  handler: (
    capturePosition: AnnotationCapturePosition,
    element: HTMLElement,
  ) => AnnotationCaptureResult | undefined | void,
): void;`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>useCordAnnotationClickHandler</H4>
          <p>
            Registers a handler function that will be called by Cord when the
            user clicks an annotation in the sidebar whose <code>location</code>{' '}
            matches the <code>location</code> argument.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `// exported by @cord-sdk/react
function useCordAnnotationClickHandler<L extends Location = {}>(
  location: Partial<L>,
  handler: (annotation: AnnotationWithThreadID<L>) => unknown
): void;`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>useCordAnnotationRenderer</H4>
          <p>
            Registers a handler function that will be called by Cord when an
            annotation needs to be rendered, allowing you to provide a specific
            position for the annotation pin, either absolute or relative to an
            element. Returns a <code>redrawAnnotations</code> function you can
            optionally use to re-calculate the annotations' positions and
            re-draw them.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: 'TypeScript',
                snippet: `// exported by @cord-sdk/react
function useCordAnnotationRenderer<L extends Location = {}>(
  location: Partial<L>,
  handler: AnnotationPositionRendererCallback<L>,
): { redrawAnnotations: () => void };`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>viewportCoordinatesToString</H4>
          <CordDocsMarkdown
            value={jsMethodData.viewportCoordinatesToString.summary}
          />
          <H5>Arguments</H5>
          <SimplePropertiesList
            level={6}
            properties={jsMethodData.viewportCoordinatesToString.parameters}
          />
          <H5>Returns</H5>
          <CordDocsMarkdown
            value={jsMethodData.viewportCoordinatesToString.returns.description}
          />
        </section>
        <HR />
        <section>
          <H4 data-propertiesheader={true}>stringToViewportCoordinates</H4>
          <CordDocsMarkdown
            value={jsMethodData.stringToViewportCoordinates.summary}
          />
          <H5>Arguments</H5>
          <SimplePropertiesList
            level={6}
            properties={jsMethodData.stringToViewportCoordinates.parameters}
          />
          <H5>Returns</H5>
          <CordDocsMarkdown
            value={jsMethodData.stringToViewportCoordinates.returns.description}
          />
        </section>
      </section>
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: AnnotationsAPI,
};
