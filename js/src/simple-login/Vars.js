goog.provide("fb.simplelogin.Vars");
goog.provide("fb.simplelogin.Vars_");

/**
 * @constructor
 */
fb.simplelogin.Vars_ = function() {
  this.apiHost = 'https://auth.firebase.com';
};

/**
 * @param {string} url Request endpoint
 */
fb.simplelogin.Vars_.prototype.setApiHost = function(apiHost) {
  this.apiHost = apiHost;
};

/**
 * @return {string}
 */
fb.simplelogin.Vars_.prototype.getApiHost = function() {
  return this.apiHost;
};

/**
 * Singleton for fb.simplelogin.Vars_
 */
fb.simplelogin.Vars = new fb.simplelogin.Vars_();
