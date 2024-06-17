package com.cord.server;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Variables used to describe a platform user
 *
 * The only required variable is "email".
 **/
public class PlatformUserVariables {
    private final String email;
    private final String id;
    private final String name;
    private final String profilePictureUrl;
    private final Status status;
    /**
     * @deprecated This field is deprecated and has no effect
     * */
    @Deprecated
    private final String firstName;
    /**
     * @deprecated This field is deprecated and has no effect
     * */
    @Deprecated
    private final String lastName;
    private final Object metadata;

    private PlatformUserVariables(PlatformUserVariablesBuilder builder) {
        this.email = builder.email;
        this.id = builder.id;
        this.name = builder.name;
        this.profilePictureUrl = builder.profilePictureUrl;
        this.status = builder.status;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.metadata = builder.metadata;
    }

    @JsonProperty("email")
    public String getEmail() {
        return email;
    }

    @JsonProperty("id")
    public String getId() {
        return id;
    }

    @JsonProperty("name")
    public String getName() {
        return name;
    }

    @JsonProperty("profile_picture_url")
    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    @JsonProperty("status")
    public Status getStatus() {
        return status;
    }

    @Deprecated
    @JsonProperty("first_name")
    public String getFirstName() {
        return firstName;
    }

    @Deprecated
    @JsonProperty("last_name")
    public String getLastName() {
        return lastName;
    }

    @JsonProperty("metadata")
    public Object getMetadata() {
        return metadata;
    }

    public static class PlatformUserVariablesBuilder {
        private final String email;
        private String id;
        private String name;
        private String profilePictureUrl;
        private Status status;
        private String firstName;
        private String lastName;
        private Object metadata;

        public PlatformUserVariablesBuilder(String email) {
            this.email = email;
        }

        public PlatformUserVariablesBuilder id(String id) {
            this.id = id;
            return this;
        }

        /**
         * Name is the full user name.
         * */
        public PlatformUserVariablesBuilder name(String name) {
            this.name = name;
            return this;
        }

        /**
         * ProfilePictureURL contains a URL to an image for the user's profile picture.
         * */
        public PlatformUserVariablesBuilder profilePictureUrl(String profilePictureUrl) {
            this.profilePictureUrl = profilePictureUrl;
            return this;
        }

        /**
         * Status contains the status of this user. Whether they are `active` or `deleted`.
         * */
        public PlatformUserVariablesBuilder status(Status status) {
            this.status = status;
            return this;
        }

        /**
         * @deprecated This field is deprecated and has no effect.
         * */
        @Deprecated
        public PlatformUserVariablesBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        /**
         * @deprecated This field is deprecated and has no effect.
         * */
        @Deprecated

        public PlatformUserVariablesBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        /**
         *  Metadata contains arbitrary additional data about this user.  The values
         * 	may only be booleans, numbers, and strings; in particular, nested object
         * 	values or arrays will be rejected by the server.
         * */
        public PlatformUserVariablesBuilder metadata(Object metadata){
            this.metadata = metadata;
            return this;
        }

        public PlatformUserVariables build() {
            return new PlatformUserVariables(this);
        }
    }
}
