goog.provide('FirebaseSimpleLogin');
goog.require('fb.simplelogin.client');
goog.require('fb.simplelogin.util.validation');

/**
 * @constructor
 * @export
 */
FirebaseSimpleLogin = function(ref, cb, context, apiHost) {
  var method = 'new FirebaseSimpleLogin';
  fb.simplelogin.util.validation.validateArgCount(method, 1, 4, arguments.length);
  fb.simplelogin.util.validation.validateCallback(method, 2, cb, false);

  if (goog.isString(ref)) {
    throw new Error('new FirebaseSimpleLogin(): Oops, it looks like you passed a string ' +
                    'instead of a Firebase reference (i.e. new Firebase(<firebaseURL>)).');
  }

  var firebase = fb.simplelogin.util.misc.parseSubdomain(ref.toString());

  if (!goog.isString(firebase)) {
    throw new Error('new FirebaseSimpleLogin(): First argument must be a valid Firebase ' +
                    'reference (i.e. new Firebase(<firebaseURL>)).');
  }

  var client_ = new fb.simplelogin.client(ref, cb, context, apiHost);

  return {
    'setApiHost': function(apiHost) {
      var method = 'FirebaseSimpleLogin.setApiHost';
      fb.simplelogin.util.validation.validateArgCount(method, 1, 1, arguments.length);
      return client_.setApiHost(apiHost);
    },

    'login': function() {
      return client_.login.apply(client_, arguments);
    },

    'logout': function() {
      var methodId = 'FirebaseSimpleLogin.logout';
      fb.simplelogin.util.validation.validateArgCount(methodId, 0, 0, arguments.length);
      return client_.logout();
    },

    'createUser': function(email, password, cb) {
      var method = 'FirebaseSimpleLogin.createUser';
      fb.simplelogin.util.validation.validateArgCount(method, 2, 3, arguments.length);
      fb.simplelogin.util.validation.validateCallback(method, 3, cb, true);
      return client_.createUser(email, password, cb);
    },

    'changePassword': function(email, oldPassword, newPassword, cb) {
      var method = 'FirebaseSimpleLogin.changePassword';
      fb.simplelogin.util.validation.validateArgCount(method, 3, 4, arguments.length);
      fb.simplelogin.util.validation.validateCallback(method, 4, cb, true);
      return client_.changePassword(email, oldPassword, newPassword, cb);
    },

    'removeUser': function(email, password, cb) {
      var method = 'FirebaseSimpleLogin.removeUser';
      fb.simplelogin.util.validation.validateArgCount(method, 2, 3, arguments.length);
      fb.simplelogin.util.validation.validateCallback(method, 3, cb, true);
      return client_.removeUser(email, password, cb);
    },

    'sendPasswordResetEmail': function(email, cb) {
      var method = 'FirebaseSimpleLogin.sendPasswordResetEmail';
      fb.simplelogin.util.validation.validateArgCount(method, 1, 2, arguments.length);
      fb.simplelogin.util.validation.validateCallback(method, 2, cb, true);
      return client_.sendPasswordResetEmail(email, cb);
    }
  };
};

/**
 * Static, public WinChan transport channel invoked in Simple Login popups
 * @export
 */
FirebaseSimpleLogin.onOpen = function(cb) {
  fb.simplelogin.client.onOpen(cb);
};

FirebaseSimpleLogin.VERSION = fb.simplelogin.client.VERSION();
