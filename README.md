# The Cord Monorepo

This is the code and tools needed to run the Cord service.

# Running Locally

Use these instructions to run Cord locally, using only local resources (DB, Redis, etc).

Note: Cord has only routinely been run on MacOS and Linux distributions using `apt`. Nothing should be platform-specific, but instructions for other platforms are left as an exercise for the reader.

## Getting Set Up

### Dependencies

Before running Cord, you need to install some software.

- Install [Node and NPM](https://nodejs.org/en/download/package-manager)
- Install Docker ([Mac](https://docs.docker.com/desktop/install/mac-install/), [Linux](https://docs.docker.com/desktop/install/linux-install/))
- [Mac-only] Install [Homebrew](https://brew.sh/)
- Install `jq` (Mac: `brew install jq`, Linux: `apt install jq`)
- Postgres command line tools (Mac: `brew install libpq && brew link --force libpq`, Linux: `apt install postgresql-client`)

### Local Certificates

To connect over TLS to our local machine, we need to install a self-signed certificate.

Mac:

- Run `scripts/generate-localhost-certificates.sh` (which will use Homebrew to install `mkcert`)
- If you're using Firefox, set `security.enterprise_roots.enabled` to `true` in `about:config`

Linux:

- Install `mkcert` via `apt install mkcert`
- Run `scripts/generate-localhost-certificates.sh`

### Configuration

Run `scripts/generate-dotenv.cjs --include-secrets=false` to generate a `.env` file that contains configuration options for running the dev server.

## Running

Run `npm run local-dev` to start the local development environment.

### Local endpoints

- Docs: https://local.cord.com:8191
- Testbed/Playground: https://local.cord.com:8179/sdk/test/
- API: https://local.cord.com:8161
- Console: https://local.cord.com:8171

# Migrating Data from the Cord Platform

There are two steps to migrating your data from the Cord platform to your own self-hosted infrastructure: migrating the database data and migrating S3 data (such as message attachments).

In both cases, you need a [project management auth token](https://docs.cord.com/reference/authentication#Project-management-auth-token). This should be provided to the following APIs in an `Authorization` header.

## S3 Data

To copy your files from S3, first you need to configure an S3 bucket as described in steps 1 and 2 of the documentation for [configuring a custom S3 bucket](https://docs.cord.com/customization/s3-bucket). Then create a policy that allows at least the `PutObject` and `ListObjects` permissions to `arn:aws:iam::869934154475:role/radical-stack-prodServerLondonASGInstanceRole31491-P9EJBVI9CBCR` (our production server user) on both the bucket and every object in the bucket. The policy should look something like this:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::869934154475:role/radical-stack-prodServerLondonASGInstanceRole31491-P9EJBVI9CBCR"
            },
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::YOUR-S3-BUCKET-ID",
                "arn:aws:s3:::YOUR-S3-BUCKET-ID/*"
            ]
        }
    ]
}
```

Once that's done, contact someone at Cord, as we need also need to configure an IAM policy in our account to approve that same access.

After setting up the permissions, call `https://api.cord.com/v1/customer/copyfiles?region=YOUR-S3-REGION&bucket=YOUR-S3-BUCKET-ID`. The handler is an incremental copy that takes a `limit` parameter from 1 to 1000 (default 10) and attempts to copy that many files into your bucket, so you will likely have to run it more than once. Keep running it until it returns `{"copied":0}`, at which point all files are copied.

You can do this step at any point, and because it's incremental, you can run it before you're ready to switch to your own infrastructure and then run it again at the point of switchover to just copy over any new files that have been uploaded since.

## Database Migration

To migrate your database data, call `https://api.cord.com/v1/customer/dbdump`. This will product a SQL script that contains all of your data, ready to be run against an empty database via `psql --variable=ON_ERROR_STOP=1`. This will include all data for all of your projects. Be patient, it may take up to a minute or two to collect all of the data.

This data is obviously only valid as of the time the command is run, so you likely will want to use it to test out your migration process, then run it again right before switching to your own infrastructure so as to capture the most up-to-date data available.

# Running Cord Infrastructure Yourself

You can use the files in this repo to run Cord's infrastructure under your own AWS account. This is approximately the series of steps to get that up and running:

## Decide where to put everything and customize files

You need the following pieces of information:

- Your AWS account number (in this example, `1234567890`)
- The region you want to run in (in this example, `eu-central-1`)
- The domain you want everything to live under (in this example, `cord.example.com`)

Find at least the following files and replace all the references to the above three things with your values. These might be in constants, ARNs, etc. Use find-and-replace. (There are others, but this should be enough to get you up and running.)

- `package.json` (the `db-ssh-tunnel` and `db-ssh-tunnel-write` npm commands)
- `ops/aws/config/zero/cssh`
- `ops/aws/src/Config.ts`
- `ops/dockerfiles/server.Dockerfile`
- `ops/local-s3/create-buckets.sh`
- `scripts/connect-docker-to-aws-ecr.sh`
- `scripts/manual-deploy.sh`
- `scripts/ci/build-on-commit.sh`
- `scripts/lib/secrets.cjs`
- `server/src/config/Env.ts`

## Manually create some bootstrap items

In `us-east-1`, create certificates for `*.`, `*.staging.`, and `*.loadtest.` (eg, `*.staging.cord.example.com`). These are used for CloudFront, so they must be in `us-east-1` no matter what region you're running in.

Go find the default VPC for the region you're running in, along with its three default subnets. AWS creates these automatically for you in regions, and they need to be imported into the configs.

Create an RSA SSH key with `ssh-keygen -t rsa -b 4096 -C "your_email@example.com"`. Then in AWS, go to the My Security Credentials page and upload it under the "AWS CodeCommit credentials" section. This will be used for SSH access to the system. Also in IAM, give your user the tag `zeroAccount`: `yes` along with any other user you want to be able to SSH into the system.

## Customize AWS config

Update all the constants in `ops/aws/src/radical-stack/Config.ts` to set your domains, add ARNs for the certs and VPCs from the previous step, etc.

## Start up all the services

In `ops/aws`, do `npm install` and `npm run deploy`. This will take a long time as it brings up lots of services (databases, EC2 instances, etc.). If it fails, unfortunately CloudFormation is not able to rollback the creation of a bunch of these things, so you'll have to go in and delete them all manually or else the next attempt will fail because some of the objects already exist. (Hopefully it won't fail.)

