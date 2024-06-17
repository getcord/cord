import { format } from 'url';
import { cleanupURL } from 'common/page_context/util.ts';
import {
  CORD_DEEP_LINK_MESSAGE_QUERY_PARAM,
  CORD_DEEP_LINK_THREAD_QUERY_PARAM,
} from 'common/util/index.ts';

test('test URL sanitization does not change URL in unexpected way', () => {
  // test with/without deeplink/other query params. Make sure the non-cord
  // query params remain and that they are not re-ordered (since re-ordering
  // query params changes the url and thus could change the pageContext hash)
  const testCases = [
    {
      input: 'https://admin.typeform.com/',
      want: 'https://admin.typeform.com/',
    },
    {
      input: 'https://admin.typeform.com/?foo=bar',
      want: 'https://admin.typeform.com/?foo=bar',
    },
    {
      input: `https://admin.typeform.com/?foo=bar&${CORD_DEEP_LINK_THREAD_QUERY_PARAM}=threadID&${CORD_DEEP_LINK_MESSAGE_QUERY_PARAM}=messageID`,
      want: 'https://admin.typeform.com/?foo=bar',
    },
    {
      input: `https://admin.typeform.com/?${CORD_DEEP_LINK_THREAD_QUERY_PARAM}=threadID&${CORD_DEEP_LINK_MESSAGE_QUERY_PARAM}=messageID`,
      want: 'https://admin.typeform.com/',
    },
    {
      input: `https://admin.typeform.com/?${CORD_DEEP_LINK_THREAD_QUERY_PARAM}=threadID&${CORD_DEEP_LINK_MESSAGE_QUERY_PARAM}=messageID&foo=bar`,
      want: 'https://admin.typeform.com/?foo=bar',
    },
    {
      input: `https://admin.typeform.com/?bar=baz&${CORD_DEEP_LINK_THREAD_QUERY_PARAM}=threadID&${CORD_DEEP_LINK_MESSAGE_QUERY_PARAM}=messageID&foo=bar`,
      want: 'https://admin.typeform.com/?bar=baz&foo=bar',
    },
    {
      input: `https://admin.typeform.com/?foo=baz&${CORD_DEEP_LINK_THREAD_QUERY_PARAM}=threadID&${CORD_DEEP_LINK_MESSAGE_QUERY_PARAM}=messageID&bar=bar`,
      want: 'https://admin.typeform.com/?foo=baz&bar=bar',
    },
    {
      input: `https://admin.typeform.com/?bar=baz&foo=bar&${CORD_DEEP_LINK_THREAD_QUERY_PARAM}=threadID&${CORD_DEEP_LINK_MESSAGE_QUERY_PARAM}=messageID`,
      want: 'https://admin.typeform.com/?bar=baz&foo=bar',
    },
    {
      input: `https://admin.typeform.com/?foo=baz&bar=bar&${CORD_DEEP_LINK_THREAD_QUERY_PARAM}=threadID&${CORD_DEEP_LINK_MESSAGE_QUERY_PARAM}=messageID`,
      want: 'https://admin.typeform.com/?foo=baz&bar=bar',
    },
    {
      input: 'https://admin.typeform.com/#thisIsAHash',
      want: 'https://admin.typeform.com/#thisIsAHash',
    },
    {
      input: 'https://admin.typeform.com/?foo=bar#thisIsAHash',
      want: 'https://admin.typeform.com/?foo=bar#thisIsAHash',
    },
    {
      input: `https://admin.typeform.com/?foo=bar&${CORD_DEEP_LINK_THREAD_QUERY_PARAM}=threadID&${CORD_DEEP_LINK_MESSAGE_QUERY_PARAM}=messageID#thisIsAHash`,
      want: 'https://admin.typeform.com/?foo=bar#thisIsAHash',
    },
  ];
  for (const { input, want } of testCases) {
    const output = format(cleanupURL(input));
    expect(output).toEqual(want);
  }
});
