import Handlebars from 'common/page_context/templating/handlebars.js';

Handlebars.registerHelper(
  'equals',
  (stringOne: string, stringTwo: string) => stringOne === stringTwo,
);

// Anything in {{!-- is a comment --}}
export const demoRedirectTemplate = Handlebars.compile(`
<main style="margin: 32px 16px; text-align: center; font-family: Helvetica, Arial, sans-serif; font-size: 24px;">
  <p><img src="{{imageURL}}" align="center" width="200" /></p>

  <h3 style="font-weight: bold;font-size: 18px; margin: 16px 0px">Notifications Info</h3>
  <pre style="
    text-align: left; 
    font-size: 16px; 
    line-height:24px; 
    background-color: #FBE3D6;
    border-radius: 4px;
    padding: 16px 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    "
  >
    <code>
    {
      "notificationInfo": {{notificationInfo}}
      "iat": {{iat}} ({{iatParsed}})
    }
    </code>
  </pre>
</main>
`);
