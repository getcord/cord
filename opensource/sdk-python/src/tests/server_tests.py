import unittest
from unittest.mock import patch
from datetime import datetime
import base64
import json

from src.server.server import get_client_auth_token, get_server_auth_token, get_application_management_auth_token


dummy_app_id = '123456789'
dummy_app_secret = '987654321'
dummy_customer_id = 'abcdefghijk'
dummy_customer_secret = 'kjihgfedcba'


class TestStringMethods(unittest.TestCase):

    def setUp(self):
        self.mock_datetime = patch(
            'src.server.server.datetime', wraps=datetime)
        self.mock_datetime_instance = self.mock_datetime.start()
        self.mock_datetime_instance.now.return_value = datetime.fromtimestamp(
            1696326608)

    def tearDown(self):
        self.mock_datetime.stop()

    def test_server_auth_token(self):
        token = get_server_auth_token(dummy_app_id, dummy_app_secret)
        correct_token = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhcHBfaWQiOiIxMjM0NTY3ODkiLCJleHAiOjE2OTYzMzAyNjgsImlhdCI6MTY5NjMzMDIwOH0.a9RWIdPZ0Zk84rQrN8uwzFvlvl_NbeEpg03xbQ2J0-yzZijl6LLPamawgf82QfpJQz0YWa7LFRswM_t4vrg-5A'

        self.assertEqual(token, correct_token)

    def test_application_management_auth_token(self):
        token = get_application_management_auth_token(
            dummy_customer_id, dummy_customer_secret)
        correct_token = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcl9pZCI6ImFiY2RlZmdoaWprIiwiZXhwIjoxNjk2MzMwMjY4LCJpYXQiOjE2OTYzMzAyMDh9.sEtg-s4qn4RwRa3mSdUeB6CYvdQqNrvkO_AYdHH8J5InurPiRsOfnKXJmKeMLMjAG82On-jqgpudxDf0NoVXfQ'

        self.assertEqual(token, correct_token)

    def test_client_auth_token(self):
        user_id = '1'
        group_id = '1'
        email = 'dummy@cord.com'
        name = 'Mr. Dummy'
        group_name = "Cord"
        short_name = 'dumdum'
        status = 'active'
        profile_picture_url = 'https://www.someurl.com'
        metadata = {"random": "hello"}

        token = get_client_auth_token(
            dummy_app_id,
            dummy_app_secret,
            {
                "user_id": user_id,
                "group_id": group_id,
                "user_details": {
                    "email": email,
                    "name": name,
                    "shortName": short_name,
                    "status": status,
                    "profilePictureURL": profile_picture_url,
                    "metadata": metadata
                },
                "group_details": {
                    "name": group_name,
                    "status": status,
                    "members": [user_id]
                }
            })

        correct_token = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhcHBfaWQiOiIxMjM0NTY3ODkiLCJleHAiOjE3MDU0ODcxNzUsImlhdCI6MTcwNTQ4NzExNSwidXNlcl9pZCI6IjEiLCJncm91cF9pZCI6IjEiLCJ1c2VyX2RldGFpbHMiOnsiZW1haWwiOiJkdW1teUBjb3JkLmNvbSIsIm5hbWUiOiJNci4gRHVtbXkiLCJzaG9ydE5hbWUiOiJkdW1kdW0iLCJzdGF0dXMiOiJhY3RpdmUiLCJwcm9maWxlUGljdHVyZVVSTCI6Imh0dHBzOi8vd3d3LnNvbWV1cmwuY29tIiwibWV0YWRhdGEiOnsicmFuZG9tIjoiaGVsbG8ifX0sImdyb3VwX2RldGFpbHMiOnsibmFtZSI6IkNvcmQiLCJzdGF0dXMiOiJhY3RpdmUiLCJtZW1iZXJzIjpbIjEiXX19.3CHm9fxtW1b5XQ2pVNgRl2a7ePI9ffIgaVd2Ck8Vtq9s4OZHDbvvnwr_TkKWcZpokIBmguOOzA5CniexzIiaVw'
        
        self.assertEqual(token, correct_token)
        encoded_payload = token.split('.')[1]
        decoded_payload = base64.b64decode(
            encoded_payload + '=')  # Need to pad the b64 payload
        payload = json.loads(
            decoded_payload.decode('utf8').replace("'", '"'))
        self.assertEqual(dummy_app_id, payload["app_id"])
        self.assertEqual(user_id, payload["user_id"])
        self.assertEqual(group_id, payload["group_id"])
        self.assertEqual(email, payload["user_details"]['email'])
        self.assertEqual(name, payload["user_details"]['name'])
        self.assertEqual(short_name, payload["user_details"]['shortName'])
        self.assertEqual(status, payload["user_details"]['status'])
        self.assertEqual(profile_picture_url,
                         payload["user_details"]['profilePictureURL'])
        self.assertEqual(metadata, payload["user_details"]['metadata'])
        self.assertEqual(group_name, payload["group_details"]['name'])
        self.assertEqual(status, payload["group_details"]['status'])
        self.assertEqual([user_id], payload["group_details"]['members'])

    def test_client_auth_token_with_deprecated_params(self):
        user_id = '1'
        organization_id = '1'
        email = 'dummy@cord.com'
        name = 'Mr. Dummy'
        org_name = "Cord"
        short_name = 'dumdum'
        status = 'active'
        profile_picture_url = 'https://www.someurl.com'
        metadata = {"random": "hello"}

        token = get_client_auth_token(
            dummy_app_id,
            dummy_app_secret,
            {
                "user_id": user_id,
                "organization_id": organization_id,
                "user_details": {
                    "email": email,
                    "name": name,
                    "shortName": short_name,
                    "status": status,
                    "profilePictureURL": profile_picture_url,
                    "metadata": metadata
                },
                "organization_details": {
                    "name": org_name,
                    "status": status,
                    "members": [user_id]
                }
            })

        correct_token = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhcHBfaWQiOiIxMjM0NTY3ODkiLCJleHAiOjE2OTYzMzAyNjgsImlhdCI6MTY5NjMzMDIwOCwidXNlcl9pZCI6IjEiLCJvcmdhbml6YXRpb25faWQiOiIxIiwidXNlcl9kZXRhaWxzIjp7ImVtYWlsIjoiZHVtbXlAY29yZC5jb20iLCJuYW1lIjoiTXIuIER1bW15Iiwic2hvcnROYW1lIjoiZHVtZHVtIiwic3RhdHVzIjoiYWN0aXZlIiwicHJvZmlsZVBpY3R1cmVVUkwiOiJodHRwczovL3d3dy5zb21ldXJsLmNvbSIsIm1ldGFkYXRhIjp7InJhbmRvbSI6ImhlbGxvIn19LCJvcmdhbml6YXRpb25fZGV0YWlscyI6eyJuYW1lIjoiQ29yZCIsInN0YXR1cyI6ImFjdGl2ZSIsIm1lbWJlcnMiOlsiMSJdfX0.QVDL1FS_mhZipUDcXJuammRF694rmV6kg0C-mZZIVTeRN9LLxo18-04McpwAW7iLYsgAC98N8uNix8OneB01Yw'

        self.assertEqual(token, correct_token)
        encoded_payload = token.split('.')[1]
        decoded_payload = base64.b64decode(
            encoded_payload + '=')  # Need to pad the b64 payload
        payload = json.loads(
            decoded_payload.decode('utf8').replace("'", '"'))
        self.assertEqual(dummy_app_id, payload["app_id"])
        self.assertEqual(user_id, payload["user_id"])
        self.assertEqual(organization_id, payload["organization_id"])
        self.assertEqual(email, payload["user_details"]['email'])
        self.assertEqual(name, payload["user_details"]['name'])
        self.assertEqual(short_name, payload["user_details"]['shortName'])
        self.assertEqual(status, payload["user_details"]['status'])
        self.assertEqual(profile_picture_url,
                         payload["user_details"]['profilePictureURL'])
        self.assertEqual(metadata, payload["user_details"]['metadata'])
        self.assertEqual(org_name, payload["organization_details"]['name'])
        self.assertEqual(status, payload["organization_details"]['status'])
        self.assertEqual([user_id], payload["organization_details"]['members'])


if __name__ == '__main__':
    unittest.main()
