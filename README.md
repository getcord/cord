# The Cord Monorepo

This is the code and tools needed to run the Cord service.

# Running Locally

Use these instructions to run Cord locally, using only local resources (DB, Redis, etc).

Note: Cord has only routinely been run on MacOS and Linux distributions using `apt`.  Nothing should be platform-specific, but instructions for other platforms are left as an exercise for the reader.

## Getting Set Up

### Dependencies

Before running Cord, you need to install some software.

* Install [Node and NPM](https://nodejs.org/en/download/package-manager)
* Install Docker ([Mac](https://docs.docker.com/desktop/install/mac-install/), [Linux](https://docs.docker.com/desktop/install/linux-install/))
* [Mac-only] Install [Homebrew](https://brew.sh/)
* Install `jq` (Mac: `brew install jq`, Linux: `apt install jq`)
* Postgres command line tools (Mac: `brew install libpq && brew link --force libpq`, Linux: `apt install postgresql-client`)

### Local Certificates

To connect over TLS to our local machine, we need to install a self-signed certificate.

Mac:

* Run `scripts/generate-localhost-certificates.sh` (which will use Homebrew to install `mkcert`)
* If you're using Firefox, set `security.enterprise_roots.enabled` to `true` in `about:config`

Linux:

* Install `mkcert` via `apt install mkcert`
* Run `scripts/generate-localhost-certificates.sh`

### Configuration

Run `scripts/generate-dotenv.cjs --include-secrets=false` to generate a `.env` file that contains configuration options for running the dev server.

## Running

Run `npm run local-dev` to start the local development environment.

### Local endpoints

* Docs: https://local.cord.com:8191
* Testbed/Playground: https://local.cord.com:8179/sdk/test/
* API: https://local.cord.com:8161
* Console: https://local.cord.com:8171

# Migrating from the Cord Platform

There are two steps to migrating your data from the Cord platform to your own self-hosted infrastructure: migrating the database data and migrating S3 data (such as message attachments).

In both cases, you need a [project management auth token](https://docs.cord.com/reference/authentication#Project-management-auth-token).  This should be provided to the following APIs in an `Authorization` header.

## S3 Data

To copy your files from S3, first you need to configure an S3 bucket as described in steps 1 and 2 of the documentation for [configuring a custom S3 bucket](https://docs.cord.com/customization/s3-bucket).  Then create a policy that allows at least the `PutObject` and `ListObjects` permissions to `arn:aws:iam::869934154475:role/radical-stack-prodServerLondonASGInstanceRole31491-P9EJBVI9CBCR` (our production server user) on both the bucket and every object in the bucket.  The policy should look something like this:

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

After setting up the permissions, call `https://api.cord.com/v1/customer/copyfiles?region=YOUR-S3-REGION&bucket=YOUR-S3-BUCKET-ID`.  The handler is an incremental copy that takes a `limit` parameter from 1 to 1000 (default 10) and attempts to copy that many files into your bucket, so you will likely have to run it more than once.  Keep running it until it returns `{"copied":0}`, at which point all files are copied.

You can do this step at any point, and because it's incremental, you can run it before you're ready to switch to your own infrastructure and then run it again at the point of switchover to just copy over any new files that have been uploaded since.

## Database Migration

To migrate your database data, call `https://api.cord.com/v1/customer/dbdump`.  This will product a SQL script that contains all of your data, ready to be run against an empty database via `psql`.  This will include all data for all of your projects.  Be patient, it may take up to a minute or two to collect all of the data.

This data is obviously only valid as of the time the command is run, so you likely will want to use it to test out your migration process, then run it again right before switching to your own infrastructure so as to capture the most up-to-date data available.
