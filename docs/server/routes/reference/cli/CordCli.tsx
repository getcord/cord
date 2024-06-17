import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';

function InstallCordCLI() {
  return (
    <Page
      pretitle="Reference"
      pretitleLinkTo="/reference"
      title="Cord CLI tool"
      pageSubtitle="Interact with our REST API using our CLI tool"
    >
      <p>
        The Cord CLI tool allows you to interact with your data via our{' '}
        <Link to="/rest-apis">REST endpoints</Link> without having to manually
        authenticate each request.
      </p>
      {/* Need a note on what environments this works on. Definitely Node <= 20 & windows. Need to check others */}
      <section>
        <H4>Install the Cord CLI tool</H4>
        <p>Run the command below in your terminal:</p>
        <CodeBlock
          savePreferenceFor="server"
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'bash',
              snippet: `npm install -g @cord-sdk/cli`,
            },
          ]}
        />
      </section>
      <section>
        <H4>Initialize Cord</H4>
        <p>
          Before you get started calling our API we need to configure the tool
          to authenticate each request with your project.
        </p>
        <p>Run the command below in your terminal:</p>
        <CodeBlock
          savePreferenceFor="server"
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'bash',
              snippet: `cord init`,
            },
          ]}
        />
        <p>
          This will prompt you first for your project ID and secret. You can
          retrieve them from the{' '}
          <Link to="https://console.cord.com">console</Link> under the desired
          project entry.
        </p>
        <p>
          The customer ID and secret are only needed if you want to run project
          management commands. i.e., create, update or delete a project. These
          values can be found in the{' '}
          <Link to="https://console.cord.com">console</Link> under{' '}
          <code>View project management credentials</code>.
        </p>
        <p>
          You can update these values any time by re-running the{' '}
          <code>init</code> command.
        </p>
      </section>
      <section>
        <H4>Try it out!</H4>
        <p>You're ready to go!</p>
        <CodeBlock
          savePreferenceFor="server"
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'bash',
              snippet: `# see what commands there are:
cord --help
# try one out:
cord user ls
              `,
            },
          ]}
        />
      </section>
      <section>
        <H4>Where to find help?</H4>
        <p>
          To check out how to format the commands and what options are available
          you can run <code>--help</code> at any level of a command. This will
          show you what commands and options are available, and what data is
          needed to make the request.
        </p>
        <p>
          If you prefer to use cURL syntax but would like to benefit from our
          automatic authentication, then you can use{' '}
          <code>cord curl application -- &lt;request&gt;</code> for application
          management commands, and <code>cord curl -- &lt;request&gt;</code> for
          all others.
        </p>
        <p>
          For more detailed documentation on the requests the command makes and
          the options it takes you can refer to the{' '}
          <Link to="/rest-apis">REST API docs</Link> where you'll also be able
          to see examples of how to call the commands.
        </p>
      </section>
    </Page>
  );
}

export default InstallCordCLI;
