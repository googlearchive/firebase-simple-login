goog.provide('fb.simplelogin.transports.Redirect');
goog.require('fb.simplelogin.transports.Transport');

/**
 * @extends fb.simplelogin.transports.Transport
 */
fb.simplelogin.Redirect = function() {};

/**
 * Initiates a redirect flow back to the specified page.
 * Invokes the specified onComplete callback upon completion with error or result payload.
 * @param {string} url Request endpoint
 * @param {Object} options Callback when messages arrive
 * @param {function(Object, Object)} onComplete Callback when messages arrive
 */
fb.simplelogin.Redirect.prototype.open = function(url, options, onComplete) {
  window.location = url;  
};
