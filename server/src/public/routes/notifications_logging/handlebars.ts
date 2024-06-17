import Handlebars from 'common/page_context/templating/handlebars.js';

export const errorRedirectTemplate = Handlebars.compile(`
<main style="margin: 32px 0; text-align: center; font-family: Helvetica, Arial, sans-serif; font-size: 24px;">
  <p><img src="{{imageURL}}" align="center" width="200" /></p>

  <p>Oops! Something went wrong :(</p>
</main>
`);
