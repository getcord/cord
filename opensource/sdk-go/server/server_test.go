package server

import (
	"encoding/base64"
	"encoding/json"
	"strings"
	"testing"
	"time"
)

var (
	kProjectId      = "1234567890"
	kSecret         = []byte("0987654321")
	kUserID         = "112233"
	kGroupID        = "445566"
	kCustomerID     = "345456567"
	kCustomerSecret = []byte("123234345")
)

func init() {
	setTimeForTest(time.Unix(1655383113, 0))
}

func valuesFromToken(token string) map[string]interface{} {
	payload := strings.Split(token, ".")[1]
	payload_decoded, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		panic(err)
	}
	result := map[string]interface{}{}
	if err = json.Unmarshal(payload_decoded, &result); err != nil {
		panic(err)
	}
	return result
}

func TestServerAuthTokenBasics(t *testing.T) {
	token, err := ServerAuthToken(kProjectId, kSecret)
	if err != nil {
		t.Fatal(err)
	}
	if token != "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NTUzODMxNzMsImlhdCI6MTY1NTM4MzExMywicHJvamVjdF9pZCI6IjEyMzQ1Njc4OTAifQ.viFVl8J-_2reh5PaGgVx2v2wEYsYTwooIkFulg1xp-D1sBTdIxm1mY67xSrKmm1KJlaYXpTuHy50hxuNkUcHrw" {
		t.Fatalf("Token generation failed, received %v", token)
	}
}

func TestProjectManagementAuthTokenBasics(t *testing.T) {
	token, err := ProjectManagementAuthToken(kCustomerID, kCustomerSecret)

	if err != nil {
		t.Fatal(err)
	}
	if token != "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcl9pZCI6IjM0NTQ1NjU2NyIsImV4cCI6MTY1NTM4MzE3MywiaWF0IjoxNjU1MzgzMTEzfQ.nxfnM4F4jp9lckTec8a7r5garU57KleN_qnV7eaUePaxScKhIpFTWgpFpa_Xj7hooJ0bTZN5Rk4VB1TgWg-f2Q" {
		t.Fatalf("Token generation failed, received %v", token)
	}
}

func TestProjectManagementAuthTokenAndApplicationManagementAuthTokenReturn(t *testing.T) {
	projectToken, projectErr := ProjectManagementAuthToken(kCustomerID, kCustomerSecret)
	applicationToken, applicationErr := ApplicationManagementAuthToken(kCustomerID, kCustomerSecret)

	if projectErr != nil {
		t.Fatal(projectErr)
	}
	if applicationErr != nil {
		t.Fatal(applicationErr)
	}
	if projectToken != applicationToken {
		t.Fatalf("ProjectManagementAuthToken return and ApplicationManagementAuthToken return should be equal")
	}
}

func TestClientAuthTokenBasics(t *testing.T) {
	token, err := ClientAuthToken(kProjectId, kSecret,
		ClientAuthTokenData{
			UserID:  kUserID,
			GroupID: kGroupID,
			UserDetails: &UserDetails{
				Email:  "flooey@example.com",
				Name:   "Adam Vartanian",
				Status: Active,
			},
			GroupDetails: &GroupDetails{
				Name:   "Cord",
				Status: Active,
			},
		})
	if err != nil {
		t.Fatal(err)
	}
	if token != "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NTUzODMxNzMsImdyb3VwX2RldGFpbHMiOnsibmFtZSI6IkNvcmQiLCJzdGF0dXMiOiJhY3RpdmUifSwiZ3JvdXBfaWQiOiI0NDU1NjYiLCJpYXQiOjE2NTUzODMxMTMsInByb2plY3RfaWQiOiIxMjM0NTY3ODkwIiwidXNlcl9kZXRhaWxzIjp7ImVtYWlsIjoiZmxvb2V5QGV4YW1wbGUuY29tIiwibmFtZSI6IkFkYW0gVmFydGFuaWFuIiwic3RhdHVzIjoiYWN0aXZlIn0sInVzZXJfaWQiOiIxMTIyMzMifQ.5wbp5lRd4DYSZ8R9gsDnzKQQxbUNd9Dw-SyiZvyZtajMn8LGFn6_eu-BpyV7zVgcCXGMl3XcbAGTJcofJ-NOgA" {
		t.Fatalf("Token generation failed, received %v", token)
	}
}

func TestClientAuthTokenNoGroup(t *testing.T) {
	token, err := ClientAuthToken(kProjectId, kSecret,
		ClientAuthTokenData{
			UserID: kUserID,
			UserDetails: &UserDetails{
				Email: "flooey@example.com",
				Name:  "Adam Vartanian",
				Metadata: map[string]interface{}{
					"employee":                true,
					"employee_id":             12345,
					"employee_favorite_movie": "The Princess Bride",
				},
			},
		})
	if err != nil {
		t.Fatal(err)
	}
	if token != "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NTUzODMxNzMsImlhdCI6MTY1NTM4MzExMywicHJvamVjdF9pZCI6IjEyMzQ1Njc4OTAiLCJ1c2VyX2RldGFpbHMiOnsiZW1haWwiOiJmbG9vZXlAZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRhbSBWYXJ0YW5pYW4iLCJtZXRhZGF0YSI6eyJlbXBsb3llZSI6dHJ1ZSwiZW1wbG95ZWVfZmF2b3JpdGVfbW92aWUiOiJUaGUgUHJpbmNlc3MgQnJpZGUiLCJlbXBsb3llZV9pZCI6MTIzNDV9fSwidXNlcl9pZCI6IjExMjIzMyJ9.wO1TRjWEza1VsQPpO0V0Vdw28YAvntX51edRXH_bl66ulPXz_zDIsrGAGFzph-wtvW5VTkW5JxhcYwran0-KCg" {
		t.Fatalf("Token generation failed, received %v", token)
	}
}

