package com.cord.server;

import static org.junit.Assert.assertEquals;

import java.util.Arrays;
import java.util.HashMap;

import org.junit.Test;

import com.cord.server.PlatformGroupVariables.PlatformGroupVariablesBuilder;
import com.cord.server.PlatformUserVariables.PlatformUserVariablesBuilder;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonInclude;

public class ClientAuthTokenDataTest {
    private static final ObjectMapper mapper = new ObjectMapper()
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    @Test
    public void simpleSerialization() throws Exception {
        ClientAuthTokenData authData = new ClientAuthTokenData.ClientAuthTokenDataBuilder("userID")
                .groupId("groupID")
                .userDetails(new PlatformUserVariablesBuilder("email@example.com")
                        .status(Status.ACTIVE)
                        .name("Example")
                        .metadata(new HashMap<String, Object>(){{put("user", "metadata");}})
                        .build())
                .groupDetails(new PlatformGroupVariablesBuilder("name")
                        .status(Status.DELETED)
                        .members(Arrays.asList("north", "south", "dennis"))
                        .metadata(new HashMap<String, Object>(){{put("group", "metadata");}})
                        .build())
                .build();

        assertEquals(
                "{\"user_id\":\"userID\",\"group_id\":\"groupID\",\"user_details\":{\"email\":\"email@example.com\",\"name\":\"Example\",\"status\":\"active\",\"metadata\":{\"user\":\"metadata\"}},\"group_details\":{\"name\":\"name\",\"status\":\"deleted\",\"members\":[\"north\",\"south\",\"dennis\"],\"metadata\":{\"group\":\"metadata\"}}}",
                mapper.writeValueAsString(authData));
    }
}
