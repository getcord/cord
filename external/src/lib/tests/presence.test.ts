import { PAGE_PRESENCE_LOSS_TTL_SECONDS } from 'common/const/Timing.ts';
import { usersSortedByPresence } from 'external/src/lib/util.ts';
import { mockUser } from 'external/src/lib/tests.ts';

test('sorting logic', async () => {
  const now = new Date();

  const visitors = [
    {
      user: mockUser({ id: '6' }),
      lastSeen: new Date(
        now.getTime() - (PAGE_PRESENCE_LOSS_TTL_SECONDS + 10) * 1000,
      ),
    },
    {
      user: mockUser({ id: '2' }),
      lastSeen: now,
    },
    {
      user: mockUser({ id: '4' }),
      lastSeen: new Date(
        now.getTime() - (PAGE_PRESENCE_LOSS_TTL_SECONDS + 1) * 1000,
      ),
    },
    {
      user: mockUser({ id: '1' }),
      lastSeen: now,
    },
    {
      user: mockUser({ id: '5' }),
      lastSeen: new Date(
        now.getTime() - (PAGE_PRESENCE_LOSS_TTL_SECONDS + 5) * 1000,
      ),
    },
    {
      user: mockUser({ id: '3' }),
      lastSeen: now,
    },
  ];

  const sortedUserIDs = usersSortedByPresence(visitors, [
    mockUser({ id: '1' }),
    mockUser({ id: '2' }),
    mockUser({ id: '3' }),
  ] as any).map(({ id }) => id);

  expect(sortedUserIDs).toEqual(['1', '2', '3', '4', '5', '6']);
});
