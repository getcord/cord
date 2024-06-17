package com.cord.server;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Variables used to describe a platform group
 *
 * The only required variable is "name".
 **/
public class PlatformGroupVariables {
    private final String name;
    private final String id;
    private final Status status;
    private final List<String> members;
    private final Object metadata;

    private PlatformGroupVariables(PlatformGroupVariablesBuilder builder) {
        this.name = builder.name;
        this.id = builder.id;
        this.status = builder.status;
        this.members = builder.members;
        this.metadata = builder.metadata;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Status getStatus() {
        return status;
    }

    public List<String> getMembers() {
        return members;
    }

    public Object getMetadata() { return metadata; }

    public static class PlatformGroupVariablesBuilder {
        private final String name;
        private String id;
        private Status status;
        private List<String> members;
        private Object metadata;

        public PlatformGroupVariablesBuilder(String name) {
            this.name = name;
        }

        public PlatformGroupVariablesBuilder id(String id) {
            this.id = id;
            return this;
        }
        /**
         *  Status contains the status of this group. Whether it is `active` or `deleted`.
         * */
        public PlatformGroupVariablesBuilder status(Status status) {
            this.status = status;
            return this;
        }
        /**
         *  Members is a list of IDs, of the user who are member of this group.
         * */
        public PlatformGroupVariablesBuilder members(List<String> members) {
            this.members = Collections.unmodifiableList(new ArrayList<>(members));
            return this;
        }
        /**
         *  Metadata contains arbitrary additional data about this group.  The values
         * 	may only be booleans, numbers, and strings; in particular, nested object
         * 	values or arrays will be rejected by the server.
         * */
        public PlatformGroupVariablesBuilder metadata(Object metadata) {
            this.metadata = metadata;
            return this;
        }

        public PlatformGroupVariables build() {
            return new PlatformGroupVariables(this);
        }
    }
}
