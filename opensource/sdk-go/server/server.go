// Package server provides utility functions to make it easier to integrate Cord
// into your application.
//
// For more information about the Cord-specific terms used here, see the
// reference documentation at https://docs.cord.com/reference/.
package server

import (
	"encoding/json"
	"errors"
	"time"

	jwt "github.com/golang-jwt/jwt/v4"
)

var now = time.Now

func setTimeForTest(t time.Time) {
	now = func() time.Time { return t }
}

// A Status is the state of a user or group.
type Status int

const (
	Unspecified Status = iota
	Active
	Deleted // Deleted users or groups will have authentication attempts refused
)

// String returns the string value of a Status for use in the API
func (s Status) String() string {
	switch s {
	case Active:
		return "active"
	case Deleted:
		return "deleted"
	}
	return ""
}

// MarshalJSON marshals a Status to its text format
func (s Status) MarshalJSON() ([]byte, error) {
	return json.Marshal(s.String())
}

// UserDetails contains the information about a user that needs to be synced to
// Cord.  Any values that are left at their zero value are not sent.
type UserDetails struct {
	// Email contains the user's email address.
	Email string `json:"email,omitempty"`
	// Name contains the user's full name, to be displayed in the user interface.
	Name string `json:"name,omitempty"`
	// ProfilePictureURL contains a URL to an image for the user's profile picture.
	ProfilePictureURL string `json:"profile_picture_url,omitempty"`
	// Status contains the status of this user.
	Status Status `json:"status,omitempty"`
	// Metadata contains arbitrary additional data about this user.  The values
	// may only be booleans, numbers, and strings; in particular, nested object
	// values or arrays will be rejected by the server.
	Metadata map[string]interface{} `json:"metadata,omitempty"`
	// Deprecated: This field is deprecated and has no effect
	FirstName string `json:"-"`
	// Deprecated: This field is deprecated and has no effect
	LastName string `json:"-"`
}

// GroupDetails contains the information about a group that needs to be synced
// to Cord.  Any values that are left at their zero value are not sent except
// Name, which is required.
type GroupDetails struct {
	Name     string                 `json:"name"`
	Status   Status                 `json:"status,omitempty"`
	Members  []string               `json:"members,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

type OrganizationDetails = GroupDetails

// ClientAuthTokenData is the data that can be supplied in a client auth token.
type ClientAuthTokenData struct {
	// UserID contains the identifier for the user that this token will
	// authenticate as.
	UserID string
	// OrganizationID contains the identifier for the group that this token will
	// authenticate as.
	//
	// Deprecated: Organizations are now called groups, so the GroupID field
	// should be used instead.
	OrganizationID string
	// GroupID contains the identifier for the group that this token will
	// authenticate as.  We recommend not setting this field, which allows the
	// user to see objects from any group they are a member of.  If a non-zero
	// value is set, the user using this token will only be able to see objects in
	// that group.
	GroupID string
	// UserDetails contains the information about the user that will be synced to
	// Cord when this token is used.  If set, the user does not need to exist
	// before this token is used and will be created with these details when the
	// token is used for authenticate.
	UserDetails *UserDetails
	// OrganizationDetails contains the information about the group to set when
	// they log in.
	//
	// Deprecated: Organizations are now called groups, so the GroupDetails field
	// should be used instead.
	OrganizationDetails *GroupDetails
	// GroupDetails contains the information about the group that will be synced
	// to Cord when this token is used.  If set, the group does not need to exist
	// before this token is used and will be created with these details when the
	// token is used for authenticate, and the user will be made a member of the
	// group.
	GroupDetails *GroupDetails
}

// ClientAuthToken returns a client auth token suitable for authenticating a
// user to Cord.
func ClientAuthToken(projectID string, secret []byte, data ClientAuthTokenData) (string, error) {
	if data.UserID == "" {
		return "", errors.New("missing UserID")
	}
	claims := jwt.MapClaims{
		"project_id":  projectID,
		"iat":     now().Unix(),
		"exp":     now().Add(1 * time.Minute).Unix(),
		"user_id": data.UserID,
	}
	if data.GroupID != "" {
		claims["group_id"] = data.GroupID
	} else if data.OrganizationID != "" {
		claims["group_id"] = data.OrganizationID
	}
	if data.UserDetails != nil {
		claims["user_details"] = data.UserDetails
	}
	if data.GroupDetails != nil {
		if data.GroupDetails.Name == "" {
			return "", errors.New("missing required group field: Name")
		}
		claims["group_details"] = data.GroupDetails
	} else if data.OrganizationDetails != nil {
		if data.OrganizationDetails.Name == "" {
			return "", errors.New("missing required group field: Name")
		}
		claims["group_details"] = data.OrganizationDetails
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS512, claims)
	tokenString, err := token.SignedString(secret)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// ServerAuthToken returns a server auth token suitable for authenticating
// requests to Cord's REST API (see https://docs.cord.com/rest-apis/).
func ServerAuthToken(projectID string, secret []byte) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS512, jwt.MapClaims{
		"project_id": projectID,
		"iat":    now().Unix(),
		"exp":    now().Add(1 * time.Minute).Unix(),
	})
	tokenString, err := token.SignedString(secret)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// ApplicationManagementAuthToken returns a server side auth token suitable for
// authenticating requests to Cord's Applications REST API (see https://docs.cord.com/rest-apis/).
func ApplicationManagementAuthToken(customerID string, secret []byte) (string, error) {
	return ProjectManagementAuthToken(customerID, secret)
}

// ProjectManagementAuthToken returns a server side auth token suitable for
// authenticating requests to Cord's Project REST API (see https://docs.cord.com/rest-apis/).
func ProjectManagementAuthToken(customerID string, secret []byte) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS512, jwt.MapClaims{
		"customer_id": customerID,
		"iat":         now().Unix(),
		"exp":         now().Add(1 * time.Minute).Unix(),
	})
	tokenString, err := token.SignedString(secret)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}
