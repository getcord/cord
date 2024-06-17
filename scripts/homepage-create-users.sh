#!/bin/bash

# This script creates the always-present users referenced in
# server/src/public/routes/warm-demo-users/HomepageDemoUser.ts.  You can set the
# API_HOST env variable to choose what server it talks to (for instance, set it
# to api.cord.com to update the users in production), otherwise it talks to your
# local dev instance.

set -e

HOST="${API_HOST:-local.cord.com:8161}"

cd "$(dirname $0)/.."

curl https://${HOST}/v1/users/khadija -X PUT --oauth2-bearer $(./dist/scripts/generate-application-auth-token.js --app 29e6499a-bbed-4eb2-b057-b36d60ad76c9) --json '{"name": "Khadija", "profilePictureURL": "https://app.cord.com/static/Khadija.png"}'
echo
curl https://${HOST}/v1/users/myhoa -X PUT --oauth2-bearer $(./dist/scripts/generate-application-auth-token.js --app 29e6499a-bbed-4eb2-b057-b36d60ad76c9) --json '{"name": "My Hoa", "profilePictureURL": "https://app.cord.com/static/MyHoa.png"}'
echo
curl https://${HOST}/v1/users/nimrod -X PUT --oauth2-bearer $(./dist/scripts/generate-application-auth-token.js --app 29e6499a-bbed-4eb2-b057-b36d60ad76c9) --json '{"name": "Nimrod", "profilePictureURL": "https://app.cord.com/static/Nimrod.png"}'
echo
curl https://${HOST}/v1/users/sam -X PUT --oauth2-bearer $(./dist/scripts/generate-application-auth-token.js --app 29e6499a-bbed-4eb2-b057-b36d60ad76c9) --json '{"name": "Sam", "profilePictureURL": "https://app.cord.com/static/Sam.png"}'
echo
curl https://${HOST}/v1/users/tom -X PUT --oauth2-bearer $(./dist/scripts/generate-application-auth-token.js --app 29e6499a-bbed-4eb2-b057-b36d60ad76c9) --json '{"name": "Tom", "profilePictureURL": "https://app.cord.com/static/Tom.png"}'
echo
curl https://${HOST}/v1/users/zora -X PUT --oauth2-bearer $(./dist/scripts/generate-application-auth-token.js --app 29e6499a-bbed-4eb2-b057-b36d60ad76c9) --json '{"name": "Zora", "profilePictureURL": "https://app.cord.com/static/Zora.png"}'
echo
