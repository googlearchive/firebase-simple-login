goog.provide('fb.simplelogin.SessionStore');
goog.provide('fb.simplelogin.SessionStore_');
goog.require('fb.simplelogin.util.env');
goog.require('goog.net.cookies');

/**
 * Session cookie storage path.
 * @const
 * @type {string}
 */
var cookieStoragePath = '/';

/**
 * Session cookie storage key.
 * @const
 * @type {string}
 */
var encryptionStorageKey = 'firebaseSessionKey';

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
 * Store a session using a combination of cookies and LocalStorage.
 * @param {Object} session The user session data to persist.
 * @param {number=} opt_sessionLengthDays The number of days to persist the session for {optional}.
 */
fb.simplelogin.SessionStore_.prototype.set = function(session, opt_sessionLengthDays) {
  if (!hasLocalStorage) return;

  // TODO: Use goog.storage.EncryptedStorage with goog.storage.ExpiringStorage for this task.
  try {
    var sessionEncryptionKey = session['sessionKey'];
    var payload = sjcl.encrypt(sessionEncryptionKey, fb.simplelogin.util.json.stringify(session));

    // Write LocalStorage portion of session storage, including encrypted user payload.
    localStorage.setItem(sessionPersistentStorageKey, fb.simplelogin.util.json.stringify(payload));

    // Write cookie portion of session storage, including key for payload in LocalStorage.
    var maxAgeSeconds = (opt_sessionLengthDays) ? opt_sessionLengthDays * 86400 : -1;
    goog.net.cookies.set(encryptionStorageKey, sessionEncryptionKey, maxAgeSeconds, cookieStoragePath, /* domain */ null, /* secure */ false);
  } catch (e) {}
};

/**
 * Retrieve a session using a combination of cookies and LocalStorage.
 * @return {Object} The user session data.
 */
fb.simplelogin.SessionStore_.prototype.get = function() {
  if (!hasLocalStorage) return;

  try {
    var sessionEncryptionKey = goog.net.cookies.get(encryptionStorageKey);
    var payload = localStorage.getItem(sessionPersistentStorageKey);
    if (sessionEncryptionKey && payload) {
      var session = fb.simplelogin.util.json.eval(sjcl.decrypt(sessionEncryptionKey, fb.simplelogin.util.json.eval(payload)));
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
  goog.net.cookies.remove(encryptionStorageKey, cookieStoragePath, /* domain */ null)
};

/**
 * Singleton for fb.simplelogin.SessionStore_
 */
fb.simplelogin.SessionStore = new fb.simplelogin.SessionStore_();
