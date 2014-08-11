goog.provide('fb.simplelogin.transports.JSONP');
goog.provide('fb.simplelogin.transports.JSONP_');
goog.require('fb.simplelogin.transports.Transport');
goog.require('fb.simplelogin.Vars');
goog.require('fb.simplelogin.util.json');

/**
 * Namespace to globally store and register completion callbacks on the `window` object.
 * @const
 * @type {string}
 */
var CALLBACK_NAMESPACE = '_FirebaseSimpleLoginJSONP';

/**
 * Create a new JSON connection with the given URL, options, and callback.
 * @constructor
 * @implements {fb.simplelogin.Transport}
 */
fb.simplelogin.transports.JSONP_ = function() {
  window[CALLBACK_NAMESPACE] = window[CALLBACK_NAMESPACE] || {};
};

/**
 * Opens a new connection using the specified URL and options.
 * Invokes the specified onComplete callback upon completion with error or result payload.
 * @param {string} url Request endpoint
 * @param {Object} options Callback when messages arrive
 * @param {function(Object, Object)} onComplete Callback when messages arrive
 */
fb.simplelogin.transports.JSONP_.prototype.open = function(url, options, onComplete) {
  url += /\?/.test(url) ? '' : '?';
  url += '&transport=jsonp';
  for (var param in options) {
    url += '&' + encodeURIComponent(param) + '=' + encodeURIComponent(options[param]);
  }

  var callbackId = this.generateRequestId_();
  url += '&callback=' + encodeURIComponent(CALLBACK_NAMESPACE + '.' + callbackId);

  this.registerCallback_(callbackId, onComplete);

  this.writeScriptTag_(callbackId, url, onComplete);
};


/**
 * @private
 */
fb.simplelogin.transports.JSONP_.prototype.generateRequestId_ = function() {
  return '_FirebaseJSONP' + new Date().getTime() + Math.floor(Math.random()*100);
};

/**
 * @private
 */
fb.simplelogin.transports.JSONP_.prototype.registerCallback_ = function(id, callback) {
  var self = this;

  window[CALLBACK_NAMESPACE][id] = function(result) {
    var error = result['error'] || null;
    delete result['error'];
    callback(error, result);
    self.removeCallback_(id);
  };
};

/**
 * @private
 */
fb.simplelogin.transports.JSONP_.prototype.removeCallback_ = function(id) {
  setTimeout(function() {
    delete window[CALLBACK_NAMESPACE][id];
    var el = document.getElementById(id);
    if (el) {
      el.parentNode.removeChild(el);
    }
  }, 0);
};

/**
 * @private
 */
fb.simplelogin.transports.JSONP_.prototype.writeScriptTag_ = function(id, url, cb) {
  var self = this;

  setTimeout(function() {
    try {
      var js = document.createElement('script');
      js.type = 'text/javascript';
      js.id = id;
      js.async = true;
      js.src = url;
      js.onerror = function() {
        var el = document.getElementById(id);
        if (el !== null) {
          el.parentNode.removeChild(el);
        }
        cb && cb(self.formatError_({ code: 'SERVER_ERROR', message: 'An unknown server error occurred.' }));
      };
      document.getElementsByTagName('head')[0].appendChild(js);
    } catch (e) {
      cb && cb(self.formatError_({ code: 'SERVER_ERROR', message: 'An unknown server error occurred.' }));
    }
  }, 0);
};

/**
 * @private
 */
fb.simplelogin.transports.JSONP_.prototype.formatError_ = function(error) {
  var errorObj;

  if (!error) {
    errorObj = new Error();
    errorObj.code = 'UNKNOWN_ERROR';
  } else {
    errorObj = new Error(error.message);
    errorObj.code = error.code || 'UNKNOWN_ERROR';
  }
  return errorObj;
};

/**
 * Singleton for fb.simplelogin.transports.JSONP_
 */
fb.simplelogin.transports.JSONP = new fb.simplelogin.transports.JSONP_();
