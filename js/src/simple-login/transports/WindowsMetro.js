goog.provide("fb.simplelogin.transports.WindowsMetroAuthBroker");
goog.provide("fb.simplelogin.transports.WindowsMetroAuthBroker_");
goog.require('fb.simplelogin.transports.Popup');
goog.require('fb.simplelogin.Vars');
goog.require('fb.simplelogin.util.json');
goog.require('fb.simplelogin.util.misc');

/**
 * @constructor
 * @implements {fb.simplelogin.Popup}
 */
fb.simplelogin.transports.WindowsMetroAuthBroker_ = function() {};

/**
 * Opens a new overlay using the Windows Metro WebAuthenticationBroker.
 * Invokes the specified onComplete callback upon completion with error or result payload.
 * @param {String} url Popup endpoint
 * @param {Object} options Object of multiple options
 * @param {function(Object, Object)} onComplete Callback when popup-flow completes
 */
fb.simplelogin.transports.WindowsMetroAuthBroker_.prototype.open = function(url, options, onComplete) {
  var Uri, WebAuthenticationOptions, WebAuthenticationBroker, authenticateAsync, callbackInvoked, callbackHandler;

  // Validate that the Windows Metro WebAuthenticationBroker and relevant classes are accessible from the current context.
  try {
    Uri = window['Windows']['Foundation']['Uri'];
    WebAuthenticationOptions = window['Windows']['Security']['Authentication']['Web']['WebAuthenticationOptions'];
    WebAuthenticationBroker = window['Windows']['Security']['Authentication']['Web']['WebAuthenticationBroker'];
    authenticateAsync = WebAuthenticationBroker['authenticateAsync'];
  } catch (err) {
    return onComplete({ code: 'WINDOWS_METRO', message: '"Windows.Security.Authentication.Web.WebAuthenticationBroker" required when using Firebase Simple Login in Windows Metro context' });
  }

  callbackInvoked = false;
  var callbackHandler = function() {
    var args = Array.prototype.slice.apply(arguments);
    if (!callbackInvoked) {
      callbackInvoked = true;
      onComplete.apply(null, args);
    }
  };

  var startUri = new Uri(url + '&transport=internal-redirect-hash');
  var endUri = new Uri(fb.simplelogin.Vars.getApiHost() + '/blank/page.html');

  authenticateAsync(WebAuthenticationOptions['none'], startUri, endUri)
    .done(function(data) {
      var result;
      if (data && data['responseData']) {
        try {
          var urlObj = fb.simplelogin.util.misc.parseUrl(data["responseData"]);
          var urlHashEncoded = fb.simplelogin.util.misc.parseQuerystring(urlObj['hash']);
          var temporaryResult = {};
          for (var key in urlHashEncoded) {
            temporaryResult[key] = fb.simplelogin.util.json.parse(decodeURIComponent(urlHashEncoded[key]));
          }
          result = temporaryResult;
        } catch (e) {}
      }

      if (result && result['token'] && result['user']) {
        callbackHandler(null, result);
      } else if (result && result['error']) {
        callbackHandler(result['error']);
      } else {
        callbackHandler({ code: 'RESPONSE_PAYLOAD_ERROR', message: 'Unable to parse response payload for Windows.' });
      }
    }, function(err) {
      callbackHandler({ code: 'UNKNOWN_ERROR', message: 'An unknown error occurred for Windows.' });
    });
};

/**
 * Singleton for fb.simplelogin.transports.WindowsMetroAuthBroker_
 */
fb.simplelogin.transports.WindowsMetroAuthBroker = new fb.simplelogin.transports.WindowsMetroAuthBroker_();
