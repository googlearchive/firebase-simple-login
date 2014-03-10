goog.provide('fb.simplelogin.providers.Persona');
goog.provide('fb.simplelogin.providers.Persona_');
goog.require("fb.simplelogin.util.validation");

/**
 * @constructor
 */
fb.simplelogin.providers.Persona_ = function() {};

fb.simplelogin.providers.Persona_.prototype.login = function(options, onComplete) {
  navigator['id']['watch']({
    'onlogin': function(assertion) {
      onComplete(assertion);
    },
    'onlogout': function() {}
  });

  options = options || {};
  options['oncancel'] = function() {
    onComplete(null);
  }

  navigator['id']['request'](options);
};

/**
 * Singleton for fb.simplelogin.providers.Persona_
 */
fb.simplelogin.providers.Persona = new fb.simplelogin.providers.Persona_();
