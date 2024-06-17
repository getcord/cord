package com.cord.server;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Variables used for the information needed in the
 * authentication token data
 *
 * The required variable is "user_id".
 **/
public class ClientAuthTokenData {
    private final String userId;

    /**
     * @deprecated Please use groupId instead
     * */
    @Deprecated
    private final String organizationId;
    private final String groupId;
    private final PlatformUserVariables userDetails;

    /**
     * @deprecated Please use groupDetails instead
     * */
    @Deprecated
    private final PlatformGroupVariables organizationDetails;
    private final PlatformGroupVariables groupDetails;


    private ClientAuthTokenData(ClientAuthTokenDataBuilder builder) {
        this.userId = builder.userId;
        this.organizationId = builder.organizationId;
        this.groupId = builder.groupId;
        this.userDetails = builder.userDetails;
        this.organizationDetails = builder.organizationDetails;
        this.groupDetails = builder.groupDetails;
    }

    @JsonProperty("user_id")
    public String getUserId() {
        return userId;
    }

    @Deprecated
    @JsonProperty("organization_id")
    public String getOrganizationId() {
        return organizationId;
    }

    @JsonProperty("group_id")
    public String getGroupId() {
        return groupId;
    }

    @JsonProperty("user_details")
    public PlatformUserVariables getUserDetails() {
        return userDetails;
    }

    @Deprecated
    @JsonProperty("organization_details")
    public PlatformGroupVariables getOrganizationDetails() {
        return organizationDetails;
    }

    @JsonProperty("group_details")
    public PlatformGroupVariables getGroupDetails() {
        return groupDetails;
    }

    public static class ClientAuthTokenDataBuilder {
        private final String userId;
        /**
         * @deprecated Please use groupId instead
         * */
        @Deprecated
        private String organizationId;
        private String groupId;
        private PlatformUserVariables userDetails;
        /**
         * @deprecated Please use groupDetails instead
         * */
        @Deprecated
        private PlatformGroupVariables organizationDetails;
        private PlatformGroupVariables groupDetails;

        /**
         * @deprecated Please use the constructor which only takes a
         * userId instead.
         * */
        @Deprecated
        public ClientAuthTokenDataBuilder(String userId, String organizationId) {
            this.userId = userId;
            this.organizationId = organizationId;
        }

        public ClientAuthTokenDataBuilder(String userId) {
            this.userId = userId;
        }

        public ClientAuthTokenDataBuilder groupId(String groupId) {
            this.groupId = groupId;
            return this;
        }

        public ClientAuthTokenDataBuilder userDetails(PlatformUserVariables userDetails) {
            this.userDetails = userDetails;
            return this;
        }

        /**
         * @deprecated Please use groupDetails instead.
         * */
        @Deprecated
        public ClientAuthTokenDataBuilder organizationDetails(PlatformGroupVariables organizationDetails) {
            this.organizationDetails = organizationDetails;
            return this;
        }

        public ClientAuthTokenDataBuilder groupDetails(PlatformGroupVariables groupDetails) {
            this.groupDetails = groupDetails;
            return this;
        }

        public ClientAuthTokenData build() {
            return new ClientAuthTokenData(this);
        }
    }
}
