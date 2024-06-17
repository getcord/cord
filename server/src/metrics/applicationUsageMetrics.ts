/**
 * Names of all application usage metric types in use
 */
export const applicationUsageMetricTypes = [
  'number_of_messages',
  'users_sent_message',
  'users_sent_message_7d',
  'users_sent_message_28d',
  'users_activated',
  'users_activated_7d',
  'users_activated_28d',
  'users_exposed_to_cord',
  'users_exposed_to_cord_7d',
  'users_exposed_to_cord_28d',
] as const;

export type ApplicationUsageMetricType =
  (typeof applicationUsageMetricTypes)[number];

export function isApplicationUsageMetricType(
  x: any,
): x is ApplicationUsageMetricType {
  return (
    typeof x === 'string' && applicationUsageMetricTypes.includes(x as any)
  );
}

interface MetricQuery {
  query: string;
  bind?: any[];
}

export const applicationUsageMetricsQueries = (): Record<
  ApplicationUsageMetricType,
  MetricQuery
> => ({
  number_of_messages: {
    // Group all messages by application ID (via their orgID) and the date part
    // of the timestamp and count the number of messages with each appID/date
    // combination. That simply gives us the number of messages written per day
    // in an application.
    query: `
        SELECT
            o."platformApplicationID" AS "applicationID",
            metrics_day(m.timestamp) AS "date",
            COUNT(m) AS "value"
        FROM messages m
        INNER JOIN orgs o ON m."orgID"=o.id
        WHERE o."platformApplicationID" IS NOT NULL
        GROUP BY 1, 2`,
  },
  users_sent_message: usersSentMessage(1),
  users_sent_message_7d: usersSentMessage(7),
  users_sent_message_28d: usersSentMessage(28),
  users_activated: usersActivated(1),
  users_activated_7d: usersActivated(7),
  users_activated_28d: usersActivated(28),
  users_exposed_to_cord: usersExposedToCord(1),
  users_exposed_to_cord_7d: usersExposedToCord(7),
  users_exposed_to_cord_28d: usersExposedToCord(28),
});

function usersSentMessage(windowDays: number): MetricQuery {
  // Calculate the number of users who authored messages over a window of N
  // (`windowDays`) days. This means, if N=1, it calculates the number of
  // message sending users for the day of `date` itself. For N=7, the value
  // corresponds to the number of unique active users on the day of `date` and
  // the six days before.
  //
  // This is how the query works: first we construct a matrix of all messages
  // and the numbers from 0 to N-1, and we call these numbers "shift". (So each
  // message is represented N times in the matrix, with a shift value of 0 to
  // N-1.) Then we add "shift" days to the message timestamp (we only take date
  // portion of the timestamp). So we now have N rows for each message, the
  // first having the date set to the day the message was written, and then
  // additional rows with the date set to the following N-1 days.
  //
  // Now we group these messages by their application ID (via the orgs table),
  // and their shifted dates. And for each appID/date combination we count the
  // number of unique message authors. Done.
  //
  // What we then have, is for any given appID/date combination, the number of
  // unique message authors of messages written on the given date, or the N-1
  // days before (because those messages all get the shift to the given date).
  return {
    query: `
      SELECT
        o."platformApplicationID" AS "applicationID",
        metrics_day(m.timestamp) + s.shift AS "date",
        COUNT(DISTINCT m."sourceID") AS "value"
      FROM (SELECT generate_series(0, $1-1) AS shift) s
      CROSS JOIN messages m
      INNER JOIN orgs o ON m."orgID"=o.id
      WHERE o."platformApplicationID" IS NOT NULL
      GROUP BY 1, 2`,
    bind: [windowDays],
  };
}

