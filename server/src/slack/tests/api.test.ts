import { jest } from '@jest/globals';
import { fetchSlackChannelList } from 'server/src/slack/api.ts';

describe('fetchSlackChannelList', () => {
  test('stitches together paginated responses', async () => {
    const slackClient = {
      conversations: {
        list: jest.fn((options: any) => {
          if (!options.cursor) {
            return {
              ok: true,
              response_metadata: { next_cursor: 'once' },
              channels: [
                {
                  id: '1',
                  name: 'general',
                  num_members: 42,
                  is_archived: false,
                },
                {
                  id: '2',
                  name: 'more-general',
                  num_members: 43,
                  is_archived: false,
                },
              ],
            };
          } else if (options.cursor === 'once') {
            return {
              ok: true,
              response_metadata: { next_cursor: 'twice' },
              channels: [
                {
                  id: '3',
                  name: 'major',
                  num_members: 44,
                  is_archived: false,
                },
              ],
            };
          } else if (options.cursor === 'twice') {
            return {
              ok: true,
              response_metadata: { next_cursor: null },
              channels: [
                {
                  id: '4',
                  name: 'junk',
                  num_members: 3,
                  is_archived: true,
                },
              ],
            };
          } else {
            fail('Caller made up a cursor?');
          }
        }),
      },
    };

    const results = await fetchSlackChannelList(slackClient as any);

    expect(results).toHaveLength(4);
    expect(results[0]).toMatchObject({
      id: '1',
      name: 'general',
      users: 42,
      archived: false,
    });
    expect(results[1]).toMatchObject({
      id: '2',
      name: 'more-general',
      users: 43,
      archived: false,
    });
    expect(results[2]).toMatchObject({
      id: '3',
      name: 'major',
      users: 44,
      archived: false,
    });
    expect(results[3]).toMatchObject({
      id: '4',
      name: 'junk',
      users: 3,
      archived: true,
    });
  });

  test('drops duplicate IDs', async () => {
    const slackClient = {
      conversations: {
        list: jest.fn((options: any) => {
          if (!options.cursor) {
            return {
              ok: true,
              response_metadata: { next_cursor: 'once' },
              channels: [
                {
                  id: '1',
                  name: 'general',
                  num_members: 42,
                  is_archived: false,
                },
                {
                  id: '2',
                  name: 'more-general',
                  num_members: 43,
                  is_archived: false,
                },
              ],
            };
          } else if (options.cursor === 'once') {
            return {
              ok: true,
              response_metadata: { next_cursor: null },
              channels: [
                {
                  id: '1',
                  name: 'major',
                  num_members: 44,
                  is_archived: false,
                },
              ],
            };
          } else {
            fail('Caller made up a cursor?');
          }
        }),
      },
    };

    const results = await fetchSlackChannelList(slackClient as any);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: '1',
      name: 'general',
      users: 42,
      archived: false,
    });
    expect(results[1]).toMatchObject({
      id: '2',
      name: 'more-general',
      users: 43,
      archived: false,
    });
  });

  test("errors on channel that's missing a necessary property", async () => {
    const slackClient = {
      conversations: {
        list: jest.fn((_) => {
          return {
            ok: true,
            response_metadata: { next_cursor: 'once' },
            channels: [
              {
                id: '1',
                name: 'general',
                num_members: 42,
                is_archived: false,
              },
              {
                id: '2',
                name: 'more-general',
                is_archived: false,
              },
              {
                id: '3',
                name: 'major',
                num_members: 44,
                is_archived: false,
              },
            ],
          };
        }),
      },
    };

    void expect(
      fetchSlackChannelList(slackClient as any),
    ).rejects.toThrowError();
  });
});