(Your EC2 machines will immediately begin crashing and continually restarting because they don't yet have a server build available. That's okay.)

## SSH into zero

The host we use as an SSH bastion is named `zero`. Add a stanza to `~/.ssh/config` (creating it if necessary) that reads:

```
Host zero
  HostName zero.cord.example.com
  Port 28547
  User YOUR_AWS_USERNAME
  ForwardAgent yes
```

Then if it's been at least 15 minutes since you started zero (it fetches and installs SSH public keys for user accounts every 15 minutes), try to do `ssh zero`. It should drop you into a console. If so, congrats, you are now inside the virtual private network and things should work.

## Customize your .env

Go to `scripts/generate-dotenv.cjs` and edit the properties to adjust them to what you need. At the very least, you need to update the AWS region and cord.com-based hostnames. Also in the `buildProdEnv` function add `INCLUDE_SDK_TESTBED: '1'` at the end.

## Create the database

Run the following from your local machine:

```
$ npm run db-ssh-tunnel-write
$ PGPASSWORD="$(aws secretsmanager get-secret-value --secret-id database-prod-1 | jq -r '.SecretString | fromjson | .password')" createdb -h localhost -p 25432 -U ChuckNorris radical_db
$ PGPASSWORD="$(aws secretsmanager get-secret-value --secret-id database-prod-1 | jq -r '.SecretString | fromjson | .password')" psql -h localhost -p 25432 -U ChuckNorris -d radical_db

radical_db=> CREATE EXTENSION "uuid-ossp";
radical_db=> COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
```

## Build the servers the first time

On `zero`, do `cssh -l ubuntu build3`, which will connect you to the build machine. Clone the repo you're using (with all the changes from above), and then run `./scripts/ci/build-on-commit.sh`. This should build a version of the servers and tell you it's not going to automatically deploy them because of the heimdall settings, but will give you a command to run to push them manually (it starts with `scripts/manual-deploy.sh`).

Run the manual deploy command. It will fail to push because the servers are currently unhealthy, but that's okay. Once it finishes, the servers will pick up the new code on their next restart cycle and should come up properly.

Change the `staging` to `prod` in the command you ran and run it again. The same thing should happen, but the prod servers should be okay.

## Migrate your data

You should now have a running version of all the Cord infrastructure. You can follow the steps in the previous section of this README to migrate your DB and S3 data into the data storage.

## Set up your API keys

At this point, you can add API keys for any services you're using, such as SendGrid and LaunchDarkly. The keys are in SecretsManager under reasonably-well-described items, or you can look them up in `scripts/generate-dotenv.cjs`.

## Ready to go

Now you're ready to go. Any time you want to build new versions, you can log into the `build3` machine and run them yourself, or you can use the examples in `github_workflows` to run GitHub workflows to run things. (You'll need to set `INCLUDE_GITHUB_RUNNER` to `true` in `ops/aws/src/radical-stack/ec2/build3.ts` to get the GitHub Actions Runner running.)
