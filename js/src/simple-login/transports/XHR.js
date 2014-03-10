goog.provide('fb.simplelogin.transports.XHR');
goog.provide('fb.simplelogin.transports.XHR_');
goog.require('fb.simplelogin.transports.Transport');
goog.require('fb.simplelogin.Vars');
goog.require('fb.simplelogin.util.json');
goog.require('goog.net.XhrIo');
goog.require('goog.events');
goog.require('goog.json');

/**
 * Create a new JSON connection with the given URL, options, and callback.
 * @constructor
 * @implements {fb.simplelogin.Transport}
 */
fb.simplelogin.transports.XHR_ = function() {
  window[CALLBACK_NAMESPACE] = window[CALLBACK_NAMESPACE] || {};
};

/**
 * Opens a new connection using the specified URL and options.
 * Invokes the specified onComplete callback upon completion with error or result payload.
 * @param {string} url Request endpoint
 * @param {Object} options
 * @param {function(Object, Object)} onComplete Callback when messages arrive
 */
fb.simplelogin.transports.XHR_.prototype.open = function(url, options, onComplete) {
  var self = this;
  var request = new goog.net.XhrIo();
   
  goog.events.listen(request, 'complete', function() {
    if (request.isSuccess()){
      var data = request.getResponseJson();
      var error = data['error'] || null;
      delete data['error'];
      onComplete && onComplete(error, data);
    } else {
      onComplete && onComplete(self.formatError_({ code: 'SERVER_ERROR', message: 'An unknown server error occurred.' }));
    }
  });

  url += '?';
  for (var key in options) {
    url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(options[key]);
  }

  request.send(url, 'GET', null, {
    'content-type' : 'application/json'
  });
};

/**
 * Returns true if this XMLHttpRequest is supported.
 * @return {boolean} 
 */
fb.simplelogin.transports.XHR_.prototype.isAvailable = function() {
  return window['XMLHttpRequest'] && typeof window['XMLHttpRequest'] === 'function';
};

/**
 * @private
 */
fb.simplelogin.transports.XHR_.prototype.formatError_ = function(error) {
  var errorObj = new Error(error.message || '');
  errorObj.code = error.code || 'UNKNOWN_ERROR';
  return errorObj;
};

/**
 * Singleton for fb.simplelogin.transports.XHR_
 */
fb.simplelogin.transports.XHR = new fb.simplelogin.transports.XHR_();
