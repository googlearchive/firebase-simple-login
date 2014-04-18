goog.provide('fb.simplelogin.util.misc');
goog.require('goog.json');

/**
 * Evaluates a JSON string into a javascript object.
 *
 * @param {string} url A valid URL
 * @return {Object} An object representing the parsed URL
 */
fb.simplelogin.util.misc.parseUrl = function(url) {
  var a = document.createElement('a');
  a.href = url;
  return {
    protocol : a.protocol.replace(':',''),
    host     : a.hostname,
    port     : a.port,
    query    : a.search,
    params   : fb.simplelogin.util.misc.parseQuerystring(a.search),
    hash     : a.hash.replace('#',''),
    path     : a.pathname.replace(/^([^\/])/,'/$1')
  };
};

/**
 * Evaluates a query string into a JavaScript object.
 *
 * @param {string} url A valid query string
 * @return {Object} An object representing the parsed query string
 */
fb.simplelogin.util.misc.parseQuerystring = function(str) {
  var obj = {};
  var tokens = str.replace(/^\?/,'').split('&');

  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i]) {
      var key = tokens[i].split('=');
      obj[key[0]] = key[1];
    }
  }

  return obj;
};

/**
 * Retrieves the subdomain from a URL.
 *
 * @param {String} url A valid URL
 * @return {String} The Firebase name
 */
fb.simplelogin.util.misc.parseSubdomain = function(url) {
  var subdomain = '';
  try {
    var obj = fb.simplelogin.util.misc.parseUrl(url);
    var tokens = obj.host.split('.');
    if (tokens.length > 2) {
      subdomain = tokens.slice(0, -2).join('.');
    }
  } catch(e) {}
  return subdomain;
};

/**
 * Logs message using using console.warn if it exists
 * or console.log otherwise.
 *
 * @param {String} message The message to log
 */
fb.simplelogin.util.misc.warn = function(message) {
  if (typeof console !== 'undefined') {
    if (typeof console.warn !== 'undefined') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }
};
