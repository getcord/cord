#!/bin/bash -e

DEBUG=""
FAST=0
while getopts ":df" opt
do
  case "$opt" in
    d)
      DEBUG="--minify=false"
      ;;
    f)
      FAST=1
      ;;
  esac
done

shift $((OPTIND-1))

# get absolute path of monorepo root
MONOREPO_ROOT="$(realpath "$(dirname $0)"/..)"
# CORD_BUILD_OUTPUT may be used to set where the build output goes within
# monorepo, defaults to "dist"
BUILD_DIR="$MONOREPO_ROOT"/"${CORD_BUILD_OUTPUT:-dist}"

# Load env file
cd "$MONOREPO_ROOT"
. "${DOTENV_CONFIG_PATH:-.env}"

# export what is used by the vite build script
export API_SERVER_HOST
export APP_SERVER_HOST

function build_sample_app() {
    app="$1"

    echo
    echo "==== $app ==="
    echo

    cd "$MONOREPO_ROOT"/opensource/sample-apps/"$app"

    if [ "$FAST" -ne 1 ]
    then
      npm ci
      npx tsc --noEmit
    fi

    npx vite build \
        --outDir "$BUILD_DIR"/external/playground/"$app" \
        --base /playground/"$app"/ \
        --emptyOutDir \
        "$DEBUG" \
        --config src/CORD-playground/vite.config.ts
}

echo "Building demo apps in parallel (output will be overlapped)."

# build demo apps for playground
defapps=(dashboard canvas-new video-player document)
pids=()
for app in "${@:-${defapps[@]}}"
do
    build_sample_app "$app" &
    pids+=($!)
done

error=0
for pid in ${pids[*]}
do
    if ! wait $pid
    then
        error=1
    fi
done

exit "$error"
