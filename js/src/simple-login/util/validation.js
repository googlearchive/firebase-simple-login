goog.provide("fb.simplelogin.util.validation");

var VALID_EMAIL_REGEX_ = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,6})+$/;

/**
 * Check to make sure the appropriate number of arguments are provided for a public function.
 * Throws an error if it fails.
 *
 * @param fnName {String} The function name
 * @param minCount {Number} The minimum number of arguments to allow for the function call
 * @param maxCount {Number} The maxiumum number of argument to allow for the function call
 * @param argCount {Number} The actual number of arguments provided.
 */
fb.simplelogin.util.validation.validateArgCount = function(fnName, minCount, maxCount, argCount) {
  var argError;
  if (argCount < minCount) {
    argError = "at least " + minCount;
  }
  else if (argCount > maxCount) {
    argError = (maxCount === 0) ? "none" : ("no more than " + maxCount);
  }
  if (argError) {
    var error = fnName + " failed: Was called with " + argCount +
      ((argCount === 1) ? " argument." : " arguments.") +
      " Expects " + argError + ".";
    throw new Error(error);
  }
};

fb.simplelogin.util.validation.isValidEmail = function(email) {
  return (goog.isString(email) && VALID_EMAIL_REGEX_.test(email));
}

fb.simplelogin.util.validation.isValidPassword = function(password) {
  return (goog.isString(password));
}

fb.simplelogin.util.validation.isValidNamespace = function(namespace) {
  return (goog.isString(namespace));
}


/**
 * Generates a string to prefix an error message about failed argument validation
 *
 * @param fnName {String} The function name
 * @param argumentNumber {Number} The index of the argument
 * @param optional {Boolean} Whether or not the argument is optional
 * @return {String} The prefix to add to the error thrown for validation.
 * @private
 */
fb.simplelogin.util.validation.errorPrefix_ = function(fnName, argumentNumber, optional) {
  var argName = "";
  switch(argumentNumber) {
    case 1:
      argName = optional ? "first" : "First";
      break;
    case 2:
      argName = optional ? "second" : "Second";
      break;
    case 3:
      argName = optional ? "third" : "Third";
      break;
    case 4:
      argName = optional ? "fourth" : "Fourth";
      break;
    default:
      fb.core.util.validation.assert(false, "errorPrefix_ called with argumentNumber > 4.  Need to update it?");
  }

  var error = fnName + " failed: ";

  error += argName + " argument ";
  return error;
};

fb.simplelogin.util.validation.validateNamespace = function(fnName, argumentNumber, namespace, optional) {
  if (optional && !goog.isDef(namespace))
    return;
  if (!goog.isString(namespace)) {
    //TODO: I should do more validation here. We only allow certain chars in namespaces.
    throw new Error(fb.simplelogin.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid firebase namespace.");
  }
};

fb.simplelogin.util.validation.validateCallback = function(fnName, argumentNumber, callback, optional) {
  if (optional && !goog.isDef(callback))
    return;
  if (!goog.isFunction(callback))
    throw new Error(fb.simplelogin.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid function.");
};

fb.simplelogin.util.validation.validateString = function(fnName, argumentNumber, string, optional) {
  if (optional && !goog.isDef(string))
    return;
  if (!goog.isString(string)) {
    throw new Error(fb.simplelogin.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid string.");
  }
};

fb.simplelogin.util.validation.validateContextObject = function(fnName, argumentNumber, context, optional) {
  if (optional && !goog.isDef(context))
    return;
  if (!goog.isObject(context) || context === null)
    throw new Error(fb.simplelogin.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid context object.");
};