function usersActivated(windowDays: number): MetricQuery {
  // Calculate the "activated users" metric.
  //
  // First, collect all actions that happened in threads. That's messages
  // written or reactions made. The `thread_actions` subquery returns rows of
  // thread ids, user/org ids and dates of when things happened.
  //
  // Next, collect when a user was first active in a thread. Just by grouping
  // the previous results by thread/user/org and taking the earliest (minimum)
  // date.
  //
  // Then, calculate when we consider that a thread has become active. That's
  // when not the first but the second user did something in the thread. This is
  // not about a precise time, but just the day it happened. We are calculating
  // daily time series anyway, and also this means that when two users start and
  // comment on a thread the same day, they both count as activated, because
  // they both did something in a thread that is considered active on that day.
  // Just to clarify: once a thread has become active, it stays active. Meaning
  // that if on a later day a user writes/reacts in that thread, that user will
  // be considered activated, because they interacted with the thread in which
  // they are not alone. Even if nobody else was active in that thread on the
  // same day. On the other hand, when one user starts a thread and a second
  // user reacts or comments the next day, then the first user wasn't activated,
  // but the second was when they commented.
  //
  // Finally, we count the number of unique users in an application that were
  // activated on a given day, by collecting all the users that did something on
  // that day in a thread that had been active on the day or previously.
  //
  // For getting weekly/monthly number we do the same shifting as in the
  // `usersSentMessage` query above. So, say for the weekly metric, when a user
  // does a thing in a thread, we now act as if they did that thing on the day
  // they did it, and then they did it six more times on the following days. So,
  // if A starts a new thread on day 1, and B reacts on day 3, then A and B are
  // both activated on day 3. Also on day 4, 5, 6, 7. On day 8, 9, we only count
  // B as activated, because only B has been active within the time window of
  // one week.
  return {
    query: `
      WITH thread_actions AS NOT MATERIALIZED (
        SELECT DISTINCT
          "threadID",
          "sourceID" AS "userID",
          "orgID",
          metrics_day(timestamp) AS "day"
        FROM messages
        UNION
        SELECT m."threadID", mr."userID", m."orgID", metrics_day(mr.timestamp)
        FROM message_reactions mr INNER JOIN messages m ON mr."messageID"=m.id
      ), thread_user_first_action AS NOT MATERIALIZED (
        SELECT
          "threadID", "userID", "orgID",
          min("day") AS "day"
        FROM thread_actions GROUP BY 1, 2, 3
      ), thread_becomes_active AS (
        SELECT DISTINCT
          "threadID",
          nth_value(day, 2) OVER w AS day
        FROM thread_user_first_action
        WINDOW w AS (PARTITION BY "threadID" ORDER BY day ASC)
      )
      SELECT
        o."platformApplicationID" AS "applicationID",
        ta.day + s.shift AS "date",
        COUNT(DISTINCT ta."userID") AS "value"
      FROM (SELECT generate_series(0, $1-1) AS shift) s
      CROSS JOIN thread_actions ta
      INNER JOIN orgs o ON ta."orgID"=o.id
      INNER JOIN thread_becomes_active tba USING("threadID")
      WHERE o."platformApplicationID" IS NOT NULL
      AND ta.day >= tba.day
      GROUP BY 1, 2`,
    bind: [windowDays],
  };
}

function usersExposedToCord(windowDays: number): MetricQuery {
  // Calculate the number of unique users who have been exposed to ANY Cord component.
  // The weekly and monthly numbers are calculated using the same shifting logic seen in
  // `usersSentMessage`. If a user is exposed to a Cord component on one day then we also count
  // it as them being exposed to it every day following that day depending on the time window we have chosen.
  return {
    query: `
      SELECT
        e."platformApplicationID" AS "applicationID",
        metrics_day(e."serverTimestamp") + s.shift AS "date",
        COUNT(DISTINCT e."userID") AS "value"
      FROM (SELECT generate_series(0, $1-1) AS shift) s
      CROSS JOIN events e
      WHERE e."platformApplicationID" IS NOT NULL
      AND e.type = 'sdk-components-used'
      GROUP BY 1,2`,
    bind: [windowDays],
  };
}
