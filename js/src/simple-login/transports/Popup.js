goog.provide('fb.simplelogin.transports.Popup');
goog.require('fb.simplelogin.transports.Transport');

/**
 * @interface
 * @extends fb.simplelogin.transports.Transport
 */
fb.simplelogin.Popup = function() {};

/**
 * Opens a new popup using the specified URL and options.
 * Invokes the specified onComplete callback upon completion with error or result payload.
 * @param {string} url Request endpoint
 * @param {Object} options Callback when messages arrive
 * @param {function(Object, Object)} onComplete Callback when messages arrive
 */
fb.simplelogin.Popup.prototype.open = function(url, options, onComplete) {};
