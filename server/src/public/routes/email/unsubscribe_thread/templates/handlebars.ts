import Handlebars from 'common/page_context/templating/handlebars.js';

export const unsunscribeFromThreadPageTemplate = Handlebars.compile(`
<main style="margin: 32px 0; text-align: center; font-family: Helvetica, Arial, sans-serif; font-size: 24px;">
  <p><img src="{{Image_URL}}" align="center" width="200" /></p>

  <p>To unsubscribe, please click the button below.</p>

  <form method="post">
    <button type="submit" style="padding: 16px 24px; background-color: #191A1E; color: #FFFFFF; font-size: 24px; border-style: none; border-radius: 8px;  cursor: pointer;">Unsubscribe from thread</button>
  <form>

</main>
`);

export const successTemplate = Handlebars.compile(`
<p style="margin: 32px 0; text-align: center"><img src="{{Image_URL}}" align="center" width="200" /></p>

<p style="margin: 32px 0; text-align: center; font-size: 24px; font-family: Helvetica, Arial, sans-serif;">You've been unsubscribed from the thread.</p>
`);

export const errorTemplate = Handlebars.compile(`
<p style="margin: 32px 0; text-align: center; font-size: 24px; font-family: Helvetica, Arial, sans-serif;">There was an error unsubscribing you from the thread.</p>
`);
