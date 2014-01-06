var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("fb.util.validation");
fb.util.validation.validateArgCount = function(fnName, minCount, maxCount, argCount) {
  var argError;
  if(argCount < minCount) {
    argError = "at least " + minCount
  }else {
    if(argCount > maxCount) {
      argError = maxCount === 0 ? "none" : "no more than " + maxCount
    }
  }
  if(argError) {
    var error = fnName + " failed: Was called with " + argCount + (argCount === 1 ? " argument." : " arguments.") + " Expects " + argError + ".";
    throw new Error(error);
  }
};
fb.util.validation.errorPrefix_ = function(fnName, argumentNumber, optional) {
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
      fb.core.util.validation.assert(false, "errorPrefix_ called with argumentNumber > 4.  Need to update it?")
  }
  var error = fnName + " failed: ";
  error += argName + " argument ";
  return error
};
fb.util.validation.validateNamespace = function(fnName, argumentNumber, namespace, optional) {
  if(optional && !goog.isDef(namespace)) {
    return
  }
  if(!goog.isString(namespace)) {
    throw new Error(fb.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid firebase namespace.");
  }
};
fb.util.validation.validateCallback = function(fnName, argumentNumber, callback, optional) {
  if(optional && !goog.isDef(callback)) {
    return
  }
  if(!goog.isFunction(callback)) {
    throw new Error(fb.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid function.");
  }
};
fb.util.validation.validateString = function(fnName, argumentNumber, string, optional) {
  if(optional && !goog.isDef(string)) {
    return
  }
  if(!goog.isString(string)) {
    throw new Error(fb.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid string.");
  }
};
fb.util.validation.validateContextObject = function(fnName, argumentNumber, context, optional) {
  if(optional && !goog.isDef(context)) {
    return
  }
  if(!goog.isObject(context) || context === null) {
    throw new Error(fb.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid context object.");
  }
};
goog.provide("fb.simplelogin.persona");
goog.require("fb.util.validation");
fb.simplelogin.persona.login = function(callback) {
  navigator["id"]["watch"]({"onlogin":function(assertion) {
    callback(assertion)
  }, "onlogout":function() {
  }});
  navigator["id"]["request"]({"oncancel":function() {
    callback(null)
  }})
};
goog.provide("fb.constants");
var NODE_CLIENT = false;
goog.provide("goog.json");
goog.provide("goog.json.Serializer");
goog.json.isValid_ = function(s) {
  if(/^\s*$/.test(s)) {
    return false
  }
  var backslashesRe = /\\["\\\/bfnrtu]/g;
  var simpleValuesRe = /"[^"\\\n\r\u2028\u2029\x00-\x08\x10-\x1f\x80-\x9f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var openBracketsRe = /(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g;
  var remainderRe = /^[\],:{}\s\u2028\u2029]*$/;
  return remainderRe.test(s.replace(backslashesRe, "@").replace(simpleValuesRe, "]").replace(openBracketsRe, ""))
};
goog.json.parse = function(s) {
  var o = String(s);
  if(goog.json.isValid_(o)) {
    try {
      return eval("(" + o + ")")
    }catch(ex) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.unsafeParse = function(s) {
  return eval("(" + s + ")")
};
goog.json.Replacer;
goog.json.serialize = function(object, opt_replacer) {
  return(new goog.json.Serializer(opt_replacer)).serialize(object)
};
goog.json.Serializer = function(opt_replacer) {
  this.replacer_ = opt_replacer
};
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serialize_(object, sb);
  return sb.join("")
};
goog.json.Serializer.prototype.serialize_ = function(object, sb) {
  switch(typeof object) {
    case "string":
      this.serializeString_(object, sb);
      break;
    case "number":
      this.serializeNumber_(object, sb);
      break;
    case "boolean":
      sb.push(object);
      break;
    case "undefined":
      sb.push("null");
      break;
    case "object":
      if(object == null) {
        sb.push("null");
        break
      }
      if(goog.isArray(object)) {
        this.serializeArray(object, sb);
        break
      }
      this.serializeObject_(object, sb);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof object);
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    if(c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c]
    }
    var cc = c.charCodeAt(0);
    var rv = "\\u";
    if(cc < 16) {
      rv += "000"
    }else {
      if(cc < 256) {
        rv += "00"
      }else {
        if(cc < 4096) {
          rv += "0"
        }
      }
    }
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16)
  }), '"')
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : "null")
};
goog.json.Serializer.prototype.serializeArray = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  var sep = "";
  for(var i = 0;i < l;i++) {
    sb.push(sep);
    var value = arr[i];
    this.serialize_(this.replacer_ ? this.replacer_.call(arr, String(i), value) : value, sb);
    sep = ","
  }
  sb.push("]")
};
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push("{");
  var sep = "";
  for(var key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      if(typeof value != "function") {
        sb.push(sep);
        this.serializeString_(key, sb);
        sb.push(":");
        this.serialize_(this.replacer_ ? this.replacer_.call(obj, key, value) : value, sb);
        sep = ","
      }
    }
  }
  sb.push("}")
};
goog.provide("fb.util.json");
goog.require("goog.json");
fb.util.json.eval = function(str) {
  if(typeof JSON !== "undefined" && goog.isDef(JSON.parse)) {
    return JSON.parse(str)
  }else {
    return goog.json.parse(str)
  }
};
fb.util.json.stringify = function(data) {
  if(typeof JSON !== "undefined" && goog.isDef(JSON.stringify)) {
    return JSON.stringify(data)
  }else {
    return goog.json.serialize(data)
  }
};
goog.provide("fb.simplelogin.validation");
goog.require("fb.util.validation");
var VALID_EMAIL_REGEX_ = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
fb.simplelogin.validation.isValidEmail = function(email) {
  return goog.isString(email) && VALID_EMAIL_REGEX_.test(email)
};
fb.simplelogin.validation.isValidPassword = function(password) {
  return goog.isString(password)
};
fb.simplelogin.validation.validateUser = function(fnName, argumentNumber, user, optional) {
  if(optional && !goog.isDef(user)) {
    return
  }
  if(!fb.simplelogin.validation.isValidEmail(user)) {
    throw new Error(fb.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid email address.");
  }
};
fb.simplelogin.validation.validatePassword = function(fnName, argumentNumber, password, optional) {
  if(optional && !goog.isDef(password)) {
    return
  }
  if(!fb.simplelogin.validation.isValidPassword(password)) {
    throw new Error(fb.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid password.");
  }
};
goog.provide("fb.simplelogin.winchan");
goog.require("fb.util.json");
fb.simplelogin.winchan = function() {
  var RELAY_FRAME_NAME = "__winchan_relay_frame";
  var CLOSE_CMD = "die";
  function addListener(w, event, cb) {
    if(w.attachEvent) {
      w.attachEvent("on" + event, cb)
    }else {
      if(w.addEventListener) {
        w.addEventListener(event, cb, false)
      }
    }
  }
  function removeListener(w, event, cb) {
    if(w.detachEvent) {
      w.detachEvent("on" + event, cb)
    }else {
      if(w.removeEventListener) {
        w.removeEventListener(event, cb, false)
      }
    }
  }
  function isInternetExplorer() {
    var rv = -1;
    var ua = navigator.userAgent;
    if(navigator.appName === "Microsoft Internet Explorer") {
      var re = /MSIE ([0-9]{1,}[\.0-9]{0,})/;
      var match = ua.match(re);
      if(match && match.length > 1) {
        rv = parseFloat(match[1])
      }
    }else {
      if(ua.indexOf("Trident") > -1) {
        var re = /rv:([0-9]{2,2}[\.0-9]{0,})/;
        var match = ua.match(re);
        if(match && match.length > 1) {
          rv = parseFloat(match[1])
        }
      }
    }
    return rv >= 8
  }
  function isFennec() {
    try {
      var userAgent = navigator.userAgent;
      return userAgent.indexOf("Fennec/") != -1 || userAgent.indexOf("Firefox/") != -1 && userAgent.indexOf("Android") != -1
    }catch(e) {
    }
    return false
  }
  function isSupported() {
    return fb.util.json && fb.util.json.eval && fb.util.json.stringify && window.postMessage
  }
  function extractOrigin(url) {
    if(!/^https?:\/\//.test(url)) {
      url = window.location.href
    }
    var m = /^(https?:\/\/[\-_a-zA-Z\.0-9:]+)/.exec(url);
    if(m) {
      return m[1]
    }
    return url
  }
  function findRelay() {
    var loc = window.location;
    var frames = window.opener.frames;
    var origin = loc.protocol + "//" + loc.host;
    for(var i = frames.length - 1;i >= 0;i--) {
      try {
        if(frames[i].location.href.indexOf(origin) === 0 && frames[i].name === RELAY_FRAME_NAME) {
          return frames[i]
        }
      }catch(e) {
      }
    }
    return
  }
  var isIE = isInternetExplorer();
  if(isSupported()) {
    return{open:function(opts, cb) {
      if(!cb) {
        throw"missing required callback argument";
      }
      var err;
      if(!opts.url) {
        err = "missing required 'url' parameter"
      }
      if(!opts.relay_url) {
        err = "missing required 'relay_url' parameter"
      }
      if(err) {
        setTimeout(function() {
          cb(err)
        }, 0)
      }
      if(!opts.window_name) {
        opts.window_name = null
      }
      if(!opts.window_features || isFennec()) {
        opts.window_features = undefined
      }
      var iframe;
      var origin = extractOrigin(opts.url);
      if(origin !== extractOrigin(opts.relay_url)) {
        return setTimeout(function() {
          cb("invalid arguments: origin of url and relay_url must match")
        }, 0)
      }
      var messageTarget;
      if(isIE) {
        iframe = document.createElement("iframe");
        iframe.setAttribute("src", opts.relay_url);
        iframe.style.display = "none";
        iframe.setAttribute("name", RELAY_FRAME_NAME);
        document.body.appendChild(iframe);
        messageTarget = iframe.contentWindow
      }
      var w = window.open(opts.url, opts.window_name, opts.window_features);
      if(!messageTarget) {
        messageTarget = w
      }
      var closeInterval = setInterval(function() {
        if(w && w.closed) {
          cleanup();
          if(cb) {
            cb("unknown closed window");
            cb = null
          }
        }
      }, 500);
      var req = fb.util.json.stringify({a:"request", d:opts.params});
      function cleanup() {
        if(iframe) {
          document.body.removeChild(iframe)
        }
        iframe = undefined;
        if(closeInterval) {
          closeInterval = clearInterval(closeInterval)
        }
        removeListener(window, "message", onMessage);
        removeListener(window, "unload", cleanup);
        if(w) {
          try {
            w.close()
          }catch(securityViolation) {
            messageTarget.postMessage(CLOSE_CMD, origin)
          }
        }
        w = messageTarget = undefined
      }
      addListener(window, "unload", cleanup);
      function onMessage(e) {
        if(e.origin !== origin) {
          return
        }
        try {
          var d = fb.util.json.eval(e.data);
          if(d.a === "ready") {
            messageTarget.postMessage(req, origin)
          }else {
            if(d.a === "error") {
              cleanup();
              if(cb) {
                cb(d.d);
                cb = null
              }
            }else {
              if(d.a === "response") {
                cleanup();
                if(cb) {
                  cb(null, d.d);
                  cb = null
                }
              }
            }
          }
        }catch(err) {
        }
      }
      addListener(window, "message", onMessage);
      return{close:cleanup, focus:function() {
        if(w) {
          try {
            w.focus()
          }catch(e) {
          }
        }
      }}
    }, onOpen:function(cb) {
      var o = "*";
      var msgTarget = isIE ? findRelay() : window.opener;
      if(!msgTarget) {
        throw"can't find relay frame";
      }
      function doPost(msg) {
        msg = fb.util.json.stringify(msg);
        if(isIE) {
          msgTarget.doPost(msg, o)
        }else {
          msgTarget.postMessage(msg, o)
        }
      }
      function onMessage(e) {
        var d;
        try {
          d = fb.util.json.eval(e.data)
        }catch(err) {
        }
        if(!d || d.a !== "request") {
          return
        }
        removeListener(window, "message", onMessage);
        o = e.origin;
        if(cb) {
          setTimeout(function() {
            cb(o, d.d, function(r) {
              cb = undefined;
              doPost({a:"response", d:r})
            })
          }, 0)
        }
      }
      function onDie(e) {
        if(e.data === CLOSE_CMD) {
          try {
            window.close()
          }catch(o_O) {
          }
        }
      }
      addListener(isIE ? msgTarget : window, "message", onMessage);
      addListener(isIE ? msgTarget : window, "message", onDie);
      try {
        doPost({a:"ready"})
      }catch(e) {
        addListener(msgTarget, "load", function(e) {
          doPost({a:"ready"})
        })
      }
      var onUnload = function() {
        try {
          removeListener(isIE ? msgTarget : window, "message", onDie)
        }catch(ohWell) {
        }
        if(cb) {
          doPost({a:"error", d:"client closed window"})
        }
        cb = undefined;
        try {
          window.close()
        }catch(e) {
        }
      };
      addListener(window, "unload", onUnload);
      return{detach:function() {
        removeListener(window, "unload", onUnload)
      }}
    }}
  }else {
    return{open:function(url, winopts, arg, cb) {
      setTimeout(function() {
        cb("unsupported browser")
      }, 0)
    }, onOpen:function(cb) {
      setTimeout(function() {
        cb("unsupported browser")
      }, 0)
    }}
  }
}();
goog.provide("fb.util.sjcl");
var sjcl = {cipher:{}, hash:{}, keyexchange:{}, mode:{}, misc:{}, codec:{}, exception:{corrupt:function(a) {
  this.toString = function() {
    return"CORRUPT: " + this.message
  };
  this.message = a
}, invalid:function(a) {
  this.toString = function() {
    return"INVALID: " + this.message
  };
  this.message = a
}, bug:function(a) {
  this.toString = function() {
    return"BUG: " + this.message
  };
  this.message = a
}, notReady:function(a) {
  this.toString = function() {
    return"NOT READY: " + this.message
  };
  this.message = a
}}};
if(typeof module != "undefined" && module.exports) {
  module.exports = sjcl
}
sjcl.cipher.aes = function(a) {
  this.h[0][0][0] || this.w();
  var b, c, d, e, f = this.h[0][4], g = this.h[1];
  b = a.length;
  var h = 1;
  if(b !== 4 && b !== 6 && b !== 8) {
    throw new sjcl.exception.invalid("invalid aes key size");
  }
  this.a = [d = a.slice(0), e = []];
  for(a = b;a < 4 * b + 28;a++) {
    c = d[a - 1];
    if(a % b === 0 || b === 8 && a % b === 4) {
      c = f[c >>> 24] << 24 ^ f[c >> 16 & 255] << 16 ^ f[c >> 8 & 255] << 8 ^ f[c & 255];
      if(a % b === 0) {
        c = c << 8 ^ c >>> 24 ^ h << 24;
        h = h << 1 ^ (h >> 7) * 283
      }
    }
    d[a] = d[a - b] ^ c
  }
  for(b = 0;a;b++, a--) {
    c = d[b & 3 ? a : a - 4];
    e[b] = a <= 4 || b < 4 ? c : g[0][f[c >>> 24]] ^ g[1][f[c >> 16 & 255]] ^ g[2][f[c >> 8 & 255]] ^ g[3][f[c & 255]]
  }
};
sjcl.cipher.aes.prototype = {encrypt:function(a) {
  return this.G(a, 0)
}, decrypt:function(a) {
  return this.G(a, 1)
}, h:[[[], [], [], [], []], [[], [], [], [], []]], w:function() {
  var a = this.h[0], b = this.h[1], c = a[4], d = b[4], e, f, g, h = [], i = [], k, j, l, m;
  for(e = 0;e < 256;e++) {
    i[(h[e] = e << 1 ^ (e >> 7) * 283) ^ e] = e
  }
  for(f = g = 0;!c[f];f ^= k || 1, g = i[g] || 1) {
    l = g ^ g << 1 ^ g << 2 ^ g << 3 ^ g << 4;
    l = l >> 8 ^ l & 255 ^ 99;
    c[f] = l;
    d[l] = f;
    j = h[e = h[k = h[f]]];
    m = j * 16843009 ^ e * 65537 ^ k * 257 ^ f * 16843008;
    j = h[l] * 257 ^ l * 16843008;
    for(e = 0;e < 4;e++) {
      a[e][f] = j = j << 24 ^ j >>> 8;
      b[e][l] = m = m << 24 ^ m >>> 8
    }
  }
  for(e = 0;e < 5;e++) {
    a[e] = a[e].slice(0);
    b[e] = b[e].slice(0)
  }
}, G:function(a, b) {
  if(a.length !== 4) {
    throw new sjcl.exception.invalid("invalid aes block size");
  }
  var c = this.a[b], d = a[0] ^ c[0], e = a[b ? 3 : 1] ^ c[1], f = a[2] ^ c[2];
  a = a[b ? 1 : 3] ^ c[3];
  var g, h, i, k = c.length / 4 - 2, j, l = 4, m = [0, 0, 0, 0];
  g = this.h[b];
  var n = g[0], o = g[1], p = g[2], q = g[3], r = g[4];
  for(j = 0;j < k;j++) {
    g = n[d >>> 24] ^ o[e >> 16 & 255] ^ p[f >> 8 & 255] ^ q[a & 255] ^ c[l];
    h = n[e >>> 24] ^ o[f >> 16 & 255] ^ p[a >> 8 & 255] ^ q[d & 255] ^ c[l + 1];
    i = n[f >>> 24] ^ o[a >> 16 & 255] ^ p[d >> 8 & 255] ^ q[e & 255] ^ c[l + 2];
    a = n[a >>> 24] ^ o[d >> 16 & 255] ^ p[e >> 8 & 255] ^ q[f & 255] ^ c[l + 3];
    l += 4;
    d = g;
    e = h;
    f = i
  }
  for(j = 0;j < 4;j++) {
    m[b ? 3 & -j : j] = r[d >>> 24] << 24 ^ r[e >> 16 & 255] << 16 ^ r[f >> 8 & 255] << 8 ^ r[a & 255] ^ c[l++];
    g = d;
    d = e;
    e = f;
    f = a;
    a = g
  }
  return m
}};
sjcl.bitArray = {bitSlice:function(a, b, c) {
  a = sjcl.bitArray.N(a.slice(b / 32), 32 - (b & 31)).slice(1);
  return c === undefined ? a : sjcl.bitArray.clamp(a, c - b)
}, extract:function(a, b, c) {
  var d = Math.floor(-b - c & 31);
  return((b + c - 1 ^ b) & -32 ? a[b / 32 | 0] << 32 - d ^ a[b / 32 + 1 | 0] >>> d : a[b / 32 | 0] >>> d) & (1 << c) - 1
}, concat:function(a, b) {
  if(a.length === 0 || b.length === 0) {
    return a.concat(b)
  }
  var c = a[a.length - 1], d = sjcl.bitArray.getPartial(c);
  return d === 32 ? a.concat(b) : sjcl.bitArray.N(b, d, c | 0, a.slice(0, a.length - 1))
}, bitLength:function(a) {
  var b = a.length;
  if(b === 0) {
    return 0
  }
  return(b - 1) * 32 + sjcl.bitArray.getPartial(a[b - 1])
}, clamp:function(a, b) {
  if(a.length * 32 < b) {
    return a
  }
  a = a.slice(0, Math.ceil(b / 32));
  var c = a.length;
  b &= 31;
  if(c > 0 && b) {
    a[c - 1] = sjcl.bitArray.partial(b, a[c - 1] & 2147483648 >> b - 1, 1)
  }
  return a
}, partial:function(a, b, c) {
  if(a === 32) {
    return b
  }
  return(c ? b | 0 : b << 32 - a) + a * 1099511627776
}, getPartial:function(a) {
  return Math.round(a / 1099511627776) || 32
}, equal:function(a, b) {
  if(sjcl.bitArray.bitLength(a) !== sjcl.bitArray.bitLength(b)) {
    return false
  }
  var c = 0, d;
  for(d = 0;d < a.length;d++) {
    c |= a[d] ^ b[d]
  }
  return c === 0
}, N:function(a, b, c, d) {
  var e;
  e = 0;
  if(d === undefined) {
    d = []
  }
  for(;b >= 32;b -= 32) {
    d.push(c);
    c = 0
  }
  if(b === 0) {
    return d.concat(a)
  }
  for(e = 0;e < a.length;e++) {
    d.push(c | a[e] >>> b);
    c = a[e] << 32 - b
  }
  e = a.length ? a[a.length - 1] : 0;
  a = sjcl.bitArray.getPartial(e);
  d.push(sjcl.bitArray.partial(b + a & 31, b + a > 32 ? c : d.pop(), 1));
  return d
}, O:function(a, b) {
  return[a[0] ^ b[0], a[1] ^ b[1], a[2] ^ b[2], a[3] ^ b[3]]
}};
sjcl.codec.utf8String = {fromBits:function(a) {
  var b = "", c = sjcl.bitArray.bitLength(a), d, e;
  for(d = 0;d < c / 8;d++) {
    if((d & 3) === 0) {
      e = a[d / 4]
    }
    b += String.fromCharCode(e >>> 24);
    e <<= 8
  }
  return decodeURIComponent(escape(b))
}, toBits:function(a) {
  a = unescape(encodeURIComponent(a));
  var b = [], c, d = 0;
  for(c = 0;c < a.length;c++) {
    d = d << 8 | a.charCodeAt(c);
    if((c & 3) === 3) {
      b.push(d);
      d = 0
    }
  }
  c & 3 && b.push(sjcl.bitArray.partial(8 * (c & 3), d));
  return b
}};
sjcl.codec.base64 = {C:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", fromBits:function(a, b, c) {
  var d = "", e = 0, f = sjcl.codec.base64.C, g = 0, h = sjcl.bitArray.bitLength(a);
  if(c) {
    f = f.substr(0, 62) + "-_"
  }
  for(c = 0;d.length * 6 < h;) {
    d += f.charAt((g ^ a[c] >>> e) >>> 26);
    if(e < 6) {
      g = a[c] << 6 - e;
      e += 26;
      c++
    }else {
      g <<= 6;
      e -= 6
    }
  }
  for(;d.length & 3 && !b;) {
    d += "="
  }
  return d
}, toBits:function(a, b) {
  a = a.replace(/\s|=/g, "");
  var c = [], d = 0, e = sjcl.codec.base64.C, f = 0, g;
  if(b) {
    e = e.substr(0, 62) + "-_"
  }
  for(b = 0;b < a.length;b++) {
    g = e.indexOf(a.charAt(b));
    if(g < 0) {
      throw new sjcl.exception.invalid("this isn't base64!");
    }
    if(d > 26) {
      d -= 26;
      c.push(f ^ g >>> d);
      f = g << 32 - d
    }else {
      d += 6;
      f ^= g << 32 - d
    }
  }
  d & 56 && c.push(sjcl.bitArray.partial(d & 56, f, 1));
  return c
}};
sjcl.codec.base64url = {fromBits:function(a) {
  return sjcl.codec.base64.fromBits(a, 1, 1)
}, toBits:function(a) {
  return sjcl.codec.base64.toBits(a, 1)
}};
sjcl.hash.sha256 = function(a) {
  this.a[0] || this.w();
  if(a) {
    this.m = a.m.slice(0);
    this.i = a.i.slice(0);
    this.e = a.e
  }else {
    this.reset()
  }
};
sjcl.hash.sha256.hash = function(a) {
  return(new sjcl.hash.sha256).update(a).finalize()
};
sjcl.hash.sha256.prototype = {blockSize:512, reset:function() {
  this.m = this.L.slice(0);
  this.i = [];
  this.e = 0;
  return this
}, update:function(a) {
  if(typeof a === "string") {
    a = sjcl.codec.utf8String.toBits(a)
  }
  var b, c = this.i = sjcl.bitArray.concat(this.i, a);
  b = this.e;
  a = this.e = b + sjcl.bitArray.bitLength(a);
  for(b = 512 + b & -512;b <= a;b += 512) {
    this.B(c.splice(0, 16))
  }
  return this
}, finalize:function() {
  var a, b = this.i, c = this.m;
  b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
  for(a = b.length + 2;a & 15;a++) {
    b.push(0)
  }
  b.push(Math.floor(this.e / 4294967296));
  for(b.push(this.e | 0);b.length;) {
    this.B(b.splice(0, 16))
  }
  this.reset();
  return c
}, L:[], a:[], w:function() {
  function a(e) {
    return(e - Math.floor(e)) * 4294967296 | 0
  }
  var b = 0, c = 2, d;
  a:for(;b < 64;c++) {
    for(d = 2;d * d <= c;d++) {
      if(c % d === 0) {
        continue a
      }
    }
    if(b < 8) {
      this.L[b] = a(Math.pow(c, 0.5))
    }
    this.a[b] = a(Math.pow(c, 1 / 3));
    b++
  }
}, B:function(a) {
  var b, c, d = a.slice(0), e = this.m, f = this.a, g = e[0], h = e[1], i = e[2], k = e[3], j = e[4], l = e[5], m = e[6], n = e[7];
  for(a = 0;a < 64;a++) {
    if(a < 16) {
      b = d[a]
    }else {
      b = d[a + 1 & 15];
      c = d[a + 14 & 15];
      b = d[a & 15] = (b >>> 7 ^ b >>> 18 ^ b >>> 3 ^ b << 25 ^ b << 14) + (c >>> 17 ^ c >>> 19 ^ c >>> 10 ^ c << 15 ^ c << 13) + d[a & 15] + d[a + 9 & 15] | 0
    }
    b = b + n + (j >>> 6 ^ j >>> 11 ^ j >>> 25 ^ j << 26 ^ j << 21 ^ j << 7) + (m ^ j & (l ^ m)) + f[a];
    n = m;
    m = l;
    l = j;
    j = k + b | 0;
    k = i;
    i = h;
    h = g;
    g = b + (h & i ^ k & (h ^ i)) + (h >>> 2 ^ h >>> 13 ^ h >>> 22 ^ h << 30 ^ h << 19 ^ h << 10) | 0
  }
  e[0] = e[0] + g | 0;
  e[1] = e[1] + h | 0;
  e[2] = e[2] + i | 0;
  e[3] = e[3] + k | 0;
  e[4] = e[4] + j | 0;
  e[5] = e[5] + l | 0;
  e[6] = e[6] + m | 0;
  e[7] = e[7] + n | 0
}};
sjcl.mode.ccm = {name:"ccm", encrypt:function(a, b, c, d, e) {
  var f, g = b.slice(0), h = sjcl.bitArray, i = h.bitLength(c) / 8, k = h.bitLength(g) / 8;
  e = e || 64;
  d = d || [];
  if(i < 7) {
    throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes");
  }
  for(f = 2;f < 4 && k >>> 8 * f;f++) {
  }
  if(f < 15 - i) {
    f = 15 - i
  }
  c = h.clamp(c, 8 * (15 - f));
  b = sjcl.mode.ccm.F(a, b, c, d, e, f);
  g = sjcl.mode.ccm.H(a, g, c, b, e, f);
  return h.concat(g.data, g.tag)
}, decrypt:function(a, b, c, d, e) {
  e = e || 64;
  d = d || [];
  var f = sjcl.bitArray, g = f.bitLength(c) / 8, h = f.bitLength(b), i = f.clamp(b, h - e), k = f.bitSlice(b, h - e);
  h = (h - e) / 8;
  if(g < 7) {
    throw new sjcl.exception.invalid("ccm: iv must be at least 7 bytes");
  }
  for(b = 2;b < 4 && h >>> 8 * b;b++) {
  }
  if(b < 15 - g) {
    b = 15 - g
  }
  c = f.clamp(c, 8 * (15 - b));
  i = sjcl.mode.ccm.H(a, i, c, k, e, b);
  a = sjcl.mode.ccm.F(a, i.data, c, d, e, b);
  if(!f.equal(i.tag, a)) {
    throw new sjcl.exception.corrupt("ccm: tag doesn't match");
  }
  return i.data
}, F:function(a, b, c, d, e, f) {
  var g = [], h = sjcl.bitArray, i = h.O;
  e /= 8;
  if(e % 2 || e < 4 || e > 16) {
    throw new sjcl.exception.invalid("ccm: invalid tag length");
  }
  if(d.length > 4294967295 || b.length > 4294967295) {
    throw new sjcl.exception.bug("ccm: can't deal with 4GiB or more data");
  }
  f = [h.partial(8, (d.length ? 64 : 0) | e - 2 << 2 | f - 1)];
  f = h.concat(f, c);
  f[3] |= h.bitLength(b) / 8;
  f = a.encrypt(f);
  if(d.length) {
    c = h.bitLength(d) / 8;
    if(c <= 65279) {
      g = [h.partial(16, c)]
    }else {
      if(c <= 4294967295) {
        g = h.concat([h.partial(16, 65534)], [c])
      }
    }
    g = h.concat(g, d);
    for(d = 0;d < g.length;d += 4) {
      f = a.encrypt(i(f, g.slice(d, d + 4).concat([0, 0, 0])))
    }
  }
  for(d = 0;d < b.length;d += 4) {
    f = a.encrypt(i(f, b.slice(d, d + 4).concat([0, 0, 0])))
  }
  return h.clamp(f, e * 8)
}, H:function(a, b, c, d, e, f) {
  var g, h = sjcl.bitArray;
  g = h.O;
  var i = b.length, k = h.bitLength(b);
  c = h.concat([h.partial(8, f - 1)], c).concat([0, 0, 0]).slice(0, 4);
  d = h.bitSlice(g(d, a.encrypt(c)), 0, e);
  if(!i) {
    return{tag:d, data:[]}
  }
  for(g = 0;g < i;g += 4) {
    c[3]++;
    e = a.encrypt(c);
    b[g] ^= e[0];
    b[g + 1] ^= e[1];
    b[g + 2] ^= e[2];
    b[g + 3] ^= e[3]
  }
  return{tag:d, data:h.clamp(b, k)}
}};
sjcl.misc.hmac = function(a, b) {
  this.K = b = b || sjcl.hash.sha256;
  var c = [[], []], d = b.prototype.blockSize / 32;
  this.k = [new b, new b];
  if(a.length > d) {
    a = b.hash(a)
  }
  for(b = 0;b < d;b++) {
    c[0][b] = a[b] ^ 909522486;
    c[1][b] = a[b] ^ 1549556828
  }
  this.k[0].update(c[0]);
  this.k[1].update(c[1])
};
sjcl.misc.hmac.prototype.encrypt = sjcl.misc.hmac.prototype.mac = function(a) {
  a = (new this.K(this.k[0])).update(a).finalize();
  return(new this.K(this.k[1])).update(a).finalize()
};
sjcl.misc.pbkdf2 = function(a, b, c, d, e) {
  c = c || 1E3;
  if(d < 0 || c < 0) {
    throw sjcl.exception.invalid("invalid params to pbkdf2");
  }
  if(typeof a === "string") {
    a = sjcl.codec.utf8String.toBits(a)
  }
  e = e || sjcl.misc.hmac;
  a = new e(a);
  var f, g, h, i, k = [], j = sjcl.bitArray;
  for(i = 1;32 * k.length < (d || 1);i++) {
    e = f = a.encrypt(j.concat(b, [i]));
    for(g = 1;g < c;g++) {
      f = a.encrypt(f);
      for(h = 0;h < f.length;h++) {
        e[h] ^= f[h]
      }
    }
    k = k.concat(e)
  }
  if(d) {
    k = j.clamp(k, d)
  }
  return k
};
sjcl.random = {randomWords:function(a, b) {
  var c = [];
  b = this.isReady(b);
  var d;
  if(b === 0) {
    throw new sjcl.exception.notReady("generator isn't seeded");
  }else {
    b & 2 && this.T(!(b & 1))
  }
  for(b = 0;b < a;b += 4) {
    (b + 1) % 65536 === 0 && this.J();
    d = this.u();
    c.push(d[0], d[1], d[2], d[3])
  }
  this.J();
  return c.slice(0, a)
}, setDefaultParanoia:function(a) {
  this.s = a
}, addEntropy:function(a, b, c) {
  c = c || "user";
  var d, e, f = (new Date).valueOf(), g = this.p[c], h = this.isReady(), i = 0;
  d = this.D[c];
  if(d === undefined) {
    d = this.D[c] = this.Q++
  }
  if(g === undefined) {
    g = this.p[c] = 0
  }
  this.p[c] = (this.p[c] + 1) % this.b.length;
  switch(typeof a) {
    case "number":
      if(b === undefined) {
        b = 1
      }
      this.b[g].update([d, this.t++, 1, b, f, 1, a | 0]);
      break;
    case "object":
      c = Object.prototype.toString.call(a);
      if(c === "[object Uint32Array]") {
        e = [];
        for(c = 0;c < a.length;c++) {
          e.push(a[c])
        }
        a = e
      }else {
        if(c !== "[object Array]") {
          i = 1
        }
        for(c = 0;c < a.length && !i;c++) {
          if(typeof a[c] != "number") {
            i = 1
          }
        }
      }
      if(!i) {
        if(b === undefined) {
          for(c = b = 0;c < a.length;c++) {
            for(e = a[c];e > 0;) {
              b++;
              e >>>= 1
            }
          }
        }
        this.b[g].update([d, this.t++, 2, b, f, a.length].concat(a))
      }
      break;
    case "string":
      if(b === undefined) {
        b = a.length
      }
      this.b[g].update([d, this.t++, 3, b, f, a.length]);
      this.b[g].update(a);
      break;
    default:
      i = 1
  }
  if(i) {
    throw new sjcl.exception.bug("random: addEntropy only supports number, array of numbers or string");
  }
  this.j[g] += b;
  this.f += b;
  if(h === 0) {
    this.isReady() !== 0 && this.I("seeded", Math.max(this.g, this.f));
    this.I("progress", this.getProgress())
  }
}, isReady:function(a) {
  a = this.A[a !== undefined ? a : this.s];
  return this.g && this.g >= a ? this.j[0] > 80 && (new Date).valueOf() > this.M ? 3 : 1 : this.f >= a ? 2 : 0
}, getProgress:function(a) {
  a = this.A[a ? a : this.s];
  return this.g >= a ? 1 : this.f > a ? 1 : this.f / a
}, startCollectors:function() {
  if(!this.l) {
    if(window.addEventListener) {
      window.addEventListener("load", this.n, false);
      window.addEventListener("mousemove", this.o, false)
    }else {
      if(document.attachEvent) {
        document.attachEvent("onload", this.n);
        document.attachEvent("onmousemove", this.o)
      }else {
        throw new sjcl.exception.bug("can't attach event");
      }
    }
    this.l = true
  }
}, stopCollectors:function() {
  if(this.l) {
    if(window.removeEventListener) {
      window.removeEventListener("load", this.n, false);
      window.removeEventListener("mousemove", this.o, false)
    }else {
      if(window.detachEvent) {
        window.detachEvent("onload", this.n);
        window.detachEvent("onmousemove", this.o)
      }
    }
    this.l = false
  }
}, addEventListener:function(a, b) {
  this.q[a][this.P++] = b
}, removeEventListener:function(a, b) {
  var c;
  a = this.q[a];
  var d = [];
  for(c in a) {
    a.hasOwnProperty(c) && a[c] === b && d.push(c)
  }
  for(b = 0;b < d.length;b++) {
    c = d[b];
    delete a[c]
  }
}, b:[new sjcl.hash.sha256], j:[0], z:0, p:{}, t:0, D:{}, Q:0, g:0, f:0, M:0, a:[0, 0, 0, 0, 0, 0, 0, 0], d:[0, 0, 0, 0], r:undefined, s:6, l:false, q:{progress:{}, seeded:{}}, P:0, A:[0, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024], u:function() {
  for(var a = 0;a < 4;a++) {
    this.d[a] = this.d[a] + 1 | 0;
    if(this.d[a]) {
      break
    }
  }
  return this.r.encrypt(this.d)
}, J:function() {
  this.a = this.u().concat(this.u());
  this.r = new sjcl.cipher.aes(this.a)
}, S:function(a) {
  this.a = sjcl.hash.sha256.hash(this.a.concat(a));
  this.r = new sjcl.cipher.aes(this.a);
  for(a = 0;a < 4;a++) {
    this.d[a] = this.d[a] + 1 | 0;
    if(this.d[a]) {
      break
    }
  }
}, T:function(a) {
  var b = [], c = 0, d;
  this.M = b[0] = (new Date).valueOf() + 3E4;
  for(d = 0;d < 16;d++) {
    b.push(Math.random() * 4294967296 | 0)
  }
  for(d = 0;d < this.b.length;d++) {
    b = b.concat(this.b[d].finalize());
    c += this.j[d];
    this.j[d] = 0;
    if(!a && this.z & 1 << d) {
      break
    }
  }
  if(this.z >= 1 << this.b.length) {
    this.b.push(new sjcl.hash.sha256);
    this.j.push(0)
  }
  this.f -= c;
  if(c > this.g) {
    this.g = c
  }
  this.z++;
  this.S(b)
}, o:function(a) {
  sjcl.random.addEntropy([a.x || a.clientX || a.offsetX || 0, a.y || a.clientY || a.offsetY || 0], 2, "mouse")
}, n:function() {
  sjcl.random.addEntropy((new Date).valueOf(), 2, "loadtime")
}, I:function(a, b) {
  var c;
  a = sjcl.random.q[a];
  var d = [];
  for(c in a) {
    a.hasOwnProperty(c) && d.push(a[c])
  }
  for(c = 0;c < d.length;c++) {
    d[c](b)
  }
}};
try {
  var s = new Uint32Array(32);
  crypto.getRandomValues(s);
  sjcl.random.addEntropy(s, 1024, "crypto['getRandomValues']")
}catch(t) {
}
sjcl.json = {defaults:{v:1, iter:1E3, ks:128, ts:64, mode:"ccm", adata:"", cipher:"aes"}, encrypt:function(a, b, c, d) {
  c = c || {};
  d = d || {};
  var e = sjcl.json, f = e.c({iv:sjcl.random.randomWords(4, 0)}, e.defaults), g;
  e.c(f, c);
  c = f.adata;
  if(typeof f.salt === "string") {
    f.salt = sjcl.codec.base64.toBits(f.salt)
  }
  if(typeof f.iv === "string") {
    f.iv = sjcl.codec.base64.toBits(f.iv)
  }
  if(!sjcl.mode[f.mode] || !sjcl.cipher[f.cipher] || typeof a === "string" && f.iter <= 100 || f.ts !== 64 && f.ts !== 96 && f.ts !== 128 || f.ks !== 128 && f.ks !== 192 && f.ks !== 256 || f.iv.length < 2 || f.iv.length > 4) {
    throw new sjcl.exception.invalid("json encrypt: invalid parameters");
  }
  if(typeof a === "string") {
    g = sjcl.misc.cachedPbkdf2(a, f);
    a = g.key.slice(0, f.ks / 32);
    f.salt = g.salt
  }
  if(typeof b === "string") {
    b = sjcl.codec.utf8String.toBits(b)
  }
  if(typeof c === "string") {
    c = sjcl.codec.utf8String.toBits(c)
  }
  g = new sjcl.cipher[f.cipher](a);
  e.c(d, f);
  d.key = a;
  f.ct = sjcl.mode[f.mode].encrypt(g, b, f.iv, c, f.ts);
  return e.encode(f)
}, decrypt:function(a, b, c, d) {
  c = c || {};
  d = d || {};
  var e = sjcl.json;
  b = e.c(e.c(e.c({}, e.defaults), e.decode(b)), c, true);
  var f;
  c = b.adata;
  if(typeof b.salt === "string") {
    b.salt = sjcl.codec.base64.toBits(b.salt)
  }
  if(typeof b.iv === "string") {
    b.iv = sjcl.codec.base64.toBits(b.iv)
  }
  if(!sjcl.mode[b.mode] || !sjcl.cipher[b.cipher] || typeof a === "string" && b.iter <= 100 || b.ts !== 64 && b.ts !== 96 && b.ts !== 128 || b.ks !== 128 && b.ks !== 192 && b.ks !== 256 || !b.iv || b.iv.length < 2 || b.iv.length > 4) {
    throw new sjcl.exception.invalid("json decrypt: invalid parameters");
  }
  if(typeof a === "string") {
    f = sjcl.misc.cachedPbkdf2(a, b);
    a = f.key.slice(0, b.ks / 32);
    b.salt = f.salt
  }
  if(typeof c === "string") {
    c = sjcl.codec.utf8String.toBits(c)
  }
  f = new sjcl.cipher[b.cipher](a);
  c = sjcl.mode[b.mode].decrypt(f, b.ct, b.iv, c, b.ts);
  e.c(d, b);
  d.key = a;
  return sjcl.codec.utf8String.fromBits(c)
}, encode:function(a) {
  var b, c = "{", d = "";
  for(b in a) {
    if(a.hasOwnProperty(b)) {
      if(!b.match(/^[a-z0-9]+$/i)) {
        throw new sjcl.exception.invalid("json encode: invalid property name");
      }
      c += d + '"' + b + '":';
      d = ",";
      switch(typeof a[b]) {
        case "number":
        ;
        case "boolean":
          c += a[b];
          break;
        case "string":
          c += '"' + escape(a[b]) + '"';
          break;
        case "object":
          c += '"' + sjcl.codec.base64.fromBits(a[b], 0) + '"';
          break;
        default:
          throw new sjcl.exception.bug("json encode: unsupported type");
      }
    }
  }
  return c + "}"
}, decode:function(a) {
  a = a.replace(/\s/g, "");
  if(!a.match(/^\{.*\}$/)) {
    throw new sjcl.exception.invalid("json decode: this isn't json!");
  }
  a = a.replace(/^\{|\}$/g, "").split(/,/);
  var b = {}, c, d;
  for(c = 0;c < a.length;c++) {
    if(!(d = a[c].match(/^(?:(["']?)([a-z][a-z0-9]*)\1):(?:(\d+)|"([a-z0-9+\/%*_.@=\-]*)")$/i))) {
      throw new sjcl.exception.invalid("json decode: this isn't json!");
    }
    b[d[2]] = d[3] ? parseInt(d[3], 10) : d[2].match(/^(ct|salt|iv)$/) ? sjcl.codec.base64.toBits(d[4]) : unescape(d[4])
  }
  return b
}, c:function(a, b, c) {
  if(a === undefined) {
    a = {}
  }
  if(b === undefined) {
    return a
  }
  var d;
  for(d in b) {
    if(b.hasOwnProperty(d)) {
      if(c && a[d] !== undefined && a[d] !== b[d]) {
        throw new sjcl.exception.invalid("required parameter overridden");
      }
      a[d] = b[d]
    }
  }
  return a
}, V:function(a, b) {
  var c = {}, d;
  for(d in a) {
    if(a.hasOwnProperty(d) && a[d] !== b[d]) {
      c[d] = a[d]
    }
  }
  return c
}, U:function(a, b) {
  var c = {}, d;
  for(d = 0;d < b.length;d++) {
    if(a[b[d]] !== undefined) {
      c[b[d]] = a[b[d]]
    }
  }
  return c
}};
sjcl.encrypt = sjcl.json.encrypt;
sjcl.decrypt = sjcl.json.decrypt;
sjcl.misc.R = {};
sjcl.misc.cachedPbkdf2 = function(a, b) {
  var c = sjcl.misc.R, d;
  b = b || {};
  d = b.iter || 1E3;
  c = c[a] = c[a] || {};
  d = c[d] = c[d] || {firstSalt:b.salt && b.salt.length ? b.salt.slice(0) : sjcl.random.randomWords(2, 0)};
  c = b.salt === undefined ? d.firstSalt : b.salt;
  d[c] = d[c] || sjcl.misc.pbkdf2(a, c, b.iter);
  return{key:d[c].slice(0), salt:c.slice(0)}
};
goog.provide("FirebaseSimpleLogin");
goog.provide("FirebaseAuthClient");
goog.require("fb.constants");
goog.require("fb.util.json");
goog.require("fb.util.validation");
goog.require("fb.util.sjcl");
goog.require("fb.simplelogin.validation");
goog.require("fb.simplelogin.persona");
goog.require("fb.simplelogin.winchan");
FirebaseSimpleLogin = function(ref, callback, context) {
  var self = this, dataURL = ref.toString(), namespace = null;
  fb.util.validation.validateArgCount("new FirebaseSimpleLogin", 1, 3, arguments.length);
  fb.util.validation.validateCallback("new FirebaseSimpleLogin", 2, callback, false);
  if(typeof ref === "string") {
    throw new Error("new FirebaseSimpleLogin(): Oops, it looks like you passed a string instead of a Firebase reference (i.e. new Firebase(<firebaseURL>)).");
  }
  if(goog.isString(dataURL)) {
    var colonInd = dataURL.indexOf("//");
    if(colonInd >= 0) {
      dataURL = dataURL.substring(colonInd + 2)
    }
    var dotInd = dataURL.indexOf(".");
    if(dotInd >= 0) {
      namespace = dataURL.substring(0, dotInd)
    }
  }
  if(!goog.isString(namespace)) {
    throw new Error("new FirebaseSimpleLogin(): First argument must be a valid Firebase reference (i.e. new Firebase(<firebaseURL>)).");
  }
  if(window.location.protocol === "file:" && !this.isMobilePhoneGap() && !this.isMobileTriggerIo() && console && console.log) {
    var message = "FirebaseSimpleLogin(): Due to browser security restrictions, " + "loading applications via `file://*` URLs will prevent popup-based authentication " + "providers from working properly. When testing locally, you'll need to run a " + "barebones webserver on your machine rather than loading your test files via " + "`file://*`. The easiest way to run a barebones server on your local machine is to " + "`cd` to the root directory of your code and run `python -m SimpleHTTPServer`, " + 
    "which will allow you to access your content via `http://127.0.0.1:8000/*`.";
    console.log(message)
  }
  this.mRef = ref;
  this.mNamespace = namespace;
  this.mApiHost = "https://auth.firebase.com";
  this.sessionLengthDays = null;
  this.mLoginStateChange = function() {
    var args = Array.prototype.slice.apply(arguments);
    var isProxyEnabled = typeof window["Proxy"] === "function" && window["Proxy"].length === 2;
    var publicAttributes = {"anonymous":["uid", "firebaseAuthToken", "id", "provider"], "password":["uid", "email", "firebaseAuthToken", "id", "md5_hash", "provider"], "facebook":["uid", "accessToken", "displayName", "firebaseAuthToken", "id", "provider"], "github":["uid", "accessToken", "displayName", "firebaseAuthToken", "id", "provider", "username"], "persona":["uid", "email", "firebaseAuthToken", "id", "md5_hash", "provider"], "twitter":["uid", "accessToken", "accessTokenSecret", "displayName", 
    "firebaseAuthToken", "id", "provider", "username"]};
    if(isProxyEnabled && args[1] && args[1]["provider"]) {
      var provider = args[1]["provider"];
      if(Firebase && Firebase.INTERNAL && Firebase.INTERNAL.statsIncrementCounter) {
        args[1] = new Proxy(args[1], {"get":function(target, name) {
          if(publicAttributes[provider].indexOf(name) < 0) {
            Firebase.INTERNAL.statsIncrementCounter(ref, "simple_login_undocumented_attribute_use." + name)
          }
          return target[name]
        }})
      }
    }
    setTimeout(function() {
      callback.apply(context, args)
    }, 0)
  };
  this.resumeSession()
};
FirebaseSimpleLogin.onOpen = function(cb) {
  fb.simplelogin.winchan.onOpen(cb)
};
FirebaseSimpleLogin.prototype.hasLocalStorage = function() {
  try {
    localStorage.setItem("firebase-sentinel", "test");
    var result = localStorage.getItem("firebase-sentinel");
    localStorage.removeItem("firebase-sentinel");
    return result === "test"
  }catch(e) {
  }
  return false
};
FirebaseSimpleLogin.prototype.resumeSession = function() {
  var session = {};
  if(this.hasLocalStorage()) {
    var sessionKey = this.readCookie("firebaseSessionKey");
    var payload = localStorage.getItem("firebaseSession");
    if(sessionKey && payload) {
      try {
        session = fb.util.json.eval(sjcl.decrypt(sessionKey, fb.util.json.eval(payload)))
      }catch(e) {
      }
    }
  }
  if(session && session.token && session.user) {
    this.attemptAuth(session.token, session.user, false)
  }else {
    this.mLoginStateChange(null, null)
  }
};
FirebaseSimpleLogin.prototype.saveSession = function(token, user) {
  if(this.hasLocalStorage()) {
    var session = {token:token, user:user};
    var sessionKey = user["sessionKey"];
    var payload = sjcl.encrypt(sessionKey, fb.util.json.stringify(session));
    this.writeCookie("firebaseSessionKey", sessionKey, this.sessionLengthDays);
    localStorage.setItem("firebaseSession", fb.util.json.stringify(payload))
  }
};
FirebaseSimpleLogin.prototype.clearSession = function() {
  if(this.hasLocalStorage()) {
    this.writeCookie("firebaseSessionKey", "", -1);
    localStorage.removeItem("firebaseSession")
  }
};
FirebaseSimpleLogin.prototype.writeCookie = function(name, value, optDays) {
  var expires = "";
  if(optDays) {
    var date = new Date;
    date.setTime(date.getTime() + optDays * 24 * 60 * 60 * 1E3);
    expires = "; expires=" + date.toGMTString()
  }
  document.cookie = name + "=" + value + expires + "; path=/"
};
FirebaseSimpleLogin.prototype.readCookie = function(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(";");
  for(var i = 0;i < ca.length;i++) {
    var c = ca[i];
    while(c.charAt(0) == " ") {
      c = c.substring(1, c.length)
    }
    if(c.indexOf(nameEQ) == 0) {
      return c.substring(nameEQ.length, c.length)
    }
  }
  return null
};
FirebaseSimpleLogin.prototype.attemptAuth = function(token, user, saveSession) {
  var self = this;
  this.mRef["auth"](token, function(error, dummy) {
    if(!error) {
      if(saveSession) {
        self.saveSession(token, user)
      }
      if(typeof dummy == "function") {
        dummy()
      }
      delete user["sessionKey"];
      user["firebaseAuthToken"] = token;
      self.mLoginStateChange(null, user)
    }else {
      self.clearSession();
      self.mLoginStateChange(null, null)
    }
  }, function(error) {
    self.clearSession();
    self.mLoginStateChange(null, null)
  })
};
FirebaseSimpleLogin.prototype.login = function(provider) {
  fb.util.validation.validateString(methodId, 1, provider, false);
  var self = this, options = {}, provider = provider.toLowerCase(), methodId = "FirebaseSimpleLogin.login(" + provider + ")";
  if(provider === "password") {
    options = arguments[1] || {};
    if(!fb.simplelogin.validation.isValidEmail(options.email)) {
      return this.mLoginStateChange(this.formatError({code:"INVALID_EMAIL", message:"Invalid email specified."}))
    }
    if(!fb.simplelogin.validation.isValidPassword(options.password)) {
      return this.mLoginStateChange(this.formatError({code:"INVALID_PASSWORD", message:"Invalid password specified."}))
    }
  }else {
    if(provider === "facebook" || provider === "github" || provider === "persona" || provider === "twitter" || provider === "anonymous") {
      fb.util.validation.validateArgCount(methodId, 1, 2, arguments.length);
      options = arguments[1] || {}
    }
  }
  var callback = this.mLoginStateChange;
  this.sessionLengthDays = options.rememberMe ? 30 : null;
  switch(provider) {
    case "password":
      this.jsonp("/auth/firebase", {"email":options.email, "password":options.password}, function(error, response) {
        if(error || !response["token"]) {
          callback(self.formatError(error))
        }else {
          var token = response["token"];
          var user = response["user"];
          self.attemptAuth(token, user, true)
        }
      });
      break;
    case "github":
      options["height"] = 850;
      options["width"] = 950;
    case "facebook":
    ;
    case "twitter":
      var isFacebookToken = provider === "facebook" && options.access_token;
      var isTwitterToken = provider === "twitter" && options.user_id && options.oauth_token && options.oauth_token_secret;
      if(isFacebookToken || isTwitterToken) {
        this.jsonp("/auth/" + provider + "/token", options, function(error, response) {
          if(error || !response["token"]) {
            callback(self.formatError(error))
          }else {
            var token = response["token"];
            var user = response["user"];
            self.attemptAuth(token, user, true)
          }
        })
      }else {
        this.launchAuthWindow(provider, options, function(err, token, user) {
          if(err) {
            self.mLoginStateChange(self.formatError(err), null)
          }else {
            self.attemptAuth(token, user, true)
          }
        })
      }
      break;
    case "persona":
      if(!navigator["id"]) {
        throw new Error(methodId + ": Unable to find Persona include.js");
      }
      var handlePersonaResponse = function(authResponse) {
        if(authResponse === null) {
          callback(self.formatError({code:"UNKNOWN_ERROR", message:"User denied authentication request or an error occurred."}))
        }else {
          self.jsonp("/auth/persona/token", {"assertion":authResponse}, function(error, response) {
            if(error || !response["token"]) {
              callback(self.formatError(error), null)
            }else {
              var token = response["token"];
              var user = response["user"];
              self.attemptAuth(token, user, true)
            }
          })
        }
      };
      fb.simplelogin.persona.login(handlePersonaResponse);
      break;
    case "anonymous":
      self.jsonp("/auth/anonymous", {}, function(error, response) {
        if(error || !response["token"]) {
          callback(self.formatError(error), null)
        }else {
          var token = response["token"];
          var user = response["user"];
          self.attemptAuth(token, user, true)
        }
      });
      break;
    default:
      throw new Error("FirebaseSimpleLogin.login() failed: unrecognized authentication provider");
  }
};
FirebaseSimpleLogin.prototype.logout = function() {
  var methodId = "FirebaseSimpleLogin.logout";
  fb.util.validation.validateArgCount(methodId, 0, 0, arguments.length);
  this.clearSession();
  this.mRef["unauth"]();
  this.mLoginStateChange(null, null)
};
FirebaseSimpleLogin.prototype.parseURL = function(url) {
  var a = document.createElement("a");
  a.href = url;
  return{protocol:a.protocol.replace(":", ""), host:a.hostname, port:a.port, query:a.search, params:function() {
    var ret = {}, seg = a.search.replace(/^\?/, "").split("&"), len = seg.length, i = 0, s;
    for(;i < len;i++) {
      if(!seg[i]) {
        continue
      }
      s = seg[i].split("=");
      ret[s[0]] = s[1]
    }
    return ret
  }(), hash:a.hash.replace("#", ""), path:a.pathname.replace(/^([^\/])/, "/$1")}
};
FirebaseSimpleLogin.prototype.isMobilePhoneGap = function() {
  return(window["cordova"] || window["PhoneGap"] || window["phonegap"]) && /^file:\/{3}[^\/]/i.test(window.location.href) && /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent)
};
FirebaseSimpleLogin.prototype.isMobileTriggerIo = function() {
  return window["forge"] && /^file:\/{3}[^\/]/i.test(window.location.href) && /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent)
};
FirebaseSimpleLogin.prototype.launchAuthWindow = function(provider, options, callback) {
  var self = this;
  var url = this.mApiHost + "/auth/" + provider + "?firebase=" + this.mNamespace;
  if(options["scope"]) {
    url += "&scope=" + options["scope"]
  }
  if(options["debug"]) {
    url += "&debug=" + options["debug"]
  }
  var window_features = {"menubar":0, "location":0, "resizable":0, "scrollbars":1, "status":0, "dialog":1, "width":700, "height":375};
  if(options["height"]) {
    window_features["height"] = options["height"];
    delete options["height"]
  }
  if(options["width"]) {
    window_features["width"] = options["width"];
    delete options["width"]
  }
  if(this.isMobilePhoneGap()) {
    url += "&internalRedirect=true&transport=internalRedirect";
    var windowRef = window.open(url, "blank", "location=no");
    var callbackReturned = false;
    windowRef.addEventListener("loadstop", function onurlchangestuff(event) {
      try {
        var parsedURL = self.parseURL(event.url);
        if(parsedURL["path"] === "/auth/_blank") {
          windowRef.close();
          var resEncoded = parsedURL.params;
          var res = {};
          for(var key in resEncoded) {
            try {
              res[key] = fb.util.json.eval(decodeURIComponent(resEncoded[key]))
            }catch(jsonErr) {
            }
          }
          if(!callbackReturned) {
            callbackReturned = true;
            if(res && res["error"]) {
              return callback(res["error"])
            }else {
              if(res && res["token"] && res["user"]) {
                return callback(null, res["token"], res["user"])
              }else {
                return callback({code:"UNKNOWN_ERROR", message:"An unknown error occurred."})
              }
            }
          }
        }
      }catch(e) {
        windowRef.close();
        if(!callbackReturned) {
          callbackReturned = true;
          return callback({code:"UNKNOWN_ERROR", message:"An unknown error occurred."})
        }
      }
    });
    windowRef.addEventListener("exit", function(event) {
      if(!callbackReturned) {
        callbackReturned = true;
        return callback({code:"UNKNOWN_ERROR", message:"An unknown error occurred."})
      }
    });
    setTimeout(function() {
      if(windowRef && windowRef.close) {
        windowRef.close()
      }
    }, 4E4)
  }else {
    if(this.isMobileTriggerIo()) {
      if(!window["forge"] || !window["forge"]["tabs"]) {
        return callback({code:"TRIGGER_IO_ERROR", message:'"forge.tabs" module required when using Firebase Simple Login and Trigger.io'})
      }
      forge.tabs.openWithOptions({url:url + "&internalRedirect=true&transport=internalRedirect", pattern:this.mApiHost + "/auth/_blank*"}, function(data) {
        var res = null;
        if(data && data.url) {
          try {
            var parsedURL = self.parseURL(data.url);
            var resEncoded = parsedURL.params;
            res = {};
            for(var key in resEncoded) {
              res[key] = fb.util.json.eval(decodeURIComponent(resEncoded[key]))
            }
          }catch(e) {
          }
        }else {
          if(data && data.userCancelled) {
            return callback({code:"USER_DENIED", message:"User cancelled the authentication request."})
          }
        }
        if(res && res["token"] && res["user"]) {
          return callback(null, res["token"], res["user"])
        }else {
          if(res && res["error"]) {
            return callback(res["error"])
          }else {
            return callback({code:"UNKNOWN_ERROR", message:"An unknown error occurred."})
          }
        }
      }, function(error) {
        callback({code:"UNKNOWN_ERROR", message:"An unknown error occurred."})
      })
    }else {
      var window_features_arr = [];
      for(var key in window_features) {
        window_features_arr.push(key + "=" + window_features[key])
      }
      fb.simplelogin.winchan.open({url:url + "&transport=winchan", relay_url:this.mApiHost + "/auth/channel", window_features:window_features_arr.join(",")}, function(error, res) {
        if(res && res.token && res.user) {
          callback(null, res.token, res.user)
        }else {
          if(error === "unknown closed window") {
            callback({code:"USER_DENIED", message:"User cancelled the authentication request."})
          }else {
            if(res.error) {
              callback(res.error)
            }else {
              callback({code:"UNKNOWN_ERROR", message:"An unknown error occurred."})
            }
          }
        }
      })
    }
  }
};
FirebaseSimpleLogin.prototype.createUser = function(email, password, callback) {
  var self = this;
  fb.util.validation.validateArgCount("FirebaseSimpleLogin.createUser", 3, 3, arguments.length);
  fb.util.validation.validateCallback("FirebaseSimpleLogin.createUser", 3, callback, false);
  if(!fb.simplelogin.validation.isValidEmail(email)) {
    return callback(this.formatError({code:"INVALID_EMAIL", message:"Invalid email specified."}))
  }
  if(!fb.simplelogin.validation.isValidPassword(password)) {
    return callback(this.formatError({code:"INVALID_PASSWORD", message:"Invalid password specified. "}))
  }
  this.jsonp("/auth/firebase/create", {"email":email, "password":password}, function(error, user) {
    if(error) {
      callback(self.formatError(error), null)
    }else {
      callback(null, user)
    }
  })
};
FirebaseSimpleLogin.prototype.changePassword = function(email, oldPassword, newPassword, callback) {
  var self = this;
  fb.util.validation.validateArgCount("FirebaseSimpleLogin.changePassword", 4, 4, arguments.length);
  fb.util.validation.validateCallback("FirebaseSimpleLogin.changePassword", 4, callback, false);
  if(!fb.simplelogin.validation.isValidEmail(email)) {
    return callback(this.formatError({code:"INVALID_EMAIL", message:"Invalid email specified."}))
  }
  if(!fb.simplelogin.validation.isValidPassword(oldPassword)) {
    return callback(this.formatError({code:"INVALID_PASSWORD", message:"Invalid password specified. "}))
  }
  if(!fb.simplelogin.validation.isValidPassword(newPassword)) {
    return callback(this.formatError({code:"INVALID_PASSWORD", message:"Invalid password specified. "}))
  }
  this.jsonp("/auth/firebase/update", {"email":email, "oldPassword":oldPassword, "newPassword":newPassword}, function(error, result) {
    if(error) {
      callback(self.formatError(error), false)
    }else {
      callback(null, true)
    }
  })
};
FirebaseSimpleLogin.prototype.removeUser = function(email, password, callback) {
  var self = this;
  fb.util.validation.validateArgCount("FirebaseSimpleLogin.removeUser", 3, 3, arguments.length);
  fb.util.validation.validateCallback("FirebaseSimpleLogin.removeUser", 3, callback, false);
  if(!fb.simplelogin.validation.isValidEmail(email)) {
    return callback(this.formatError({code:"INVALID_EMAIL", message:"Invalid email specified."}))
  }
  if(!fb.simplelogin.validation.isValidPassword(password)) {
    return callback(this.formatError({code:"INVALID_PASSWORD", message:"Invalid password specified. "}))
  }
  this.jsonp("/auth/firebase/remove", {"email":email, "password":password}, function(error, result) {
    if(error) {
      callback(self.formatError(error), false)
    }else {
      callback(null, true)
    }
  })
};
FirebaseSimpleLogin["_callbacks"] = {};
FirebaseSimpleLogin.prototype.jsonp = function(path, data, callback) {
  var self = this;
  var url = this.mApiHost + path;
  url += /\?/.test(url) ? "" : "?";
  url += "&firebase=" + this.mNamespace;
  url += "&transport=jsonp";
  for(var param in data) {
    url += "&" + encodeURIComponent(param) + "=" + encodeURIComponent(data[param])
  }
  var callbackId = "_firebaseXDR" + (new Date).getTime().toString() + Math.floor(Math.random() * 100);
  url += "&callback=" + encodeURIComponent("FirebaseSimpleLogin._callbacks." + callbackId);
  FirebaseSimpleLogin["_callbacks"][callbackId] = function(result) {
    var error = result["error"] || null;
    delete result["error"];
    callback(error, result);
    setTimeout(function() {
      delete FirebaseSimpleLogin["_callbacks"][callbackId];
      var el = document.getElementById(callbackId);
      if(el !== null) {
        el.parentNode.removeChild(el)
      }
    })
  };
  setTimeout(function() {
    try {
      var js = document.createElement("script");
      js.type = "text/javascript";
      js.id = callbackId;
      js.async = true;
      js.src = url;
      js.onerror = function() {
        var el = document.getElementById(callbackId);
        if(el !== null) {
          el.parentNode.removeChild(el)
        }
        callback(self.formatError({code:"SERVER_ERROR", message:"An unknown server error occurred."}))
      };
      var ref = document.getElementsByTagName("script")[0];
      ref.parentNode.insertBefore(js, ref)
    }catch(e) {
      callback(self.formatError({code:"SERVER_ERROR", message:"An unknown server error occurred."}))
    }
  }, 1)
};
FirebaseSimpleLogin.prototype.formatError = function(error) {
  var errorObj = new Error(error.message || "");
  errorObj.code = error.code || "UNKNOWN_ERROR";
  return errorObj
};
FirebaseAuthClient = function(ref, callback, context) {
  if(Firebase && Firebase.INTERNAL && Firebase.INTERNAL.statsIncrementCounter) {
    Firebase.INTERNAL.statsIncrementCounter(ref, "simple_login_deprecated_constructor")
  }
  if(typeof console !== "undefined") {
    var message = "FirebaseAuthClient class being deprecated. Please use https://cdn.firebase.com/v0/firebase-simple-login.js and reference FirebaseSimpleLogin instead.";
    if(typeof console.warn !== "undefined") {
      console.warn(message)
    }else {
      console.log(message)
    }
  }
  return new FirebaseSimpleLogin(ref, callback, context)
};
FirebaseAuthClient.onOpen = FirebaseSimpleLogin.onOpen;

