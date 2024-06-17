#!/bin/sh

# Script to reset your password for our oncall system https://oncall.cord.com/
# Should it fail, make sure that you can `ssh zero` and then from zero
# you need to be able to `cssh monitoring`.  It is likely that one of those 
# is not working if it fails

set -e

PASSWORD="$(LC_ALL=C tr -dc A-Za-z0-9 </dev/urandom | head -c 32 ; echo '')"
SALT="$(LC_ALL=C tr -dc A-Za-z0-9 </dev/urandom | head -c 32 ; echo '')"
HASH="$(/bin/echo -n ${SALT}:${PASSWORD} | shasum -a 256 | cut -f 1 -d ' ')"
USERNAME="$(aws iam get-user | jq -r '.User.UserName')"

ssh zero <<OUTEREOF
cssh monitoring <<INNEREOF
docker exec -i mysql bash <<INNERINNEREOF
/usr/bin/mysql -uroot -pquVCYmirvoC0xn1v44GG --database oncall <<WTFEOF
replace into password (id, password) select id, '${SALT}:${HASH}' from user where name = '${USERNAME}';
WTFEOF
INNERINNEREOF
INNEREOF
OUTEREOF

echo "New password for user ${USERNAME}: ${PASSWORD}"
