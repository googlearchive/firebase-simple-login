goog.provide('fb.simplelogin.SessionStore');
goog.provide('fb.simplelogin.SessionStore_');
goog.require('fb.simplelogin.util.env');


/**
 * Key for encrypted user payload in persistent storage.
 * @const
 * @type {string}
 */
var sessionPersistentStorageKey = 'firebaseSession';

var hasLocalStorage = fb.simplelogin.util.env.hasLocalStorage();

/**
 * @constructor
 */
fb.simplelogin.SessionStore_ = function() {};

/**
 * Store a session using LocalStorage.
 * @param {Object} session The user session data to persist.
 * @param {number=} opt_sessionLengthDays The number of days to persist the session for {optional}.
 */
fb.simplelogin.SessionStore_.prototype.set = function(session, opt_sessionLengthDays) {
  if (!hasLocalStorage) return;
  try {
    // Write session storage to LocalStorage.
    localStorage.setItem(sessionPersistentStorageKey, fb.simplelogin.util.json.stringify(session));
  } catch (e) {}
};

/**
 * Retrieve a session using LocalStorage.
 * @return {Object} The user session data.
 */
fb.simplelogin.SessionStore_.prototype.get = function() {
  if (!hasLocalStorage) return;
  try {
    var payload = localStorage.getItem(sessionPersistentStorageKey);
    if (payload) {
      var session = fb.simplelogin.util.json.parse(payload);
      return session;
    }
  } catch (e) {}
  return null;
};

/**
 * Wipe out any persisted session information.
 */
fb.simplelogin.SessionStore_.prototype.clear = function() {
  if (!hasLocalStorage) return;

  localStorage.removeItem(sessionPersistentStorageKey);
};

/**
 * Singleton for fb.simplelogin.SessionStore_
 */
fb.simplelogin.SessionStore = new fb.simplelogin.SessionStore_();
