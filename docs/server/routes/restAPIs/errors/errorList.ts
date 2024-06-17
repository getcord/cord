const errorList = [
  [
    400,
    'invalid_request',
    'The request body is not a valid JSON object or is empty.',
  ],
  [
    400,
    'unexpected_field',
    'A field is present in the request but is not one of the required or optional fields.',
  ],
  [
    400,
    'missing_field',
    'A field is present in the request but is not one of the required or optional fields.',
  ],
  [
    400,
    'invalid_field',
    'A field is present in the request but is not one of the required or optional fields.',
  ],
  [
    401,
    'application_not_found',
    'The referenced application ID does not exist.',
  ],
  [401, 'project_not_found', 'The referenced project ID does not exist.'],
  [
    401,
    'user_not_found',
    'The request references a user ID which has not yet been created.',
  ],
  [
    401,
    'group_not_found',
    'The request references an group ID which has not yet been created.',
  ],
  [
    401,
    'organization_not_found',
    'The request references an organization ID which has not yet been created.',
  ],
  [
    401,
    'missing_authorization_header',
    'The request references an group ID which has not yet been created.',
  ],
  [
    401,
    'invalid_authorization_header',
    'The Authorization header is either not a valid JWT or is missing the Bearer prefix.',
  ],
  [
    401,
    'invalid_app_token',
    'The app token is not a valid JWT or is signed incorrectly.',
  ],
  [
    401,
    'invalid_project_token',
    'The project token is not a valid JWT or is signed incorrectly.',
  ],
  [
    401,
    'invalid_customer_token',
    'The customer token is not a valid JWT or is signed incorrectly.',
  ],
  [
    401,
    'invalid_access_token',
    'The access token is invalid. You should request another one.',
  ],
  [
    401,
    'expired_access_token',
    'The access token is expired or has been revoked. You should request another one.',
  ],
  [
    400,
    'message_not_appendable',
    'The request references a message that can not support appending. It must contain a markdown node only.',
  ],
  [
    409,
    'group_already_exists',
    "The group you're trying to create already exists.",
  ],
  [
    409,
    'user_already_exists',
    "The user you're trying to create already exists.",
  ],
  [500, 'error', 'Generic internal server error.'],
];

export default errorList;
