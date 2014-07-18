goog.provide("fb.simplelogin.transports.CordovaInAppBrowser");
goog.provide("fb.simplelogin.transports.CordovaInAppBrowser_");
goog.require('fb.simplelogin.transports.Popup');
goog.require('fb.simplelogin.Vars');
goog.require('fb.simplelogin.util.json');
goog.require('fb.simplelogin.util.misc');

/**
 * Popup window timeout before close.
 * @const
 * @type {number}
 */
var popupTimeout = 120000;

/**
 * @constructor
 * @implements {fb.simplelogin.Popup}
 */
fb.simplelogin.transports.CordovaInAppBrowser_ = function() {};

/**
 * Opens a new tab overlay using the Cordova / PhoneGap InAppBrower.
 * Invokes the specified onComplete callback upon completion with error or result payload.
 * @param {string} url Request endpoint
 * @param {Object} options Callback when messages arrive
 * @param {function(Object, Object)} onComplete Callback when messages arrive
 */
fb.simplelogin.transports.CordovaInAppBrowser_.prototype.open = function(url, options, onComplete) {
  callbackInvoked = false;
  var callbackHandler = function() {
    var args = Array.prototype.slice.apply(arguments);
    if (!callbackInvoked) {
      callbackInvoked = true;
      onComplete.apply(null, args);
    }
  };

  var windowRef = window['open'](url + '&transport=internal-redirect-hash', 'blank', 'location=no');

  windowRef.addEventListener('loadstop', function(event) {
    var result;
    if (event && event['url']) {
      var urlObj = fb.simplelogin.util.misc.parseUrl(event['url']);
      if (urlObj['path'] !== '/blank/page.html') {
        return;
      }

      windowRef.close();

      try {
        var urlHashEncoded = fb.simplelogin.util.misc.parseQuerystring(urlObj['hash']);
        var temporaryResult = {};
        for (var key in urlHashEncoded) {
          temporaryResult[key] = fb.simplelogin.util.json.parse(decodeURIComponent(urlHashEncoded[key]));
        }
        result = temporaryResult;
      } catch (e) {}

      if (result && result['token'] && result['user']) {
        callbackHandler(null, result);
      } else if (result && result['error']) {
        callbackHandler(result['error']);
      } else {
        callbackHandler({ code: 'RESPONSE_PAYLOAD_ERROR', message: 'Unable to parse response payload for PhoneGap.' });
      }
    }
  });

  windowRef.addEventListener('exit', function (event) {
    callbackHandler({ code: 'USER_DENIED', message: 'User cancelled the authentication request.' });
  });

  setTimeout(function() {
    if (windowRef && windowRef['close']) {
      windowRef['close']();
    }
  }, popupTimeout);
};

/**
 * Singleton for fb.simplelogin.transports.CordovaInAppBrowser_
 */
fb.simplelogin.transports.CordovaInAppBrowser = new fb.simplelogin.transports.CordovaInAppBrowser_();
