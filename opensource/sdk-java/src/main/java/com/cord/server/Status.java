package com.cord.server;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Marks the status of a user or an organization.
 * Mainly used to "soft" delete entities.
 **/
public enum Status {
    @JsonProperty("active")
    ACTIVE,
    @JsonProperty("deleted")
    DELETED;

    private Status() {
    }
}
