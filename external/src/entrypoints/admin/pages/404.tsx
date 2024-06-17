import { Helmet } from 'react-helmet';
import { Text } from 'external/src/components/ui/Text.tsx';

export function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page not found</title>
      </Helmet>
      <Text>Page not found</Text>
    </>
  );
}
