/**
 * mixpanel.js
 * Central Mixpanel analytics module — server-side Node.js
 *
 * Usage:
 *   const analytics = require('./analytics/mixpanel');
 *   analytics.init();
 *   analytics.trackSignUp(userId, { sign_up_method: 'email' });
 *   analytics.trackItemCreated(userId, { item_type: 'document' });
 */

const Mixpanel = require('mixpanel');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TOKEN =
  process.env.MIXPANEL_TOKEN ||
  (process.env.NODE_ENV === 'production'
    ? '47fac8a25bc9bd4269790f2210198f54'   // production token
    : '47fac8a25bc9bd4269790f2210198f54'); // swap for a dev token when available

let client = null;

// ---------------------------------------------------------------------------
// Consent helpers
// ---------------------------------------------------------------------------
// Because EU / California user status is unknown, tracking is guarded behind
// an explicit consent flag.  Set `user.analyticsConsent = true` after the
// user accepts your cookie / privacy banner before calling any track* method.

/**
 * Returns true when tracking is allowed for this request context.
 * @param {{ analyticsConsent?: boolean }} context
 */
function hasConsent(context = {}) {
  // If you later confirm no EU/CA users are possible, you can simplify this
  // to always return `true` and remove the guard from every call site.
  return context.analyticsConsent === true;
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

function init() {
  if (client) return client;

  client = Mixpanel.init(TOKEN, {
    protocol: 'https',
    // Set to true to see every outbound event logged to stdout during dev
    debug: process.env.NODE_ENV !== 'production',
  });

  console.log('[Mixpanel] Initialised for env:', process.env.NODE_ENV || 'development');
  return client;
}

function getClient() {
  if (!client) init();
  return client;
}

// ---------------------------------------------------------------------------
// Identity helpers
// ---------------------------------------------------------------------------

/**
 * Set or update a user profile.
 * Always call this AFTER creating the user in your database.
 *
 * @param {string} userId   - Your stable database primary key (NOT email)
 * @param {object} props    - Profile attributes to set
 */
function identifyUser(userId, props = {}) {
  getClient().people.set(userId, {
    $created: new Date().toISOString(),
    ...props,
  });
}

/**
 * Call on logout to sever the session link.
 * On the server side there is no persistent SDK state, so this is a no-op —
 * just ensure you discard / invalidate any stored distinct_id in your session.
 */
function resetUser() {
  // No-op on server. Handled by discarding the session / distinct_id.
}

// ---------------------------------------------------------------------------
// Super-property helper
// ---------------------------------------------------------------------------

/**
 * Merge platform-level properties into every event payload.
 * Keep this lean — these appear on every single event.
 */
function superProps() {
  return {
    platform: 'server',
    app_version: process.env.APP_VERSION || 'unknown',
    node_env: process.env.NODE_ENV || 'development',
  };
}

// ---------------------------------------------------------------------------
// Core track helper (internal)
// ---------------------------------------------------------------------------

/**
 * @param {string} eventName
 * @param {string} distinctId
 * @param {object} props
 */
function track(eventName, distinctId, props = {}) {
  getClient().track(eventName, {
    distinct_id: distinctId,
    $insert_id: `${distinctId}-${eventName}-${Date.now()}`, // deduplication key
    time: Math.floor(Date.now() / 1000),
    ...superProps(),
    ...props,
  });
}

// ---------------------------------------------------------------------------
// Event: sign_up_completed
// ---------------------------------------------------------------------------
// Trigger : immediately after the user record is created in the database
// Order   : create DB record → identifyUser() → trackSignUp()

/**
 * @param {string} userId
 * @param {{ sign_up_method: string, referral_source?: string }} props
 * @param {{ analyticsConsent: boolean }} context
 */
function trackSignUp(userId, props = {}, context = {}) {
  if (!hasConsent(context)) return;

  // Wire up the user profile first
  identifyUser(userId, {
    $name: props.name,
    $email: props.email,
    sign_up_method: props.sign_up_method,
  });

  track('sign_up_completed', userId, {
    sign_up_method: props.sign_up_method || 'unknown', // 'email' | 'google' | 'apple' | 'sso'
    platform: 'server',
    referral_source: props.referral_source || null,
  });
}

// ---------------------------------------------------------------------------
// Event: item_created  (Value Moment)
// ---------------------------------------------------------------------------
// Trigger : immediately after an item is successfully persisted in the DB.
// This is your Value Moment — the action that most signals a user is getting
// real value from your product. Rename "item" to your domain noun (e.g.
// "project", "report", "document", "transaction") and update the event name
// and properties accordingly.

/**
 * @param {string} userId
 * @param {{ item_type: string, item_id: string, [key: string]: any }} props
 * @param {{ analyticsConsent: boolean }} context
 */
function trackItemCreated(userId, props = {}, context = {}) {
  if (!hasConsent(context)) return;

  track('item_created', userId, {
    item_type: props.item_type || 'unknown',  // e.g. 'document' | 'report'
    item_id: props.item_id || null,
    ...props,
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  init,
  identifyUser,
  resetUser,
  trackSignUp,
  trackItemCreated,
  // Expose the raw track helper for adding new events without touching this file
  track,
  hasConsent,
};
