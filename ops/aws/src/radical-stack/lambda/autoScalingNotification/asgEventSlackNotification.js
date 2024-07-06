const https = require('https');

const handler = async (input) => {
  console.log(input.Records[0].Sns);

  let message;
  const rawMessage = JSON.parse(input.Records[0].Sns.Message).Cause;
  if (!rawMessage) {
    // Some messages don't contain a `Clause`, in which case we don't send a
    // notificatio
    return;
  }
  if (rawMessage.includes('instance refresh')) {
    // instance refreshes are triggered by us -
    // we don't need a slack notification for this
    return;
  }
  if (
    rawMessage.includes('TargetTracking') &&
    rawMessage.includes('changing the desired capacity')
  ) {
    // The ASG is adding/removing a server because the target tracking metric has
    // asked it to - the message is a bit repetitious so just send the 2nd sentence
    message = rawMessage.split('.')[1];
  } else {
    message = rawMessage;
  }

  const subject = input.Records[0].Sns.Subject;

  // Find your Slack app's incoming webhook HRL by going to "Incoming Webhooks"
  // in your app's settings on https://api.slack.com/apps
  const path = '<YOUR SLACK WEBHOOK URL HERE>'; // looks like /services/T.../B.../...
  const slackMessage = {
    text: subject,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: subject,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ],
  };

  await post(slackMessage, path);
};

const post = (message, path) =>
  new Promise((resolve, reject) => {
    const options = {
      host: 'hooks.slack.com',
      port: '443',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let buffer = '';
      res.on('data', (chunk) => (buffer += chunk));
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', (e) => reject(e.message));
    req.write(JSON.stringify(message));
    req.end();
  });

exports.handler = handler;
