goog.provide('fb.simplelogin.util.json');
goog.require('goog.json');

/**
 * Evaluates a JSON string into a javascript object.
 * @param {string} str A string containing JSON.
 * @return {*} The javascript object representing the specified JSON.
 */
fb.simplelogin.util.json.parse = function(str) {
  if (typeof JSON !== 'undefined' && goog.isDef(JSON.parse)) {
    return JSON.parse(str);
  } else {
    return goog.json.parse(str);
  }
};

/**
 * Returns JSON representing a javascript object.
 * @param {Object} data Javascript object to be stringified.
 * @return {string} The JSON contents of the object.
 */
fb.simplelogin.util.json.stringify = function(data) {
  if (typeof JSON !== 'undefined' && goog.isDef(JSON.stringify))
    return JSON.stringify(data);
  else
    return goog.json.serialize(data);
};
