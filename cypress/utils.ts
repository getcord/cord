import * as jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

export const generateToken = (applicationID: string, sharedSecret: string) =>
  jwt.sign(
    {
      app_id: applicationID,
      user_id: uuid(),
      organization_id: uuid(),
      user_details: {
        name: 'Rolo',
        email: `test-user@cord.com`,
      },
      organization_details: {
        name: 'Test Org',
      },
    },
    sharedSecret,
    {
      algorithm: 'HS512',
      expiresIn: '1 min',
    },
  );