func TestClientAuthTokenDeprecatedFeatures(t *testing.T) {
	token, err := ClientAuthToken(kProjectId, kSecret,
		ClientAuthTokenData{
			UserID: kUserID,
			// This is called GroupID now
			OrganizationID: kGroupID,
			UserDetails: &UserDetails{
				Email: "flooey@example.com",
				Name:  "Adam Vartanian",
				// FirstName and LastName are deprecated and ignored
				FirstName: "Adam",
				LastName:  "Vartanian",
				Status:    Active,
			},
			// This is called GroupDetails now
			OrganizationDetails: &OrganizationDetails{
				Name:   "Cord",
				Status: Active,
			},
		})
	if err != nil {
		t.Fatal(err)
	}
	if token != "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NTUzODMxNzMsImdyb3VwX2RldGFpbHMiOnsibmFtZSI6IkNvcmQiLCJzdGF0dXMiOiJhY3RpdmUifSwiZ3JvdXBfaWQiOiI0NDU1NjYiLCJpYXQiOjE2NTUzODMxMTMsInByb2plY3RfaWQiOiIxMjM0NTY3ODkwIiwidXNlcl9kZXRhaWxzIjp7ImVtYWlsIjoiZmxvb2V5QGV4YW1wbGUuY29tIiwibmFtZSI6IkFkYW0gVmFydGFuaWFuIiwic3RhdHVzIjoiYWN0aXZlIn0sInVzZXJfaWQiOiIxMTIyMzMifQ.5wbp5lRd4DYSZ8R9gsDnzKQQxbUNd9Dw-SyiZvyZtajMn8LGFn6_eu-BpyV7zVgcCXGMl3XcbAGTJcofJ-NOgA" {
		t.Fatalf("Token generation failed, received %v", token)
	}
}

func TestClientAuthTokenEncoding(t *testing.T) {
	token, err := ClientAuthToken(kProjectId, kSecret,
		ClientAuthTokenData{
			UserID:  kUserID,
			GroupID: kGroupID,
			UserDetails: &UserDetails{
				Email:  "flooey@example.com",
				Name:   "Adam Vartanian",
				Status: Active,
				Metadata: map[string]interface{}{
					"employee":                true,
					"employee_id":             12345,
					"employee_favorite_movie": "The Princess Bride",
				},
			},
			GroupDetails: &GroupDetails{
				Name:   "Cord",
				Status: Active,
			},
		})
	if err != nil {
		t.Fatal(err)
	}
	payload := valuesFromToken(token)
	if payload["project_id"] != kProjectId {
		t.Errorf("Wrong project ID, received %s", payload["project_id"])
	}
	if payload["user_id"] != kUserID {
		t.Errorf("Wrong user ID, received %s", payload["user_id"])
	}
	if payload["group_id"] != kGroupID {
		t.Errorf("Wrong group ID, received %s", payload["group_id"])
	}
	userDetails := payload["user_details"].(map[string]interface{})
	if userDetails["email"] != "flooey@example.com" {
		t.Errorf("Wrong email, received %s", userDetails["email"])
	}
	if userDetails["name"] != "Adam Vartanian" {
		t.Errorf("Wrong name, received %s", userDetails["name"])
	}
	if userDetails["status"] != "active" {
		t.Errorf("Wrong status, received %s", userDetails["status"])
	}
	userMetadata := userDetails["metadata"].(map[string]interface{})
	if userMetadata["employee"] != true {
		t.Errorf("Wrong metadata:employee, received %v", userMetadata["employee"])
	}
	if userMetadata["employee_id"] != 12345.0 {
		t.Errorf("Wrong metadata:employee_id, received %v", userMetadata["employee_id"])
	}
	if userMetadata["employee_favorite_movie"] != "The Princess Bride" {
		t.Errorf("Wrong metadata:employee_favorite_movie, received %v", userMetadata["employee_favorite_movie"])
	}
	if len(userMetadata) > 3 {
		t.Errorf("Wrong number of user metadata fields, received %d", len(userMetadata))
	}
	if len(userDetails) > 4 {
		t.Errorf("Wrong number of user fields, received %d", len(userDetails))
	}
	groupDetails := payload["group_details"].(map[string]interface{})
	if groupDetails["name"] != "Cord" {
		t.Errorf("Wrong name, received %s", groupDetails["name"])
	}
	if groupDetails["status"] != "active" {
		t.Errorf("Wrong status, received %s", groupDetails["status"])
	}
	if len(groupDetails) > 2 {
		t.Errorf("Wrong number of group fields, received %d", len(groupDetails))
	}
}

func TestClientAuthTokenMissingFields(t *testing.T) {
	_, err := ClientAuthToken(kProjectId, kSecret, ClientAuthTokenData{})
	if err == nil {
		t.Error("Accepted empty ClientAuthTokenData")
	}
	_, err = ClientAuthToken(kProjectId, kSecret, ClientAuthTokenData{GroupID: kGroupID})
	if err == nil {
		t.Error("Accepted missing user ID")
	}
	_, err = ClientAuthToken(kProjectId, kSecret, ClientAuthTokenData{UserID: kUserID, GroupID: kGroupID, GroupDetails: &GroupDetails{}})
	if err == nil {
		t.Error("Accepted empty PlaformGroupDetails")
	}
}
