#!/usr/bin/env -S node --enable-source-maps

/**
 * Use this script to test sending emails via our SendGrid account.
 *
 * For example, one thing you mgiht find this script useful for is validating
 * that you've correctly added support for a new email domain. So e.g. when
 * you've added somecustomer.com as a supported domain in our Sendgrid account,
 * you can use this script to send an email *from* someaddress@somecustomer.com
 * and verify that it arrives. (If the domain is misconfigured in Sendgrid, the
 * call to the Sendgrid API will fail and the script will print an error.)
 *
 *     ./scripts/send-mail.ts \
 *         --to <your username>@cord.com \
 *         --from foo@somecustomer.com
 */

import path from 'path';
import url from 'url';
import yargs from 'yargs';
import * as sgMail from '@sendgrid/mail';
import 'dotenv/config.js';
import env from 'server/src/config/Env.ts';

const argv = yargs(process.argv.slice(2)).option({
  to: {
    description: 'email address to send to',
    type: 'string',
    demandOption: true,
  },
  from: {
    description: 'email address to send from',
    type: 'string',
    default: 'test@cord.fyi',
  },
  message: {
    description: 'message to send',
    type: 'string',
    default: `This is a test email from ${path.basename(
      url.fileURLToPath(import.meta.url),
    )}`,
  },
  subject: {
    description: 'subject of the email',
    type: 'string',
    default: `Test email`,
  },
}).argv;

if (!argv.to.endsWith('@cord.com')) {
  console.error('Please use a @cord.com email address for the to field');
  process.exit(1);
}

sgMail.default.setApiKey(env.SENDGRID_API_KEY);
sgMail.default
  .send({
    to: argv.to,
    from: argv.from,
    subject: argv.subject,
    text: argv.message,
  })
  .then(
    () => process.exit(0),
    (err) => {
      console.error(JSON.stringify(err, null, 2));
      process.exit(1);
    },
  );
