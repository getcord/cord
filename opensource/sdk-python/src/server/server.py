from datetime import datetime, timedelta
import jwt


from src.types.types import ClientAuthTokenData

# payload: {
#   # The user ID can be any identifier that makes sense to your application.
#   # As long as it's unique per-user, Cord can use it to represent your user.
#   user_id: 'severusatreides',

#   # Same as above. An organization ID can be any unique string. Organizations
#   # are groups of users.
#   organization_id: 'starpotterdunewars',

#   # By supplying the  `user_details` object, you can create the user in
#   # Cord's backend on-the-fly. No need to pre-sync your users.
#   user_details: {
#     email: 'sevvy@arrakis.spice',
#     name: 'Severus Atreides',
#   },

#   # By supplying the `organization_details` object, just like the user,
#   # Cord will create the organization on-the-fly.
#   organization_details: {
#     name: "starpotterdunewars",
#   },
# }
# For more details, checkout: https://docs.cord.com/get-started/integration-guide/create-an-auth-token


def get_client_auth_token(app_id: str, secret: str, payload: ClientAuthTokenData):
    return jwt.encode(
        payload={
            "app_id": app_id,
            "exp": datetime.now() + timedelta(minutes=1),
            "iat": datetime.now(),
            **payload
        },
        key=secret,
        algorithm='HS512'
    )


def get_server_auth_token(app_id: str, secret: str):
    return jwt.encode(
        payload={
            "app_id": app_id,
            "exp": datetime.now() + timedelta(minutes=1),
            "iat": datetime.now()
        },
        key=secret,
        algorithm='HS512'
    )


def get_application_management_auth_token(customer_id: str, customer_secret: str):
    return jwt.encode(
        payload={
            "customer_id": customer_id,
            "exp": datetime.now() + timedelta(minutes=1),
            "iat": datetime.now()
        },
        key=customer_secret,
        algorithm='HS512'
    )
