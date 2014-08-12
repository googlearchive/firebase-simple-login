goog.provide('fb.simplelogin.Errors');

/**
 * Preface error messages with a constant identifying this lib.
 * @const
 * @type {string}
 */
var messagePrefix = 'FirebaseSimpleLogin: ';

/**
 * Object mapping error keys to longer messages.
 * @const
 * @type {Object}
 */
var errors = {
  'UNKNOWN_ERROR'           : 'An unknown error occurred.',
  'INVALID_EMAIL'           : 'Invalid email specified.',
  'INVALID_PASSWORD'        : 'Invalid password specified.',
  'USER_DENIED'             : 'User cancelled the authentication request.',
  'RESPONSE_PAYLOAD_ERROR'  : 'Unable to parse response payload.',
  'TRIGGER_IO_TABS'         : 'The "forge.tabs" module required when using Firebase Simple Login and \
                              Trigger.io. Without this module included and enabled, login attempts to \
                              OAuth authentication providers will not be able to complete.'
};

fb.simplelogin.Errors.format = function(errorCode, errorMessage) {
  var code,
      message,
      data = {},
      args = arguments;

  if (args.length === 2) {
    // If we got an error code and message, use both of them
    code = args[0];
    message = args[1];
  } else if (args.length === 1) {
    if (typeof args[0] === 'object' && args[0].code && args[0].message) {
      // If we got an actual error object, use the data it contains
      if (args[0].message.indexOf(messagePrefix) === 0) {
        // If this error has already previously been formatted, just return it
        return args[0];
      }
      code = args[0].code;
      message = args[0].message;
      data = args[0].data;
    } else if (typeof args[0] === 'string') {
      // If we just got an error code as a string, look up its corresponding message
      code = args[0];
      message = errors[code];
    }
  } else {
    // If we got nothing, set the error as unknown
    code = 'UNKNOWN_ERROR';
    message = errors[code];
  }

  var error = new Error(messagePrefix + message);
  error.code = code;
  if (data) {
    error.data = data;
  }
  return error;
};
