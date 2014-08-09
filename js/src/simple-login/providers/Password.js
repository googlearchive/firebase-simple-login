goog.provide('fb.simplelogin.providers.Password');
goog.provide('fb.simplelogin.providers.Password_');
goog.require("fb.simplelogin.Vars");
goog.require("fb.simplelogin.util.validation");
goog.require("fb.simplelogin.Errors");
goog.require('fb.simplelogin.transports.JSONP');
goog.require('fb.simplelogin.transports.XHR');

/**
 * @constructor
 */
fb.simplelogin.providers.Password_ = function() {};

/**
 * @returns {fb.simplelogin.transports.Transport}
 */
fb.simplelogin.providers.Password_.prototype.getTransport_ = function() {
  if (fb.simplelogin.transports.XHR.isAvailable()) {
    return fb.simplelogin.transports.XHR;
  } else {
    return fb.simplelogin.transports.JSONP;
  }
};

fb.simplelogin.providers.Password_.prototype.login = function(data, onComplete) {
  var url = fb.simplelogin.Vars.getApiHost() + '/auth/firebase';

  if (!fb.simplelogin.util.validation.isValidNamespace(data['firebase']))
    return onComplete && onComplete('INVALID_FIREBASE');

  this.getTransport_().open(url, data, onComplete);
};

fb.simplelogin.providers.Password_.prototype.createUser = function(data, onComplete) {
  var url = fb.simplelogin.Vars.getApiHost() + '/auth/firebase/create';

  if (!fb.simplelogin.util.validation.isValidNamespace(data['firebase']))
    return onComplete && onComplete('INVALID_FIREBASE');

  if (!fb.simplelogin.util.validation.isValidEmail(data['email']))
    return onComplete && onComplete('INVALID_EMAIL');

  if (!fb.simplelogin.util.validation.isValidPassword(data['password']))
    return onComplete && onComplete('INVALID_PASSWORD');

  this.getTransport_().open(url, data, onComplete);
};

fb.simplelogin.providers.Password_.prototype.changePassword = function(data, onComplete) {
  var url = fb.simplelogin.Vars.getApiHost() + '/auth/firebase/update';

  if (!fb.simplelogin.util.validation.isValidNamespace(data['firebase']))
    return onComplete && onComplete('INVALID_FIREBASE');

  if (!fb.simplelogin.util.validation.isValidEmail(data['email']))
    return onComplete && onComplete('INVALID_EMAIL');

  if (!fb.simplelogin.util.validation.isValidPassword(data['newPassword']))
    return onComplete && onComplete('INVALID_PASSWORD');

  this.getTransport_().open(url, data, onComplete);
};

fb.simplelogin.providers.Password_.prototype.removeUser = function(data, onComplete) {
  var url = fb.simplelogin.Vars.getApiHost() + '/auth/firebase/remove';

  if (!fb.simplelogin.util.validation.isValidNamespace(data['firebase']))
    return onComplete && onComplete('INVALID_FIREBASE');

  if (!fb.simplelogin.util.validation.isValidEmail(data['email']))
    return onComplete && onComplete('INVALID_EMAIL');

  if (!fb.simplelogin.util.validation.isValidPassword(data['password']))
    return onComplete && onComplete('INVALID_PASSWORD');

  this.getTransport_().open(url, data, onComplete);
};

fb.simplelogin.providers.Password_.prototype.sendPasswordResetEmail = function(data, onComplete) {
  var url = fb.simplelogin.Vars.getApiHost() + '/auth/firebase/reset_password';

  if (!fb.simplelogin.util.validation.isValidNamespace(data['firebase']))
    return onComplete && onComplete('INVALID_FIREBASE');

  if (!fb.simplelogin.util.validation.isValidEmail(data['email']))
    return onComplete && onComplete('INVALID_EMAIL');

  this.getTransport_().open(url, data, onComplete);
};

/**
 * Singleton for fb.simplelogin.providers.Password_
 */
fb.simplelogin.providers.Password = new fb.simplelogin.providers.Password_();
