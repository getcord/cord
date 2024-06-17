import json
import requests

from src.server.server import get_server_auth_token
from src.types.types import PlatformUserVariables, PlatformOrganizationVariables

CORD_ENDPOINT = "https://api.cord.com/v1/"

# This file includes code samples for syncing
# users and organizations with Cord.
# Take a look at: https://docs.cord.com/rest-apis
# for all our available REST APIs


def toJson(obj):
    return json.dumps(obj, default=lambda o: dict((key, value) for key, value in o.__dict__.items() if value),
                      indent=4,
                      allow_nan=False)


class CordClient:
    def __init__(self, app_id, secret):
        self.app_id = app_id
        self.secret = secret

    def sync_cord_user(self, user: PlatformUserVariables):
        auth_token: str = get_server_auth_token(self.app_id, self.secret)
        userId = user.id
        delattr(user, "id")

        headers = {
            "Authorization": "Bearer {}".format(auth_token),
            "Content-Type": "application/json"
        }
        response = requests.put(
            CORD_ENDPOINT + "users/" + userId, headers=headers, data=toJson(user))

        return response.json()

    def sync_cord_organization(self, organization: PlatformOrganizationVariables):
        auth_token: str = get_server_auth_token(self.app_id, self.secret)
        orgId = organization.id
        delattr(organization, "id")

        headers = {
            "Authorization": "Bearer {}".format(auth_token),
            "Content-Type": "application/json"
        }
        response = requests.put(CORD_ENDPOINT + "organizations/" +
                                orgId, headers=headers, data=toJson(organization))

        return response.json()

    def batch_sync_cord_users_and_organizations(self, users: list[PlatformUserVariables], organizations: list[PlatformOrganizationVariables]):
        auth_token: str = get_server_auth_token(self.app_id, self.secret)

        headers = {
            "Authorization": "Bearer {}".format(auth_token),
            "Content-Type": "application/json"
        }
        request_body = "{{ \"organizations\": {}, \"users\": {} }}".format(
            toJson(organizations), toJson(users))
        response = requests.post(
            CORD_ENDPOINT + "batch", headers=headers, data=request_body)

        return response.json()
