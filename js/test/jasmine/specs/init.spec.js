/**
 * Include all global test dependencies here!
 * This file will be executed to define globals before any tests are run.
 */

var qs = {};
if ('location' in this) {
  var search = (this.location.search.substr(1) || '').split('&');
  for (var i = 0; i < search.length; ++i) {
    var parts = search[i].split('=');
    qs[parts[0]] = parts[1] || true;  // support for foo=
  }
}

FIREBASE_API_KEY = 1234;

TEST_NAMESPACE = qs.namespace || 'https://fb-login-tests.firebaseio.com';
TEST_AUTH_SERVER = qs.apiHost || 'https://auth.firebase.com';

TEST_TIMEOUT = 10000;

/**
 * Valid Facebook OAuth 2.0 Credentials
 *
 * Obtaining a long-lived (60-day) access token
 *
 * 1) Visit https://developers.facebook.com/tools/access_token/
 * 2) Grab a user token for the Firebase Auth. Test app
 * 3) Replace <YOUR-USER-ACCESS-TOKEN> in the URL below with your user token
 *     https://graph.facebook.com/oauth/access_token?&fb_exchange_token=<YOUR-USER-ACCESS-TOKEN>&client_id=<CLIENT-ID>&client_secret=<CLIENT-SECRET>&grant_type=fb_exchange_token
 * 4) Retrieve the long-lived token either by visiting that URL in your browser or retriving via cURL
 * 5) Debug your new token at https://developers.facebook.com/tools/debug/accesstoken to ensure it will live for 60 days
 *
 * See https://developers.facebook.com/roadmap/offline-access-removal/ for further details.
 */
TEST_FACEBOOK_ACCESS_TOKEN = null;

/**
 * Valid Twitter OAuth 1.0a Credentials
 *
 * Obtaining a set of access token
 *
 * 1) Get access to the Firebase Auth. Test app
 * 2) Visit https://dev.twitter.com/apps/<APP-ID>
 * 3) Scroll to the bottom of the page and copy the access tokens below
 */
TEST_TWITTER_USER_ID = null;
TEST_TWITTER_OAUTH_TOKEN = null;
TEST_TWITTER_OAUTH_TOKEN_SECRET = null;

/**
 * Valid Google OAuth 2.0 Credentials
 */
TEST_GOOGLE_ACCESS_TOKEN = null;


/* Keeps track of all the current asynchronous tasks being run */
function Checklist(items, expect, done) {
  var eventsToComplete = items;

  /* Removes a task from the events list */
  this.x = function(item) {
    var index = eventsToComplete.indexOf(item);
    if (index === -1) {
      expect("Attempting to delete unexpected item '" + item + "' from Checklist").toBeFalsy();
    }
    else {
      eventsToComplete.splice(index, 1);
      if (this.isEmpty()) {
        done();
      }
    }
  };

  /* Returns the length of the events list */
  this.length = function() {
    return eventsToComplete.length;
  };

  /* Returns true if the events list is empty */
  this.isEmpty = function() {
    return (this.length() === 0);
  };
};

/* Returns a random email address */
function generateRandomEmail() {
  var possibleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var numPossibleCharacters = possibleCharacters.length;

  var text = "";
  for (var i = 0; i < 10; i++) {
    text += possibleCharacters.charAt(Math.floor(Math.random() * numPossibleCharacters));
  }
  text += "@";
  for (var i = 0; i < 10; i++) {
    text += possibleCharacters.charAt(Math.floor(Math.random() * numPossibleCharacters));
  }
  text += ".com";

  return text;
}

/*****************************/
/*  CUSTOM JASMINE MATCHERS  */
/*****************************/
var customMatchers = {
  /* Returns true if the actual object's keys are identical to the expectedKeys */
  toOnlyHaveTheseKeys: function(util, customEqualityTesters) {
    return {
      compare: function(actual, expectedKeys) {
        var result = {};

        var actualKeys = Object.keys(actual);

        result.pass = (JSON.stringify(actualKeys.sort()) === JSON.stringify(expectedKeys.sort()));

        if (result.pass) {
          result.message = "Expected actual and expected keys to differ (" + JSON.stringify(actualKeys) + ")";
        } else {
          result.message = "Expected actual keys (" + JSON.stringify(actualKeys) + ") and expected keys (" + JSON.stringify(expectedKeys) + ") to be the same";
        }

        return result;
      }
    };
  }
};