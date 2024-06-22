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

