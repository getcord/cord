import { Link } from 'react-router-dom';
import HR from 'docs/server/ui/hr/HR.tsx';
import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import { jsApisAndHooksCardList } from 'docs/server/routes/apisAndHooks/jsApisAndHooksCardList.ts';

function ApisAndHooks() {
  return (
    <Page
      title="JavaScript APIs & Hooks"
      pageSubtitle={`Lower level APIs for for building user experiences the components don't cover`}
    >
      <p>
        We supply a client-side JavaScript API to access some of the underlying
        data that backs our features. These are functions on the{' '}
        <code>window.CordSDK</code> object, organized into themed libraries. For
        instance, functions to access presence information are located under{' '}
        <code>window.CordSDK.presence</code>. You can use these functions with
        or without also using our <Link to="/components">components</Link>.
      </p>
      <p>
        We recommend trying to use the components first, as they cover most
        common use cases, and then using these APIs to cover any uncommon cases
        your application might need.
      </p>
      <HR />
      <IndexCardTiles cardList={jsApisAndHooksCardList} />
      <HR />
      <NextUp>
        <NextUpCard
          linkTo="/get-started/integration-guide"
          title="Build your integration"
        >
          Integrate Cord components with your app
        </NextUpCard>
        <NextUpCard linkTo="/components" title="Components">
          Pick components for your app
        </NextUpCard>
        <NextUpCard
          linkTo="/get-started/demo-apps"
          title="Check out some demo apps"
        >
          Find out how you can use different components
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default ApisAndHooks;
