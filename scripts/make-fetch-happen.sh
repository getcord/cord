#!/bin/bash -eu

# Make fetch happen:
# - updates `origin/master` from the central repository
# - rebases all your local branches on origin/master (or as close to it as
#   possible without conflicts)
# - runs `npm install` if necessary (i.e. if package-lock.json changed)
# - runs `scripts/generate-dotenv.cjs` if that script has changed or there is
#   no existing .env file
# - runs `npm run migrate` if necessary (i.e. if something in `database/`
#   changed)

# While this script runs, it might update your local Git checkout... would be
# weird if that changes the contents of the script (because it got updated on
# master) while it's running. We can protect against that by putting
# parentheses around it. Then bash has to read all of the script to parse it
# before it starts executing.
(
if ! which rephresh &>/dev/null
then
cat >&2 <<'EOF'
❌ Too bad: you don't have the `rephresh` tool installed.

On a Mac, go to `https://github.com/getcord/rephresh/releases` in your browser.
You must be signed into GitHub, because this is a private repository. Download
the `rephresh-mac.tar.gz` file of the latest release, then do:
# sudo tar vxzf rephresh-mac.tar.gz -C /usr/local/bin
# sudo xattr -d com.apple.quarantine /usr/local/bin/rephresh
That should get you started!
EOF
exit 1
fi

git fetch origin '+refs/heads/*:refs/remotes/origin/*' '+refs/tags/*:refs/tags/*'
echo "✅ git fetch origin"

old_package_lock_sha1="$(git rev-parse HEAD:package-lock.json)"
old_generate_dotenv="$(git rev-parse HEAD:scripts/generate-dotenv.cjs)"
old_database_sha1="$(git rev-parse HEAD:database)"

if ! rephresh
then
cat >&2 <<'EOF'

❌ The `rephresh` tool failed to do its thing.

This probably means that you have local changes in some files that were also
changed in origin/master in the meantime. Try `git stash`, then run this script
and then do `git stash pop`.
EOF
exit 1
fi

echo "✅ Rebased branches where possible"

new_package_lock_sha1="$(git rev-parse HEAD:package-lock.json)"
new_generate_dotenv="$(git rev-parse HEAD:scripts/generate-dotenv.cjs)"
new_database_sha1="$(git rev-parse HEAD:database)"

if test "$old_package_lock_sha1" = "$new_package_lock_sha1"
then
    echo '✅ package-lock.json file unchanged - no need to run `npm install`'
else
    npm install
    echo '✅ `npm install` complete'
fi

if test -f .env && test "$old_generate_dotenv" = "$new_generate_dotenv"
then
    echo '✅ generate-dotenv script unchanged - no need to run'
else
    scripts/generate-dotenv.cjs
    echo '✅ `scripts/generate-dotenv.cjs` complete'
fi

if test "$old_database_sha1" = "$new_database_sha1"
then
    echo '✅ database directory unchanged - no need to run `npm run migrate`'
else
    npm run migrate
    echo '✅ `npm run migrate` complete'
fi

exit 0
)

