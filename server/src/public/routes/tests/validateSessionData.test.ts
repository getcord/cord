import { v4 as uuid } from 'uuid';
import { validateSessionData } from 'server/src/auth/session.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

describe('validateSessionData', () => {
  test('Empty data', () => {
    expect(() => validateSessionData({})).toThrow(
      new ApiCallerError('invalid_session_token', {
        message:
          'Invalid ClientAuthTokenData:\n' +
          'Input {} requires field: project_id.\n' +
          'Refer to https://docs.cord.com/reference/authentication/',
      }),
    );
  });
  test('Data is not an object', () => {
    const data = 'foo';
    expect(() => validateSessionData(data)).toThrow(
      new ApiCallerError('invalid_session_token', {
        message:
          'Invalid ClientAuthTokenData:\n' +
          'Expected JSON object.\n' +
          'Refer to https://docs.cord.com/reference/authentication/',
      }),
    );
  });
  test('Data only has app_id', () => {
    const appID = uuid();
    const data = { app_id: appID };
    expect(() => validateSessionData(data)).toThrow(
      new ApiCallerError('invalid_session_token', {
        message:
          'Invalid ClientAuthTokenData:\n' +
          `Input {"app_id":"${appID}"} requires field: user_id.\n` +
          'Refer to https://docs.cord.com/reference/authentication/',
      }),
    );
  });
  test('Data only has project_id', () => {
    const projectID = uuid();
    const data = { project_id: projectID };
    expect(() => validateSessionData(data)).toThrow(
      new ApiCallerError('invalid_session_token', {
        message:
          'Invalid ClientAuthTokenData:\n' +
          `Input {"project_id":"${projectID}"} requires field: user_id.\n` +
          'Refer to https://docs.cord.com/reference/authentication/',
      }),
    );
  });
  test('Data does not have app_id or project_id', () => {
    const data = {
      user_id: 'foo',
      organization_id: 'bar',
    };
    expect(() => validateSessionData(data)).toThrow(
      new ApiCallerError('invalid_session_token', {
        message:
          'Invalid ClientAuthTokenData:\n' +
          'Input {"user_id":"foo","organization_id":"bar"} requires field: project_id.\n' +
          'Refer to https://docs.cord.com/reference/authentication/',
      }),
    );
  });
  test('Data had app_id that is not a uuid', () => {
    const data = { app_id: 'yay' };
    expect(() => validateSessionData(data)).toThrow(
      new ApiCallerError('invalid_session_token', {
        message:
          'Invalid ClientAuthTokenData:\n' +
          'Input "yay" for app_id must match format "uuid",\n' +
          'Input {"app_id":"yay"} requires field: user_id.\n' +
          'Refer to https://docs.cord.com/reference/authentication/',
      }),
    );
  });
  test('Additional properties', () => {
    const appID = uuid();
    const data = {
      app_id: appID,
      organization_id: 'boo',
      first_name: 'casper',
    };
    expect(() => validateSessionData(data)).toThrow(
      new ApiCallerError('invalid_session_token', {
        message:
          'Invalid ClientAuthTokenData:\n' +
          `Input {"app_id":"${appID}","organization_id":"boo","first_name":"casper"} requires field: user_id.\n` +
          'Refer to https://docs.cord.com/reference/authentication/',
      }),
    );
  });
  test('Success with project_id and no app_id', () => {
    const iat = Date.now();
    const exp = Date.now();
    const data = {
      project_id: uuid(),
      organization_id: 'boo',
      user_id: 'casper',
      iat,
      exp,
    };

    const result = validateSessionData(data);
    expect(result).toMatchObject(result);
  });
  test('Success with app_id and no project_id', () => {
    const iat = Date.now();
    const exp = Date.now();
    const data = {
      app_id: uuid(),
      organization_id: 'boo',
      user_id: 'casper',
      iat,
      exp,
    };

    const result = validateSessionData(data);
    expect(result).toMatchObject(result);
  });
  test('Success with additional jwt properties', () => {
    const iat = Date.now();
    const exp = Date.now();
    const data = {
      app_id: uuid(),
      organization_id: 'boo',
      user_id: 'casper',
      iat,
      exp,
      customersMayAddAllSortsOf: 'crazy stuff',
    };

    const result = validateSessionData(data);
    expect(result).toMatchObject(result);
  });
});
