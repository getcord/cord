from enum import Enum
import json
import warnings
from typing import Union, Dict


class Status(Enum):
    ACTIVE = "active"
    DELETED = "deleted"


class PlatformUserVariables:
    """
    https://docs.cord.com/rest-apis/users/

    Parameters
    ----------
    id : str
        The ID for the user
    email : str, default None
        Email address of the user
    name : str, default None
        Full user name
    short_name : str, default None
        Short user name. In most cases, this will be preferred over name when set.
    status : Union[str, Literal['active', 'deleted']]
    profilePictureURL : str, default None
        This must be a valid URL, which means it needs to follow the usual URL
        formatting and encoding rules. For example, any space character will need
        to be encoded as `%20`. We recommend using your programming language's
        standard URL encoding function, such as `encodeURI` in Javascript.
    metadata: Dict[str, Union[str, int, bool]] , default None
        Arbitrary key-value pairs that can be used to store additional information.

    """
    def __init__(self, id: str, email: str = None, name: str = None, short_name: str = None, status: Status = None, profile_picture_url: str = None, metadata: json = {}):
        self.id = id
        self.email = email
        self.name = name
        self.shortName = short_name
        self.status = status
        self.profilePictureURL = profile_picture_url
        self.metadata = metadata

class PlatformGroupVariables:
    def __init__(self, id: str, name: str, status: Status = None, members: list[str] = None):
        self.id = id
        self.name = name
        self.status = status
        self.members = members

class PlatformOrganizationVariables(PlatformGroupVariables):
    """
    Deprecated - please use PlatformGroupVariables instead
    """
 
class ClientAuthTokenData:
    """
    https://docs.cord.com/reference/authentication/

    Parameters
    ----------
    user_id : str, default None
        The ID for the user
    organization_id : str, default None
        Deprecated, use group_id instead
    group_id : str, default None
        The ID for the user’s group
    user_details : PlatformUserVariables, default None
        If present, update’s the user’s details, or creates a user with those
        details if the user_id is new to Cord. This is an object that contains the
        same fields as the [user management REST endpoint](https://docs.cord.com/rest-apis/users/)
    organization_details : PlatformOrganizationVariables, default None
        Deprecated, use group_details instead
    group_details : PlatformGroupVariables, default None
        If present, updates the group's details, or creates a group
        with those details if the group_id is new to Cord. This is an object
        that contains the same fields as the [group management REST endpoint](https://docs.cord.com/rest-apis/groups/)

    """
    def __init__(self, user_id: str, organization_id: str = None, group_id: str = None, user_details: PlatformUserVariables = None, organization_details: PlatformOrganizationVariables = None,  group_details: PlatformGroupVariables = None):

        self.user_id = user_id
        self.organization_id = organization_id
        if organization_id is not None:
            warnings.warn("Organization_id is deprecated, use group_id instead", DeprecationWarning)
        self.group_id = group_id
        self.user_details = user_details
        if self.user_details and self.user_details.id:
            delattr(self.user_details, 'id')
        self.organization_details = organization_details
        if organization_details is not None:
            warnings.warn("organization_details is deprecated, use group_details instead", DeprecationWarning)
        if self.organization_details and self.organization_details.id:
            delattr(self.organization_details, 'id')
        self.group_details = group_details
        if self.group_details and self.group_details.id:
            delattr(self.group_details, 'id')
