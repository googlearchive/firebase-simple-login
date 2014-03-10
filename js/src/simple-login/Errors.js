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
  'UNKNOWN_ERROR'    : 'An unknown error occurred.',
  'INVALID_EMAIL'    : 'Invalid email specified.',
  'INVALID_PASSWORD' : 'Invalid password specified.',
  'USER_DENIED'      : 'User cancelled the authentication request.',
  'TRIGGER_IO_TABS'  : 'The "forge.tabs" module required when using Firebase Simple Login and \
                        Trigger.io. Without this module included and enabled, login attempts to \
                        OAuth authentication providers will not be able to complete.'
};

fb.simplelogin.Errors.format = function(errorCode, errorMessage) {
  var code = errorCode || 'UNKNOWN_ERROR',
      message = errorMessage || errors[code],
      data = {},
      args = arguments;

  if (args.length === 2) {
    code = args[0];
    message = args[1];
  } else if (args.length === 1) {
    if (typeof args[0] === 'object' && args[0].code && args[0].message) {
      code = args[0].code;
      message = args[0].message;
      data = args[0].data;
    } else if (typeof args[0] === 'string') {
      code = args[0];
      message = '';
    }
  }

  var error = new Error(messagePrefix + message);
  error.code = code;
  if (data) {
    error.data = data;
  }
  return error;
};

fb.simplelogin.Errors.get = function(code) {
  if (!errors[code]) code = 'UNKNOWN_ERROR';
  return fb.simplelogin.Errors.format(code, errors[code]);
};
