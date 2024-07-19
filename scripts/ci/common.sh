# Common functions for CI scripts

ACCELERATE_DEPLOY="${ACCELERATE_DEPLOY:-false}"

announce_build_step () {
    # Print a few blank lines and then a nice header that should be easy to
    # spot in the logs.
    timestamp="$(TZ=UTC date +"%Y-%m-%d %H:%M:%S.%N")"
    echo
    echo
    echo
    echo "==================================================================="
    echo "  $*"
    echo "================================( $timestamp )=="
    echo
}

build_targets () {
    ./build/index.mjs --mode=production --target="$*" --clean
}

clean_up_and_build () {
    local tiers_to_build="$1"
    docker_build_opts=()

    announce_build_step "Cleanup the environment"
    # Delete all files and directories that are not checked into Git. This includes
    # `node_modules` and `dist` directories, but also leftover `.env` files.
    git clean -fdx

    # Typecheck our opensource packages first. For unknown reason typechecking
    # fails if done after "npm ci" is run in monorepo/
    announce_build_step "Install dependencies of and typecheck our opensource packages"
    ( cd opensource/sdk-js && npm ci && npm run tsc-packages && npm run test )

    announce_build_step "Cleanup the environment again"
    # Clean-up any files that the previous step has left behind (like
    # node_modules within opensource/sdk-js)
    git clean -fdx

    announce_build_step "npm ci"
    npm --platform=linuxmusl ci

    announce_build_step "Run TypeScript"
    npm run tsc-once

    mkdir -p config

    for tier in $tiers_to_build
    do
        announce_build_step "Generate .env file ($tier)"
        node ./scripts/generate-dotenv.cjs --tier="$tier" --envFile=config/"$tier"

        announce_build_step "Build targets for $tier tier"
        rm -f .env
        cp config/"$tier" .env
        CORD_BUILD_OUTPUT=dist/"$tier" build_targets external,admin,consoleReactApp,playground,docsClient

        announce_build_step "Build demo-apps for $tier tier"
        CORD_BUILD_OUTPUT=dist/"$tier" npm run build-demo-apps
    done

    announce_build_step "Build tier-agnostic targets"
    # For building server bundles, we only need the SENTRY_RELEASE field from
    # the config
    grep '^SENTRY_RELEASE=' <config/prod >.env
    CORD_BUILD_OUTPUT=dist/generic build_targets server,asyncWorker,docsServer,scripts

    announce_build_step "docker build"

    git_commit_hash="$(git rev-parse HEAD 2>/dev/null || true)"
    if test "$git_commit_hash"
    then
        docker_build_opts+=(--label com.cord.git-commit-hash="$git_commit_hash")
    fi

    git_commit_title="$(git log --format=%s -n 1 HEAD 2>/dev/null || true)"
    if test "$git_commit_title"
    then
        docker_build_opts+=(--label com.cord.git-commit-title="$git_commit_title")
    fi

    package_version="$(jq -r .version <package.json 2>/dev/null || true)"
    if test "$package_version"
    then
        docker_build_opts+=(--label com.cord.version="$package_version")
    fi

    docker build -f ops/dockerfiles/server.Dockerfile \
        --pull \
        "${docker_build_opts[@]}" \
        -t "$CORD_SERVER_DOCKER_IMAGE_NAME" .

    if [ "$ACCELERATE_DEPLOY" == "true" ]
    then
        announce_build_step "Skipping tests because ACCELERATE_DEPLOY is true"
    else
        announce_build_step "Run tests"
        docker run --rm=true --net=host -e CORD_TIER=test \
            "$CORD_SERVER_DOCKER_IMAGE_NAME" \
            npm run test -- --maxWorkers=75%
    fi
}

upload_sourcemaps () {
    announce_build_step "Upload sourcemaps to Sentry"
    (
    export PATH="$(pwd)/node_modules/.bin":"$PATH"
    export SENTRY_AUTH_TOKEN="$(
        aws secretsmanager get-secret-value --secret-id sentry-build-script | \
        jq -r '.SecretString' | \
        jq -r '.token'
    )"

    # Upload source maps. The build script has put files names "*.upload" into
    # dist/TIER/sourcemaps/PROJECT folders, containing shell command lines to do the
    # upload.
    for upload_file in dist/*/sourcemaps/*/*.upload
    do
    # Skip if "$upload_file" is not the name of an existing file
    test -f "$upload_file" || continue

    # Print this out on both stdout and stderr, so we see this in both logs
    echo "Executing $upload_file..." | tee /dev/stderr

    # The upload scripts contain relative paths, so we invoke them by changing
    # into the directory in which they are and run them there
    ( cd "$(dirname "$upload_file")" && sh "$(basename "$upload_file")" )
    done

    # If and when we connect Sentry to our source code repository:
    # eval "export $(grep ^SENTRY_RELEASE= config/prod)"
    # sentry-cli releases set-commits "$SENTRY_RELEASE" --auto
    )
}

update_git_tag () {
    tier="$1"
    commit_hash="$2"
    # third argument (package_version) is optional
    package_version="${3:-}"

    git push --no-verify --force origin "$commit_hash":refs/tags/"$tier" || true

    # When pushing to prod, also create a unique tag for this prod push and
    # create a GitHub release with it
    if test prod = "$tier"
    then
        timestamp="$(TZ=UTC date +%Y-%m-%d-%H%M)"
        tag="prod-push/$timestamp${package_version:+-v$package_version}"
        curl \
            -X POST \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer $GITHUB_TOKEN"\
            -H "X-GitHub-Api-Version: 2022-11-28" \
            https://api.github.com/repos/"$GITHUB_REPOSITORY"/releases \
            -d "{
                \"tag_name\":\"$tag\",
                \"target_commitish\":\"$commit_hash\",
                \"name\":\"$tag\",
                \"body\": \"Release created automatically by prod push on $timestamp\"
            }"
    fi
}
