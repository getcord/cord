import logging
from hashlib import sha256
from oncall import db
from oncall.api.v0.users import get_user_data

logger = logging.getLogger(__name__)

class Authenticator:
    def __init__(self, config):
        if config.get('debug'):
            self.authenticate = self.debug_auth
            return
        self.authenticate = self.password_auth

    def password_auth(self, username, password):
        connection = db.connect()
        cursor = connection.cursor(db.DictCursor)
        data = get_user_data(None, {'name': username}, dbinfo=(connection, cursor))
        if not data:
            cursor.close()
            connection.close()
            return False
        
        cursor.execute(f'''SELECT password FROM password
            WHERE id = {data[0]['id']}''')
        pw_data = cursor.fetchall()
        if len(pw_data) != 1:
            cursor.close()
            connection.close()
            return False
        hashed_password = pw_data[0]['password']
        salt, hash = hashed_password.split(':')
        cursor.close()
        connection.close()
        return sha256((salt + ':' + password).encode('utf8')).hexdigest() == hash

    def debug_auth(self, username, password):
        return True
