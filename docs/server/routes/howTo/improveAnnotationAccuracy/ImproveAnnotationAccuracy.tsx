/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';

function ImproveAnnotationAccuracy() {
  return (
    <Page
      pretitle="How to"
      pretitleLinkTo="/how-to"
      title="Improve annotation accuracy"
      pageSubtitle={`The Annotations API lets you deeply integrate Cord's
        annotation functionality into your product, creating a seamless
        experience.`}
      showTableOfContents={true}
    >
      <p>
        By supplying the "glue code" between the annotation flow and your UI,
        you ensure annotations always match what's on the screen. It's perfect
        for complex features with multiple states, like charts, text editors,
        maps, and more.
      </p>
      <p>
        <img
          src="/static/images/annotation-overview-9d52d3.png"
          alt="Video player with an annotation coming from the Cord sidebar"
        />
      </p>
      <StepByStepGuide includesFinalStep={true}>
        <GuideStep>
          <H4>Set the annotation's location</H4>
          <p>
            The most important concept behind the Annotations API is the
            annotation <Link to="/reference/location">location</Link>. A
            Location is a flat object you associate with a part of your
            document, that describes, in your app's terminology, what is being
            annotated. Cord stores this Location object alongside the
            annotation, and we surface it when it's time to render the
            annotation pin.
          </p>

          <p>
            For example, in a chart component (either written entirely by you or
            using a library like Highcharts, Chart.js, etc), you might describe
            the point being annotated as:
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'json',
                languageDisplayName: 'JSON',
                snippet: `{
  "page": "dashboard",
  "chart": "revenue",
  "month": 3,
  "year": 2022
}`,
              },
            ]}
          />
          <p>
            Or, for a video player, you might describe an annotation taken at
            timestamp <code>1:25</code> as:
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'json',
                languageDisplayName: 'JSON',
                snippet: `{
    "page": "dashboard",
    "video": "dramatic-gopher.mp4",
    "time": 85
  }`,
              },
            ]}
          />
          <p>
            An <strong>annotation target</strong> is an HTML element in your
            application's DOM decorated with a{' '}
            <code>data-cord-annotation-location</code> attribute, with the value
            being a stable serialization of the location object that best
            represents that area of the document.
          </p>
          <p>
            When the user starts the annotation flow from the Cord sidebar and
            clicks to place the annotation pin somewhere on the page, we check
            if the click is within an annotation target, by checking its DOM
            ancestors for any <code>data-cord-annotation-location</code>{' '}
            attribute.
          </p>
        </GuideStep>
        <GuideStep>
          <H4>Decorate your DOM with the annotation location</H4>
          <p>
            The{' '}
            <Link
              to={
                '/js-apis-and-hooks/annotations-api/#usecordannotationtargetref'
              }
            >
              <code>useCordAnnotationTargetRef</code>
            </Link>{' '}
            hook helps you decorate HTML elements with the
            <code>data-cord-annotation-location</code> attribute representing
            the location for annotations captured within that element (and its
            DOM subtree). This hook handles serializing the location object and
            attaching it to the element as the data attribute so you don't have
            to.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'tsx',
                languageDisplayName: 'React',
                snippet: `import { useCordAnnotationTargetRef } from "@cord-sdk/react";

function VideoPlayerComponent({ videoSrc }) {
  const location = { page: "dashboard", video: videoSrc };
  const videoElementRef = useCordAnnotationTargetRef(location);

  return <video src={videoSrc} ref={videoElementRef} />;
}`,
              },
            ]}
          />
          <p>
            With just this addition to your DOM, any time the user places an
            annotation on the &lt;video&gt; element, we store the annotation
            location as, for example,{' '}
            <code>
              {'{'} page: "dashboard", video: "dramatic-gopher.mp4" {'}'}
            </code>
            . When other users see that annotation, it will point to an element
            in the page that matches that location.
          </p>
        </GuideStep>
        <GuideStep>
          <H4>Define dynamic locations (Optional)</H4>
          <p>
            If your annotations need to include extra location information that
            is highly dynamic, dependent on where exactly the user clicked, or
            otherwise can't be expressed at render time, you can provide that
            through the
            <Link
              to={
                '/js-apis-and-hooks/annotations-api/#usecordannotationcapturehandler'
              }
            >
              <code>useCordAnnotationCaptureHandler </code>
            </Link>{' '}
            hook.
          </p>
          <p>
            For example, you might want to remember the timestamp the video
            annotation was taken at, so that you can skip the video back to that
            exact timestamp when the user clicks the annotation in Cord.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'tsx',
                languageDisplayName: 'React with TypeScript',
                snippet: `import {
  useCordAnnotationTargetRef,
  useCordAnnotationCaptureHandler,
} from "@cord-sdk/react";

type VideoPlayerAnnotation = {
  page: string;
  video: string;
  time: number;
};

function VideoPlayerComponent({ videoSrc }) {

  // The initial location information for any annotations
  // users create.
  const location = { page: "dashboard", video: videoSrc };

  // A ref to apply to your video element. Cord will
  // use this ref when users create annotations, applying
  // the \`location\` object to the annotation.
  const videoElementRef = useCordAnnotationTargetRef(location);

  // The callback provided here will be used to enrich the
  // \`location\` data for the annotation. You would use
  // this hook when you want to put more specific location
  // information in the annotation. Here, for instance,
  // we're adding the current time of the video player
  // as extra \`location\` data.
  useCordAnnotationCaptureHandler<VideoPlayerAnnotation>(location, () => {
    return {
      extraLocation: {
        time: videoElementRef.current?.currentTime ?? 0,
      },
    };
  });

  return <video ref={videoElementRef} src={videoSrc} />;
}`,
              },
              {
                language: 'jsx',
                languageDisplayName: 'React with JavaScript',
                snippet: `import {
  useCordAnnotationTargetRef,
  useCordAnnotationCaptureHandler,
} from "@cord-sdk/react";

function VideoPlayerComponent({ videoSrc }) {
  // The initial location information for any annotations
  // users create.
  const location = { page: "dashboard", video: videoSrc };

  // A ref to apply to your video element. Cord will
  // use this ref when users create annotations, applying
  // the \`location\` object to the annotation.
  const videoElementRef = useCordAnnotationTargetRef(location);

  // The callback provided here will be used to enrich the
  // \`location\` data for the annotation. You would use
  // this hook when you want to put more specific location
  // information in the annotation. Here, for instance,
  // we're adding the current time of the video player
  // as extra \`location\` data.
  useCordAnnotationCaptureHandler(location, () => {
    return {
      extraLocation: {
        time: videoElementRef.current?.currentTime ?? 0,
      },
    };
  });

  return <video ref={videoElementRef} src={videoSrc} />;
}`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <H4>Add location-specific labels (Optional)</H4>
          <p>
            The{' '}
            <Link
              to={
                '/js-apis-and-hooks/annotations-api/#usecordannotationcapturehandler'
              }
            >
              <code>useCordAnnotationCaptureHandler </code>
            </Link>{' '}
            hook can also be used to define a location-specific label for the
            annotation -- user-visible text that describes what is being
            annotated -- by returning a <code>label</code> field. If you don't
            provide one, we default to "Annotation".
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'tsx',
                languageDisplayName: 'React with TypeScript',
                snippet: `import {
  useCordAnnotationTargetRef,
  useCordAnnotationCaptureHandler,
} from "@cord-sdk/react";

type VideoPlayerAnnotation = {
  page: string;
  video: string;
  time: number;
};

function VideoPlayerComponent({ videoSrc }) {

  // The initial location information for any annotations
  // users create.
  const location = { page: "dashboard", video: videoSrc };

  // A ref to apply to your video element. Cord will
  // use this ref when users create annotations, applying
  // the \`location\` object to the annotation.
  const videoElementRef = useCordAnnotationTargetRef(location);

  // The callback provided here will be used to enrich the
  // \`location\` data for the annotation. You would use
  // this hook when you want to put more specific location
  // information in the annotation. Here, for instance,
  // we're adding the current time of the video player
  // as extra \`location\` data.
  useCordAnnotationCaptureHandler<VideoPlayerAnnotation>(location, () => {
    return {
      extraLocation: {
        time: videoElementRef.current?.currentTime ?? 0,
      },

      // The \`label\` property is a special field. Setting
      // this value will change how the annotation is displayed
      // within Cord. Instead of showing the word "Annotation"
      // in Cord, the label provided here will be used. You
      // can use this to make annotation easier for your users
      // to understand and navigate.
      label: "Video: " + timestampToString(time),
    };
  });

  return <video ref={videoElementRef} src={videoSrc} />;
}`,
              },
              {
                language: 'jsx',
                languageDisplayName: 'React with JavaScript',
                snippet: `import {
  useCordAnnotationTargetRef,
  useCordAnnotationCaptureHandler,
} from "@cord-sdk/react";

function VideoPlayerComponent({ videoSrc }) {
  // The initial location information for any annotations
  // users create.
  const location = { page: "dashboard", video: videoSrc };

  // A ref to apply to your video element. Cord will
  // use this ref when users create annotations, applying
  // the \`location\` object to the annotation.
  const videoElementRef = useCordAnnotationTargetRef(location);

  // The callback provided here will be used to enrich the
  // \`location\` data for the annotation. You would use
  // this hook when you want to put more specific location
  // information in the annotation. Here, for instance,
  // we're adding the current time of the video player
  // as extra \`location\` data.
  useCordAnnotationCaptureHandler(location, () => {
    return {
      extraLocation: {
        time: videoElementRef.current?.currentTime ?? 0,
      },

      // The \`label\` property is a special field. Setting
      // this value will change how the annotation is displayed
      // within Cord. Instead of showing the word "Annotation"
      // in Cord, the label provided here will be used. You
      // can use this to make annotation easier for your users
      // to understand and navigate.
      label: "Video: " + timestampToString(time),
    };
  });

  return <video ref={videoElementRef} src={videoSrc} />;
}`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <H4>Control where the annotation pin is rendered (Optional)</H4>
          <p>
            You can control the exact annotation pin position on the page
            through the{' '}
            <Link to="/js-apis-and-hooks/annotations-api/#usecordannotationrenderer">
              <code>useCordAnnotationRenderer</code>
            </Link>{' '}
            hook. The function you provide will be called any time the pin
            positions on the page are refreshed. The function receives the
            <code>Annotation</code> object as an argument. You can return either
            absolute document coordinates, or coordinates relative to a DOM
            element.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'tsx',
                languageDisplayName: 'React with TypeScript',
                snippet: `import {
  useCordAnnotationTargetRef,
  useCordAnnotationCaptureHandler,
} from "@cord-sdk/react";

type VideoPlayerAnnotation = {
  page: string;
  video: string;
  time: number;
};

function VideoPlayerComponent({ videoSrc }) {

  // The initial location information for any annotations
  // users create.
  const location = { page: "dashboard", video: videoSrc };

  // A ref to apply to your video element. Cord will
  // use this ref when users create annotations, applying
  // the \`location\` object to the annotation.
  const videoElementRef = useCordAnnotationTargetRef(location);

  // The callback provided here will be used to enrich the
  // \`location\` data for the annotation. You would use
  // this hook when you want to put more specific location
  // information in the annotation. Here, for instance,
  // we're adding the current time of the video player
  // as extra \`location\` data.
  useCordAnnotationCaptureHandler<VideoPlayerAnnotation>(location, () => {
    return {
      extraLocation: {
        time: videoElementRef.current?.currentTime ?? 0,
      },

      // The \`label\` property is a special field. Setting
      // this value will change how the annotation is displayed
      // within Cord. Instead of showing the word "Annotation"
      // in Cord, the label provided here will be used. You
      // can use this to make annotation easier for your users
      // to understand and navigate.
      label: "Video: " + timestampToString(time),
    };
  });

  // The callback provided to this hook will receive the location
  // object associated with the annotation. This is the same
  // object that we constructed in the above code where we
  // combined the \`location\` object with the \`extraLocation\`
  // field in the \`useCordAnnotationCaptureHandler\` hook.
  useCordAnnotationRenderer(location, (annotationLocation: VideoPlayerAnnotation) => {
    if (!videoElementRef.current) {
      // if the video element is for some reason not rendered yet,
      // don't show the annotation pin
      return;
    }

    // If the video player's current time isn't close to the
    // timestamp where the annotation was created, don't show
    // the annotation.
    if (
      annotationLocation.time < videoElementRef.current.currentTime - 2.5 &&
      annotationLocation.time > videoElementRef.current.currentTime + 2.5
    ) {
      return;
    }

    // If we made it here, we know that the annotation makes sense to show, so
    // we'll put in on the video player in the bottom right corner.
    return {
      coordinates: { x: "90%", y: "90%" },
      element: videoElementRef.current,
    };
  });

  return <video ref={videoElementRef} src={videoSrc} />;
}`,
              },
              {
                language: 'jsx',
                languageDisplayName: 'React with JavaScript',
                snippet: `import {
  useCordAnnotationTargetRef,
  useCordAnnotationCaptureHandler,
} from "@cord-sdk/react";

function VideoPlayerComponent({ videoSrc }) {
  // The initial location information for any annotations
  // users create.
  const location = { page: "dashboard", video: videoSrc };

  // A ref to apply to your video element. Cord will
  // use this ref when users create annotations, applying
  // the \`location\` object to the annotation.
  const videoElementRef = useCordAnnotationTargetRef(location);

  // The callback provided here will be used to enrich the
  // \`location\` data for the annotation. You would use
  // this hook when you want to put more specific location
  // information in the annotation. Here, for instance,
  // we're adding the current time of the video player
  // as extra \`location\` data.
  useCordAnnotationCaptureHandler(location, () => {
    return {
      extraLocation: {
        time: videoElementRef.current?.currentTime ?? 0,
      },

      // The \`label\` property is a special field. Setting
      // this value will change how the annotation is displayed
      // within Cord. Instead of showing the word "Annotation"
      // in Cord, the label provided here will be used. You
      // can use this to make annotation easier for your users
      // to understand and navigate.
      label: "Video: " + timestampToString(time),
    };
  });

  // The callback provided to this hook will receive the location
  // object associated with the annotation. This is the same
  // object that we constructed in the above code where we
  // combined the \`location\` object with the \`extraLocation\`
  // field in the \`useCordAnnotationCaptureHandler\` hook.
  useCordAnnotationRenderer(location, (annotationLocation) => {
    if (!videoElementRef.current) {
      // if the video element is for some reason not rendered yet,
      // don't show the annotation pin
      return;
    }

    // If the video player's current time isn't close to the
    // timestamp where the annotation was created, don't show
    // the annotation.
    if (
      annotationLocation.time < videoElementRef.current.currentTime - 2.5 &&
      annotationLocation.time > videoElementRef.current.currentTime + 2.5
    ) {
      return;
    }

    // If we made it here, we know that the annotation makes sense to show, so
    // we'll put in on the video player in the bottom right corner.
    return {
      coordinates: { x: "90%", y: "90%" },
      element: videoElementRef.current,
    };
  });

  return <video ref={videoElementRef} src={videoSrc} />;
}`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <H4>Only allow annotations on some parts of your page (Optional)</H4>
          <p>
            By default, the entire page can be annotated, which means the user
            can leave annotations on parts of the page that are irrelevant, like
            side navigation, top header, etc. You can control which parts of
            your page the user can place annotations on using the
            <code>data-cord-annotation-allowed</code> attribute.
          </p>
          <p>
            By adding <code>data-cord-annotation-allowed=false</code> on an
            element you can disable the annotation feature on that element and
            its entire DOM subtree.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'jsx',
                languageDisplayName: 'React',
                snippet: `<body>
  <div id="sidebar" data-cord-annotation-allowed="false">
    {/* Cord annotations are not allowed here */
  </div>
  <div id="content">
    {/*
        Cord annotations are allowed here because
        they are allowed by default
    */}
  </div>
</body>`,
              },
              {
                language: 'html',
                languageDisplayName: 'HTML',
                snippet: `<body>
  <div id="sidebar" data-cord-annotation-allowed="false">
    <!-- cord annotations are not allowed here -->
  </div>
  <div id="content">
    <!-- cord annotations are allowed here (by default) -->
  </div>
</body>`,
              },
            ]}
          />
          <p>
            Another use case is to disallow annotations on the entire document{' '}
            <strong>except for specific elements</strong>. You can do that by
            adding <code>data-cord-annotation-allowed=false</code> on a top
            element like &lt;body&gt; and then selectively enabling it on
            specific elements, with{' '}
            <code>data-cord-annotation-allowed=true</code>. In this case, you
            might want to screenshot only these elements. To do so, you can use
            the{' '}
            <Link to="/js-apis-and-hooks/screenshotconfig-api">
              ScreenshotConfig API
            </Link>
            .
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'jsx',
                languageDisplayName: 'React',
                snippet: `<body data-cord-annotation-allowed="false">
  {/* The line above disables annotations everywhere */}

  <div id="sidebar" />
  <div id="content" data-cord-annotation-allowed="true">
    {/*
       Cord annotations are allowed only on content
       within this <div> because it has the
       \`data-cord-annotation-allowed\` attribute
       explicitly set.
    */}
  </div>
</body>`,
              },
              {
                language: 'html',
                languageDisplayName: 'HTML',
                snippet: `<!--
  Cord annotations are not allowed on <body>
  or any of its children.
-->
<body data-cord-annotation-allowed="false">
  <div id="sidebar" />
  <div id="content" data-cord-annotation-allowed="true">
    <!--
       Cord annotations are allowed only on content
       within this <div> because it has the
       \`data-cord-annotation-allowed\` attribute
       explicitly set.
    -->
  </div>
</body>`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <H4>
            Respond in your application when an annotation is clicked (Optional)
          </H4>
          <p>
            When the user clicks an annotation in the sidebar or in a thread,
            you might need to change your app's state to show that annotation
            properly. For example, you may need to skip a video to the annotated
            timestamp, or fetch data for a chart within a specific date
            interval.
          </p>
          <p>
            Through the{' '}
            <Link to="/js-apis-and-hooks/annotations-api/#usecordannotationclickhandler">
              useCordAnnotationClickHandler
            </Link>{' '}
            hook you can provide a callback that will be called with the
            <code>AnnotationWithThreadID</code> object when the user clicks on
            the annotation pill in the message. You're not expected to return
            anything from the callback; it's just an event.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'tsx',
                languageDisplayName: 'React with TypeScript',
                snippet: `import {
  useCordAnnotationTargetRef,
  useCordAnnotationCaptureHandler,
} from "@cord-sdk/react";

type VideoPlayerAnnotation = {
  page: string;
  video: string;
  time: number;
};

function VideoPlayerComponent({ videoSrc }) {

  // The initial location information for any annotations
  // users create.
  const location = { page: "dashboard", video: videoSrc };

  // A ref to apply to your video element. Cord will
  // use this ref when users create annotations, applying
  // the \`location\` object to the annotation.
  const videoElementRef = useCordAnnotationTargetRef(location);

  // The callback provided here will be used to enrich the
  // \`location\` data for the annotation. You would use
  // this hook when you want to put more specific location
  // information in the annotation. Here, for instance,
  // we're adding the current time of the video player
  // as extra \`location\` data.
  useCordAnnotationCaptureHandler<VideoPlayerAnnotation>(location, () => {
    return {
      extraLocation: {
        time: videoElementRef.current?.currentTime ?? 0,
      },

      // The \`label\` property is a special field. Setting
      // this value will change how the annotation is displayed
      // within Cord. Instead of showing the word "Annotation"
      // in Cord, the label provided here will be used. You
      // can use this to make annotation easier for your users
      // to understand and navigate.
      label: "Video: " + timestampToString(time),
    };
  });

  // The callback provided to this hook will receive the location
  // object associated with the annotation. This is the same
  // object that we constructed in the above code where we
  // combined the \`location\` object with the \`extraLocation\`
  // field in the \`useCordAnnotationCaptureHandler\` hook.
  useCordAnnotationRenderer(location, (annotationLocation: VideoPlayerAnnotation) => {
    if (!videoElementRef.current) {
      // if the video element is for some reason not rendered yet,
      // don't show the annotation pin
      return;
    }

    // If the video player's current time isn't close to the
    // timestamp where the annotation was created, don't show
    // the annotation.
    if (
      annotationLocation.time < videoElementRef.current.currentTime - 2.5 &&
      annotationLocation.time > videoElementRef.current.currentTime + 2.5
    ) {
      return;
    }

    // This hook allows you to know when the user has clicked on a particular
    // annotation. You might use this to jump to a particular point in a video,
    // the scroll the page to a particular position, or otherwise change around
    // the UI to highlight what the user has shown interest in.
    useCordAnnotationClickHandler<VideoPlayerAnnotation>(
      location,
      (annotation) => {
        if (videoElementRef.current) {
          // Skip the video to the annotation timestamp and pause
          videoElementRef.current.currentTime = annotation.location.time;
          videoElementRef.current.pause();
        }
      }
    );

    // If we made it here, we know that the annotation makes sense to show, so
    // we'll put in on the video player in the bottom right corner.
    return {
      coordinates: { x: "90%", y: "90%" },
      element: videoElementRef.current,
    };
  });

  return <video ref={videoElementRef} src={videoSrc} />;
}`,
              },
              {
                language: 'jsx',
                languageDisplayName: 'React with JavaScript',
                snippet: `import {
  useCordAnnotationTargetRef,
  useCordAnnotationCaptureHandler,
} from "@cord-sdk/react";

function VideoPlayerComponent({ videoSrc }) {
  // The initial location information for any annotations
  // users create.
  const location = { page: "dashboard", video: videoSrc };

  // A ref to apply to your video element. Cord will
  // use this ref when users create annotations, applying
  // the \`location\` object to the annotation.
  const videoElementRef = useCordAnnotationTargetRef(location);

  // The callback provided here will be used to enrich the
  // \`location\` data for the annotation. You would use
  // this hook when you want to put more specific location
  // information in the annotation. Here, for instance,
  // we're adding the current time of the video player
  // as extra \`location\` data.
  useCordAnnotationCaptureHandler(location, () => {
    return {
      extraLocation: {
        time: videoElementRef.current?.currentTime ?? 0,
      },

      // The \`label\` property is a special field. Setting
      // this value will change how the annotation is displayed
      // within Cord. Instead of showing the word "Annotation"
      // in Cord, the label provided here will be used. You
      // can use this to make annotation easier for your users
      // to understand and navigate.
      label: "Video: " + timestampToString(time),
    };
  });

  // The callback provided to this hook will receive the location
  // object associated with the annotation. This is the same
  // object that we constructed in the above code where we
  // combined the \`location\` object with the \`extraLocation\`
  // field in the \`useCordAnnotationCaptureHandler\` hook.
  useCordAnnotationRenderer(location, (annotationLocation) => {
    if (!videoElementRef.current) {
      // if the video element is for some reason not rendered yet,
      // don't show the annotation pin
      return;
    }

    // If the video player's current time isn't close to the
    // timestamp where the annotation was created, don't show
    // the annotation.
    if (
      annotationLocation.time < videoElementRef.current.currentTime - 2.5 &&
      annotationLocation.time > videoElementRef.current.currentTime + 2.5
    ) {
      return;
    }

    // If we made it here, we know that the annotation makes sense to show, so
    // we'll put in on the video player in the bottom right corner.
    return {
      coordinates: { x: "90%", y: "90%" },
      element: videoElementRef.current,
    };
  });

    // This hook allows you to know when the user has clicked on a particular
    // annotation. You might use this to jump to a particular point in a video,
    // the scroll the page to a particular position, or otherwise change around
    // the UI to highlight what the user has shown interest in.
    useCordAnnotationClickHandler(
      location,
      (annotationWithThreadID) => {
        if (videoElementRef.current) {
          // Skip the video to the annotation timestamp and pause
          videoElementRef.current.currentTime = annotation.location.time;
          videoElementRef.current.pause();
        }
      }
    );

  return <video ref={videoElementRef} src={videoSrc} />;
}`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <H4>Ready!</H4>
          <p>Your app now supports rich, precise annotations.</p>
        </GuideStep>
      </StepByStepGuide>
      <HR />
    </Page>
  );
}
export default ImproveAnnotationAccuracy;
