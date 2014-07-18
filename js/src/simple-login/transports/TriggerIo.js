goog.provide("fb.simplelogin.transports.TriggerIoTab");
goog.provide("fb.simplelogin.transports.TriggerIoTab_");
goog.require('fb.simplelogin.transports.Popup');
goog.require('fb.simplelogin.Vars');
goog.require('fb.simplelogin.util.json');
goog.require('fb.simplelogin.util.misc');

/**
 * @constructor
 * @implements {fb.simplelogin.Popup}
 */
fb.simplelogin.transports.TriggerIoTab_ = function() {};

/**
 * Opens a new tab overlay using the Trigger.io Tabs modules.
 *
 * @param {String} url Popup endpoint
 * @param {Object} options Object of multiple options
 * @param {function(Object, Object)} onComplete Callback when popup-flow completes
 */
fb.simplelogin.transports.TriggerIoTab_.prototype.open = function(url, options, onComplete) {
  var Forge, Tabs;

  // Validate that the Trigger.io Tabs module is accessible from the current context.
  try {
    Forge = window['forge'];
    Tabs = Forge['tabs'];
  } catch (err) {
    return onComplete({ code: 'TRIGGER_IO_TABS', message: '"forge.tabs" module required when using Firebase Simple Login and Trigger.io' });
  }

  callbackInvoked = false;
  var callbackHandler = function() {
    var args = Array.prototype.slice.apply(arguments);
    if (!callbackInvoked) {
      callbackInvoked = true;
      onComplete.apply(null, args);
    }
  };

  forge.tabs.openWithOptions({
    url     : url + '&transport=internal-redirect-hash',
    pattern : fb.simplelogin.Vars.getApiHost() + '/blank/page*'
  }, function(data) {
    var result;
    if (data && data['url']) {
      try {
        var urlObj = fb.simplelogin.util.misc.parseUrl(data['url']);
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
      callbackHandler({ code: 'RESPONSE_PAYLOAD_ERROR', message: 'Unable to parse response payload for Trigger.io.' });
    }
  }, function(err) {
    callbackHandler({ code: 'UNKNOWN_ERROR', message: 'An unknown error occurred for Trigger.io.' });
  });
};

/**
 * Singleton for fb.simplelogin.transports.TriggerIoTab_
 */
fb.simplelogin.transports.TriggerIoTab = new fb.simplelogin.transports.TriggerIoTab_();
