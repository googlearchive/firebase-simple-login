goog.provide('fb.simplelogin.transports.Transport');

/**
 * @interface
 */
fb.simplelogin.Transport = function() {};

/**
 * Opens a new connection using the specified URL and options.
 * Invokes the specified onComplete callback upon completion with error or result payload.
 * @param {string} url Request endpoint
 * @param {Object} options Callback when messages arrive
 * @param {function(Object, Object)} onComplete Callback when messages arrive
 */
fb.simplelogin.Transport.prototype.open = function(url, options, onComplete) {};
