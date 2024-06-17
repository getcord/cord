// The amount of time that we consider a continuous train of messages
// by a single message sender. If two messages are within this timeframe
// from one another, we'll render them as a single visual block. If the messages
// are further apart in time than this, we'll render them as two different blocks
// each with their own message timestamp, profile pic, etc.
export const CONTIGUOUS_MESSAGE_BLOCK_TIMEOUT_SECONDS = 90;

// Number of seconds that the undo button will be shown for after hiding an annotation
export const UNDO_HIDE_HOTSPOT_ANNOTATION_TIMEOUT_SECONDS = 5;

// How long a signed URL from S3 should be valid for
export const UPLOAD_URL_TTL_SECONDS = 60 * 5; // 5 minutes
export const DOWNLOAD_URL_TTL_SECONDS = 60 * 60 * 4; // 4 hours
export const DELETE_URL_TTL_SECONDS = 60 * 10; // 10 minutes

// Seconds until the typing indicator decays automatically
export const TYPING_TIMEOUT_TTL_SECONDS = 3;

// Number of seconds that need to pass since a given page has lost
// focus before we stop considering it the page the user is actively
// on/looking at.
export const PAGE_PRESENCE_LOSS_TTL_SECONDS = 30;

// Number of milliseconds between active presence pings to server.
export const PRESENCE_UPDATE_INTERVAL_MS =
  (PAGE_PRESENCE_LOSS_TTL_SECONDS * 1000) / 2;

// The minimum period between durable presence updates
export const DURABLE_PRESENCE_THROTTLE_MS = 60 * 1000; // 1 minute

// How often to poll annotation locationMatch type in MessageAnnotationElement
export const ANNOTATION_LOCATION_MATCH_INTERVAL_MS = 3000;
// Same, but for composer annotations and AnnotationPointers in delegate
export const FAST_ANNOTATION_LOCATION_MATCH_INTERVAL_MS = 1000;

export const SCREENSHOT_TRANSITION_IN_MS = 200;

export const ANNOTATION_POINTER_TRANSITION_OUT_MS = 150;

// How long annotation arrow should stick around before fading out (when adding to composer)
export const ANNOTATION_ARROW_ON_ADD_MS = 2000;

// After this many seconds, we assume the upload failed (e.g. because the user closed browser)
export const MAX_FILE_UPLOADING_TIME_SECONDS = 60;

// used in the set time out to pull the pop up out of view
export const SUCCESS_POP_UP_TIMEOUT_MS = 3000;
export const SUCCESS_POP_UP_TRANSITION_MS = 300;

// this needs to be smaller than TYPING_TIMEOUT_TTL_SECONDS
export const TYPING_USER_THROTTLE_MS = 2000;

export const THREAD_LAYOUT_ANIMATION_SECONDS = 0.25;

export const ACCESS_TOKEN_CLOCK_TOLERANCE_SECONDS = 30;
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day

// How long to keep a message ID when a user clicks a link to a message to a different page
// we use the message ID to focus that message when the page loads
export const DEEP_LINK_THREAD_ID_TTL_SECONDS = 30;

// How long to highlight a deepLinked message after we scroll to it
export const DEEP_LINK_MESSAGE_HIGHLIGHT_MS = 5000;

// Clients whose version was successfully deployed more than X days ago
// won't be able to communicate with the server. This is to avoid
// costantly bumping into errors when deprecating APIs.
export const CLIENT_VERSION_MAX_DAYS_OLD = 60;

export const QUERY_POLL_INTERVAL = 3000;

export const SAMPLE_TOKEN_EXPIRY_SECONDS = 24 * 60 * 60 * 7;

export const DOCS_TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 1 day
