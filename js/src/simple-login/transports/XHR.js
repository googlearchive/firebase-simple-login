goog.provide('fb.simplelogin.transports.XHR');
goog.provide('fb.simplelogin.transports.XHR_');
goog.require('fb.simplelogin.transports.Transport');
goog.require('fb.simplelogin.Vars');
goog.require('fb.simplelogin.util.json');

/**
 * Create a new JSON connection with the given URL, options, and callback.
 * @constructor
 * @implements {fb.simplelogin.Transport}
 */
fb.simplelogin.transports.XHR_ = function() {};

/**
 * Opens a new connection using the specified URL and options.
 * Invokes the specified onComplete callback upon completion with error or result payload.
 * @param {string} url Request endpoint
 * @param {Object} options
 * @param {function(Object, Object)} onComplete Callback when messages arrive
 */
fb.simplelogin.transports.XHR_.prototype.open = function(url, data, onComplete) {
  var self = this;
  var options = {
    contentType : 'application/json'
  };

  var xhr = new XMLHttpRequest(),
      method = (options.method || 'GET').toUpperCase(),
      contentType = options.contentType || 'application/x-www-form-urlencoded',
      callbackInvoked = false,
      key;

  var callbackHandler = function() {
    if (!callbackInvoked && xhr.readyState === 4) {
      var data, error;
      callbackInvoked = true;
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || xhr.status == 1223) {
        try {
          data = fb.simplelogin.util.json.parse(xhr.responseText);
          error = data["error"] || null;
          delete data["error"];
        } catch (e) {
          error = "UNKNOWN_ERROR"
        }
      } else {
        error = "RESPONSE_PAYLOAD_ERROR";
      }
      return onComplete && onComplete(error, data);
    }
  };

  xhr.onreadystatechange = callbackHandler;

  if (data) {
    if (method === 'GET') {
      if (url.indexOf('?') === -1) {
        url += '?';
      }
      url += this.formatQueryString(data);
      data = null;
    } else {
      if (contentType === 'application/json') {
        data = fb.simplelogin.util.json.stringify(data);
      }
      if (contentType === 'application/x-www-form-urlencoded') {
        data = this.formatQueryString(data);
      }
    }
  }

  xhr.open(method, url, true);
  var headers = {
    'X-Requested-With' : 'XMLHttpRequest',
    'Accept'           : 'application/json;text/plain',
    'Content-Type'     : contentType
  };

  options.headers = options.headers || {};
  for (key in options.headers) {
    headers[key] = options.headers[key];
  }

  for (key in headers) {
    xhr.setRequestHeader(key, headers[key]);
  }

  xhr.send(data);
};

/**
 * Returns true if this XMLHttpRequest is supported.
 * @return {boolean}
 */
fb.simplelogin.transports.XHR_.prototype.isAvailable = function() {
  return window['XMLHttpRequest'] &&
         typeof window['XMLHttpRequest'] === 'function' &&
         !fb.simplelogin.util.env.isIeLT10();
};

/**
 * Returns the querystring-formatted Object (i.e. 'a=b&c=d')
 * @param {Object} data
 * @return {String}
 */
fb.simplelogin.transports.XHR_.prototype.formatQueryString = function(data) {
  if (!data) return '';

  var tokens = [];
  for (var key in data) {
    tokens.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
  }

  return tokens.join('&');
};

/**
 * Singleton for fb.simplelogin.transports.XHR_
 */
fb.simplelogin.transports.XHR = new fb.simplelogin.transports.XHR_();
