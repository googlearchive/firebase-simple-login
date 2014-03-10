goog.provide('FirebaseSimpleLogin');
goog.require('fb.simplelogin.client');
goog.require('fb.simplelogin.util.env');
goog.require('fb.simplelogin.util.json');
goog.require('fb.simplelogin.util.validation');
goog.require('fb.simplelogin.util.sjcl');

goog.require("fb.simplelogin.Vars");
goog.require("fb.simplelogin.Errors");
goog.require("fb.simplelogin.SessionStore");

goog.require("fb.simplelogin.providers.Persona");
goog.require("fb.simplelogin.providers.Password");

goog.require("fb.simplelogin.transports.JSONP");
goog.require("fb.simplelogin.transports.CordovaInAppBrowser");
goog.require("fb.simplelogin.transports.TriggerIoTab");
goog.require("fb.simplelogin.transports.WinChan");
goog.require("fb.simplelogin.transports.WindowsMetroAuthBroker");


/**
 * @constructor
 * @export
 */
FirebaseSimpleLogin = function(ref, cb, context, apiHost) {
  var method = 'new FirebaseSimpleLogin';
  fb.simplelogin.util.validation.validateArgCount(method, 1, 4, arguments.length);
  fb.simplelogin.util.validation.validateCallback(method, 2, cb, false);

  if (goog.isString(ref)) {
    throw new Error('new FirebaseSimpleLogin(): Oops, it looks like you passed a string instead of a Firebase reference (i.e. new Firebase(<firebaseURL>)).')
  }

  var client_ = new fb.simplelogin.client(ref, cb, context, apiHost);

  return {
    setApiHost: function(apiHost) {
      var method = 'FirebaseSimpleLogin.setApiHost';
      fb.simplelogin.util.validation.validateArgCount(method, 1, 1, arguments.length);
      client_.setApiHost(apiHost);
    },

    login: function() {
      client_.login.apply(client_, arguments);
    },

    logout: function() {
      var methodId = 'FirebaseSimpleLogin.logout';
      fb.simplelogin.util.validation.validateArgCount(methodId, 0, 0, arguments.length);
      client_.logout();
    },

    createUser: function(email, password, cb) {
      var method = 'FirebaseSimpleLogin.createUser';
      fb.simplelogin.util.validation.validateArgCount(method, 3, 3, arguments.length);
      fb.simplelogin.util.validation.validateCallback(method, 3, cb, false);
      client_.createUser(email, password, cb);
    },

    changePassword: function(email, oldPassword, newPassword, cb) {
      var method = 'FirebaseSimpleLogin.changePassword';
      fb.simplelogin.util.validation.validateArgCount(method, 4, 4, arguments.length);
      fb.simplelogin.util.validation.validateCallback(method, 4, cb, false);
      client_.changePassword(email, oldPassword, newPassword, cb);
    },

    removeUser: function(email, password, cb) {
      var method = 'FirebaseSimpleLogin.removeUser';
      fb.simplelogin.util.validation.validateArgCount(method, 3, 3, arguments.length);
      fb.simplelogin.util.validation.validateCallback(method, 3, cb, false);
      client_.removeUser(email, password, cb);
    },

    sendPasswordResetEmail: function(email, cb) {
      var method = 'FirebaseSimpleLogin.sendPasswordResetEmail';
      fb.simplelogin.util.validation.validateArgCount(method, 2, 2, arguments.length);
      fb.simplelogin.util.validation.validateCallback(method, 2, cb, false);
      client_.sendPasswordResetEmail(email, cb);
    }
  };
}

/**
 * @export
 */
FirebaseSimpleLogin.onOpen = function(cb) {
  fb.simplelogin.client.onOpen(cb);
};
