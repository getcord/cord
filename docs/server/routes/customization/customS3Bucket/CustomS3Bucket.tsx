/** @jsxImportSource @emotion/react */

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

function CustomS3Bucket() {
  return (
    <Page
      pretitle="Customization"
      pretitleLinkTo="/customization"
      title="Set up a custom S3 bucket"
      pageSubtitle={{
        metaDescription:
          "To have Cord upload annotation screenshots to your own S3 bucket, you'll need to provide us with the bucket name and bucket region, as well as an access key ID and secret access key for an IAM User with read + write  + list permissions on that bucket. Follow this guide on how to get them.",
        element: (
          <>
            To have Cord upload annotation screenshots to your own S3 bucket,
            you'll need to provide us with the <strong>bucket name</strong> and{' '}
            <strong>bucket region</strong>, as well as an{' '}
            <strong>access key ID</strong> and{' '}
            <strong>secret access key</strong> for an IAM User with read + write
            + list permissions on that bucket. Follow this guide on how to get
            them.
          </>
        ),
      }}
      showTableOfContents={true}
    >
      <StepByStepGuide includesFinalStep={true}>
        <GuideStep>
          <H4>Create the S3 bucket</H4>
          <p>
            <img
              src="/static/images/1-create-bucket.png"
              alt="A screenshot of an AWS S3 bucket configuration form"
            />
          </p>
          <p>
            Go to{' '}
            <a href="https://s3.console.aws.amazon.com/s3/home">
              AWS Console - S3
            </a>{' '}
            and click the "Create bucket" button.
          </p>
          <p>
            Choose a name and a region for your bucket. Copy both of these
            values, as you will need them in future steps, as well as to send
            them to the Cord team.
          </p>
          <p>
            <strong>
              Make sure you leave the "Block all public access" ticked.
            </strong>{' '}
            If don't set this, your bucket is less secure.
          </p>
        </GuideStep>
        <GuideStep>
          <H4>Enable CORS</H4>
          <p>
            Open the details for the bucket you just created, navigate to the{' '}
            <strong>Permissions</strong> tab, then scroll down until you see the
            "<strong>Cross-origin resource sharing (CORS)</strong>" section.
          </p>
          <p>
            Click <strong>Edit</strong> paste this configuration object into the
            text area, then click <strong>Save</strong>.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'json',
                languageDisplayName: 'JSON',
                snippet: `[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"]
  }
]`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <H4>Create a custom IAM policy</H4>
          <p>
            <img
              src="/static/images/3-bucket-arn.png"
              alt="A screenshot of an AWS S3 configuration screen for creating a custom IAM policy"
            />
          </p>
          <p>
            Go to{' '}
            <a href="https://console.aws.amazon.com/iamv2/home#/policies">
              AWS Console - IAM Policies
            </a>{' '}
            and click the <strong>Create Policy</strong> button. Under Service
            choose <strong>S3</strong>.
          </p>
          <p>
            Under <strong>Actions &gt; Access Level</strong> tick the "Read" and
            "Write" permissions, as well as, in the "List" category, tick the
            "ListBucket" action.
          </p>
          <p>
            Next, click on <strong>Resources</strong> and it will open a list of
            restriction categories.
          </p>
          <p>
            First, limit <code>bucket</code> operations to the bucket, by
            clicking "Add ARN to restrict access" on the <strong>bucket</strong>{' '}
            row. In the popup that appears, write the bucket name and click
            "Add".
          </p>
          <p>
            Next, limit <code>object</code> operations to the bucket, by
            clicking "Add ARN to restrict access" on the <strong>object</strong>{' '}
            row. In the popup that appears, again write the bucket name, then
            tick the "Any" checkbox next to "Object name", and click "Add".
          </p>
          <p>
            Finally, give the policy a name like{' '}
            <code>S3ReadAndWriteToCordScreenshotsBucketOnly</code> and save it.
          </p>
        </GuideStep>
        <GuideStep>
          <H4>Create an IAM user</H4>
          <p>
            <img
              src="/static/images/6-iam-user.png"
              alt="A screenshot of an AWS configuration screen for creating am IAM user"
            />
          </p>
          <p>
            On the next page go to "Attach existing policies directly", search
            and select the newly created policy from step 2. Finish creating the
            user, leaving the defaults for the rest of the steps.
          </p>
          <p>
            Select the user from the user list. Click the "Security credentials"
            tab. Here you can manage access keys for the user. You will need two
            pieces of information from here:
          </p>
          <ul>
            <li>the Access Key ID</li>
            <li>the Secret Access Key</li>
          </ul>
          <p>
            (If you're doing this to rotate secrets, you will already see the
            old Access Key ID in the list).
          </p>
          <p>
            <img
              src="/static/images/8-iam-key.png"
              alt="A screenshot of an AWS configuration UI for setting the security credentials of an IAM user"
            />
          </p>
          <p>
            Click on "Create access key". This will open a popup with the{' '}
            <strong>access key ID</strong> and <strong>secret</strong>.
          </p>
          <p>
            <strong>
              Copy both of these values, as you will need to send them to the
              Cord team.
            </strong>
          </p>
          <p>
            <img
              src="/static/images/9-iam-key.png"
              alt="A screenshot of an AWS UI for creating an access key"
            />
          </p>
        </GuideStep>
        <GuideStep>
          <H4>Enter details in your project console</H4>
          <p>
            Now that you have the <strong>bucket name</strong>,{' '}
            <strong>bucket region</strong>, <strong>access key ID</strong>, and{' '}
            <strong>secret access key</strong> -- hang onto them.
          </p>
          <p>
            Go to the <a href="https://console.cord.com">Cord console</a>,
            select your project and go to the <strong>Advanced</strong> tab in
            the settings. Click on <strong>"Set Up Custom S3 Bucket"</strong>{' '}
            and add your details.
          </p>
          <p>
            <img
              src="/static/images/10-console.png"
              alt="A screenshot of the Cord console configuration screen for entering the S3 details"
              style={{ maxWidth: '650px' }}
            />
          </p>
          <EmphasisCard>
            <p>
              If you cannot see the "Set Up Custom S3 Bucket" button, please
              send an email or Slack message to your contact at cord so that
              they can activate this feature for you.
            </p>
            <p>
              Please do not send these values over email or Slack. Your contact
              at Cord will help you transfer them securely.
            </p>
          </EmphasisCard>
        </GuideStep>
        <GuideStep>
          <H4>Ready!</H4>
          <p>
            Now Cord will upload the screenshots to the S3 bucket you provided.
          </p>
        </GuideStep>
      </StepByStepGuide>
      <HR />
    </Page>
  );
}

export default CustomS3Bucket;
