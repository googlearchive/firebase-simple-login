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
goog.provide("fb.simplelogin.Vars");
goog.provide("fb.simplelogin.Vars_");
fb.simplelogin.Vars_ = function() {
  this.apiHost = "https://auth.firebase.com"
};
fb.simplelogin.Vars_.prototype.setApiHost = function(apiHost) {
  this.apiHost = apiHost
};
fb.simplelogin.Vars_.prototype.getApiHost = function() {
  return this.apiHost
};
fb.simplelogin.Vars = new fb.simplelogin.Vars_;
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
goog.provide("fb.simplelogin.util.json");
goog.require("goog.json");
fb.simplelogin.util.json.eval = function(str) {
  if(typeof JSON !== "undefined" && goog.isDef(JSON.parse)) {
    return JSON.parse(str)
  }else {
    return goog.json.parse(str)
  }
};
fb.simplelogin.util.json.stringify = function(data) {
  if(typeof JSON !== "undefined" && goog.isDef(JSON.stringify)) {
    return JSON.stringify(data)
  }else {
    return goog.json.serialize(data)
  }
};
goog.provide("fb.simplelogin.transports.Transport");
fb.simplelogin.Transport = function() {
};
fb.simplelogin.Transport.prototype.open = function(url, options, onComplete) {
};
goog.provide("fb.simplelogin.transports.Popup");
goog.require("fb.simplelogin.transports.Transport");
fb.simplelogin.Popup = function() {
};
fb.simplelogin.Popup.prototype.open = function(url, options, onComplete) {
};
goog.provide("fb.simplelogin.util.misc");
goog.require("goog.json");
fb.simplelogin.util.misc.parseUrl = function(url) {
  var a = document.createElement("a");
  a.href = url;
  return{protocol:a.protocol.replace(":", ""), host:a.hostname, port:a.port, query:a.search, params:fb.simplelogin.util.misc.parseQuerystring(a.search), hash:a.hash.replace("#", ""), path:a.pathname.replace(/^([^\/])/, "/$1")}
};
fb.simplelogin.util.misc.parseQuerystring = function(str) {
  var obj = {};
  var tokens = str.replace(/^\?/, "").split("&");
  for(var i = 0;i < tokens.length;i++) {
    if(tokens[i]) {
      var key = tokens[i].split("=");
      obj[key[0]] = key[1]
    }
  }
  return obj
};
goog.provide("fb.simplelogin.transports.CordovaInAppBrowser");
goog.provide("fb.simplelogin.transports.CordovaInAppBrowser_");
goog.require("fb.simplelogin.transports.Popup");
goog.require("fb.simplelogin.Vars");
goog.require("fb.simplelogin.util.json");
goog.require("fb.simplelogin.util.misc");
var popupTimeout = 4E4;
fb.simplelogin.transports.CordovaInAppBrowser_ = function() {
};
fb.simplelogin.transports.CordovaInAppBrowser_.prototype.open = function(url, options, onComplete) {
  callbackInvoked = false;
  var callbackHandler = function() {
    var args = Array.prototype.slice.apply(arguments);
    if(!callbackInvoked) {
      callbackInvoked = true;
      onComplete.apply(null, args)
    }
  };
  var windowRef = window["open"](url + "&transport=internal-redirect-hash", "blank", "location=no");
  windowRef.addEventListener("loadstop", function(event) {
    var result;
    if(event && event["url"]) {
      var urlObj = fb.simplelogin.util.misc.parseUrl(event["url"]);
      if(urlObj["path"] !== "/blank/page.html") {
        return
      }
      windowRef.close();
      try {
        var urlHashEncoded = fb.simplelogin.util.misc.parseQuerystring(urlObj["hash"]);
        var urlHashEncoded = fb.simplelogin.util.misc.parseQuerystring(decodeURIComponent(urlObj["hash"]));
        var temporaryResult = {};
        for(var key in urlHashEncoded) {
          temporaryResult[key] = fb.simplelogin.util.json.eval(urlHashEncoded[key])
        }
        result = temporaryResult
      }catch(e) {
      }
      if(result && result["token"] && result["user"]) {
        callbackHandler(null, result)
      }else {
        if(result && result["error"]) {
          callbackHandler(result["error"])
        }else {
          callbackHandler({code:"UNKNOWN_ERROR", message:"An unknown error occurred."})
        }
      }
    }
  });
  windowRef.addEventListener("exit", function(event) {
    callbackHandler({code:"USER_DENIED", message:"User cancelled the authentication request."})
  });
  setTimeout(function() {
    if(windowRef && windowRef["close"]) {
      windowRef["close"]()
    }
  }, popupTimeout)
};
fb.simplelogin.transports.CordovaInAppBrowser = new fb.simplelogin.transports.CordovaInAppBrowser_;
goog.provide("fb.simplelogin.Errors");
var messagePrefix = "FirebaseSimpleLogin: ";
var errors = {"UNKNOWN_ERROR":"An unknown error occurred.", "INVALID_EMAIL":"Invalid email specified.", "INVALID_PASSWORD":"Invalid password specified.", "USER_DENIED":"User cancelled the authentication request.", "TRIGGER_IO_TABS":'The "forge.tabs" module required when using Firebase Simple Login and                         Trigger.io. Without this module included and enabled, login attempts to                         OAuth authentication providers will not be able to complete.'};
fb.simplelogin.Errors.format = function(errorCode, errorMessage) {
  var code = errorCode || "UNKNOWN_ERROR", message = errorMessage || errors[code], args = arguments;
  if(args.length === 2) {
    code = args[0];
    message = args[1]
  }else {
    if(args.length === 1) {
      if(typeof args[0] === "object" && args[0].code && args[0].message) {
        code = args[0].code;
        message = args[0].message
      }else {
        if(typeof args[0] === "string") {
          code = args[0];
          message = ""
        }
      }
    }
  }
  var error = new Error(messagePrefix + message);
  error.code = code;
  return error
};
fb.simplelogin.Errors.get = function(code) {
  if(!errors[code]) {
    code = "UNKNOWN_ERROR"
  }
  return fb.simplelogin.Errors.format(code, errors[code])
};
goog.provide("fb.simplelogin.transports.WinChan");
goog.require("fb.simplelogin.transports.Transport");
goog.require("fb.simplelogin.Vars");
goog.require("fb.simplelogin.util.json");
fb.simplelogin.transports.WinChan = function() {
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
    return fb.simplelogin.util.json && fb.simplelogin.util.json.eval && fb.simplelogin.util.json.stringify && window.postMessage
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
    return{open:function(url, opts, cb) {
      if(!cb) {
        throw"missing required callback argument";
      }
      opts.url = url;
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
      var req = fb.simplelogin.util.json.stringify({a:"request", d:opts.params});
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
          var d = fb.simplelogin.util.json.eval(e.data);
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
        msg = fb.simplelogin.util.json.stringify(msg);
        if(isIE) {
          msgTarget.doPost(msg, o)
        }else {
          msgTarget.postMessage(msg, o)
        }
      }
      function onMessage(e) {
        var d;
        try {
          d = fb.simplelogin.util.json.eval(e.data)
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
goog.provide("fb.simplelogin.transports.TriggerIoTab");
goog.provide("fb.simplelogin.transports.TriggerIoTab_");
goog.require("fb.simplelogin.transports.Popup");
goog.require("fb.simplelogin.Vars");
goog.require("fb.simplelogin.util.json");
goog.require("fb.simplelogin.util.misc");
fb.simplelogin.transports.TriggerIoTab_ = function() {
};
fb.simplelogin.transports.TriggerIoTab_.prototype.open = function(url, options, onComplete) {
  var Forge, Tabs;
  try {
    Forge = window["forge"];
    Tabs = Forge["tabs"]
  }catch(err) {
    return onComplete({code:"TRIGGER_IO_TABS", message:'"forge.tabs" module required when using Firebase Simple Login and Trigger.io'})
  }
  callbackInvoked = false;
  var callbackHandler = function() {
    var args = Array.prototype.slice.apply(arguments);
    if(!callbackInvoked) {
      callbackInvoked = true;
      onComplete.apply(null, args)
    }
  };
  forge.tabs.openWithOptions({url:url + "&transport=internal-redirect-hash", pattern:fb.simplelogin.Vars.getApiHost() + "/blank/page*"}, function(data) {
    var result;
    if(data && data["url"]) {
      try {
        var urlObj = fb.simplelogin.util.misc.parseUrl(data["url"]);
        var urlHashEncoded = fb.simplelogin.util.misc.parseQuerystring(decodeURIComponent(urlObj["hash"]));
        var urlHashEncoded = fb.simplelogin.util.misc.parseQuerystring(urlObj["hash"]);
        var temporaryResult = {};
        for(var key in urlHashEncoded) {
          temporaryResult[key] = fb.simplelogin.util.json.eval(urlHashEncoded[key])
        }
        result = temporaryResult
      }catch(e) {
      }
    }
    if(result && result["token"] && result["user"]) {
      callbackHandler(null, result)
    }else {
      if(result && result["error"]) {
        callbackHandler(result["error"])
      }else {
        callbackHandler({code:"UNKNOWN_ERROR", message:"An unknown error occurred."})
      }
    }
  }, function(err) {
    callbackHandler({code:"UNKNOWN_ERROR", message:"An unknown error occurred."})
  })
};
fb.simplelogin.transports.TriggerIoTab = new fb.simplelogin.transports.TriggerIoTab_;
goog.provide("fb.simplelogin.util.sjcl");
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
goog.provide("fb.simplelogin.util.env");
fb.simplelogin.util.env.hasLocalStorage = function(str) {
  try {
    if(localStorage) {
      localStorage.setItem("firebase-sentinel", "test");
      var result = localStorage.getItem("firebase-sentinel");
      localStorage.removeItem("firebase-sentinel");
      return result === "test"
    }
  }catch(e) {
  }
  return false
};
fb.simplelogin.util.env.isMobileCordovaInAppBrowser = function() {
  return(window["cordova"] || window["CordovaInAppBrowser"] || window["phonegap"]) && /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent)
};
fb.simplelogin.util.env.isMobileTriggerIoTab = function() {
  return window["forge"] && /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent)
};
fb.simplelogin.util.env.isWindowsMetro = function() {
  return!!window["Windows"] && /^ms-appx:/.test(location.href)
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.ASSUME_ANY_VERSION = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && !!document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
  if(goog.events.Listener.ENABLE_MONITORING) {
    this.creationStack = (new Error).stack
  }
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.ENABLE_MONITORING = false;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.creationStack;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8"), HAS_NAVIGATOR_ONLINE_PROPERTY:!goog.userAgent.WEBKIT || goog.userAgent.isVersion("528"), HAS_HTML5_NETWORK_EVENT_SUPPORT:goog.userAgent.GECKO && goog.userAgent.isVersion("1.9b") || goog.userAgent.IE && goog.userAgent.isVersion("8") || goog.userAgent.OPERA && 
goog.userAgent.isVersion("9.5") || goog.userAgent.WEBKIT && goog.userAgent.isVersion("528"), HTML5_NETWORK_EVENTS_FIRE_ON_BODY:goog.userAgent.GECKO && !goog.userAgent.isVersion("8") || goog.userAgent.IE && !goog.userAgent.isVersion("9")};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return value
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", ONLINE:"online", OFFLINE:"offline", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  this.disposed_ = false;
  if(goog.Disposable.ENABLE_MONITORING) {
    this.creationStack = (new Error).stack;
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.dependentDisposables_;
goog.Disposable.prototype.onDisposeCallbacks_;
goog.Disposable.prototype.creationStack;
goog.Disposable.prototype.isDisposed = function() {
  return!!this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    if(goog.Disposable.ENABLE_MONITORING) {
      if(this.disposed_ == undefined) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor");
      }
      var uid = goog.getUid(this);
      delete goog.Disposable.instances_[uid]
    }
    this.disposed_ = true;
    this.disposeInternal()
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if(!this.dependentDisposables_) {
    this.dependentDisposables_ = []
  }
  this.dependentDisposables_.push(disposable)
};
goog.Disposable.prototype.addOnDisposeCallback = function(callback, opt_scope) {
  if(!this.onDisposeCallbacks_) {
    this.onDisposeCallbacks_ = []
  }
  this.onDisposeCallbacks_.push(goog.bind(callback, opt_scope))
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_)
  }
  if(this.onDisposeCallbacks_) {
    while(this.onDisposeCallbacks_.length) {
      this.onDisposeCallbacks_.shift()()
    }
  }
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.events.Event.prototype.disposeInternal = function() {
};
goog.events.Event.prototype.dispose = function() {
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.defaultPrevented = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.defaultPrevented = true;
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = goog.userAgent.WEBKIT || e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = goog.userAgent.WEBKIT || e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  if(e.defaultPrevented) {
    this.preventDefault()
  }
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = {count_:0, remaining_:0}
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = {count_:0, remaining_:0};
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = [];
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.getProxy();
      proxy.src = src;
      listenerObj = new goog.events.Listener;
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = []
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(listenerArray) {
    listenerArray.needsCleanup_ = true;
    goog.events.cleanUp_(type, capture, srcUid, listenerArray)
  }
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return listener.handleEvent(eventObject)
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  retval = goog.events.fireListener(listener, be);
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.uri.utils");
goog.provide("goog.uri.utils.ComponentIndex");
goog.provide("goog.uri.utils.QueryArray");
goog.provide("goog.uri.utils.QueryValue");
goog.provide("goog.uri.utils.StandardQueryParam");
goog.require("goog.asserts");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
  var out = [];
  if(opt_scheme) {
    out.push(opt_scheme, ":")
  }
  if(opt_domain) {
    out.push("//");
    if(opt_userInfo) {
      out.push(opt_userInfo, "@")
    }
    out.push(opt_domain);
    if(opt_port) {
      out.push(":", opt_port)
    }
  }
  if(opt_path) {
    out.push(opt_path)
  }
  if(opt_queryData) {
    out.push("?", opt_queryData)
  }
  if(opt_fragment) {
    out.push("#", opt_fragment)
  }
  return out.join("")
};
goog.uri.utils.splitRe_ = new RegExp("^" + "(?:" + "([^:/?#.]+)" + ":)?" + "(?://" + "(?:([^/?#]*)@)?" + "([\\w\\d\\-\\u0100-\\uffff.%]*)" + "(?::([0-9]+))?" + ")?" + "([^?#]+)?" + "(?:\\?([^#]*))?" + "(?:#(.*))?" + "$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  return uri.match(goog.uri.utils.splitRe_)
};
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri)
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri)
};
goog.uri.utils.getEffectiveScheme = function(uri) {
  var scheme = goog.uri.utils.getScheme(uri);
  if(!scheme && self.location) {
    var protocol = self.location.protocol;
    scheme = protocol.substr(0, protocol.length - 1)
  }
  return scheme ? scheme.toLowerCase() : ""
};
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, uri)
};
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(uri))
};
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, uri)
};
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri))
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri)
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri))
};
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, uri)
};
goog.uri.utils.getFragmentEncoded = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? null : uri.substr(hashIndex + 1)
};
goog.uri.utils.setFragmentEncoded = function(uri, fragment) {
  return goog.uri.utils.removeFragment(uri) + (fragment ? "#" + fragment : "")
};
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(uri))
};
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], pieces[goog.uri.utils.ComponentIndex.USER_INFO], pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT])
};
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, pieces[goog.uri.utils.ComponentIndex.PATH], pieces[goog.uri.utils.ComponentIndex.QUERY_DATA], pieces[goog.uri.utils.ComponentIndex.FRAGMENT])
};
goog.uri.utils.removeFragment = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? uri : uri.substr(0, hashIndex)
};
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1);
  var pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.SCHEME] == pieces2[goog.uri.utils.ComponentIndex.SCHEME] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  if(goog.DEBUG && (uri.indexOf("#") >= 0 || uri.indexOf("?") >= 0)) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not " + "supported: [" + uri + "]");
  }
};
goog.uri.utils.QueryValue;
goog.uri.utils.QueryArray;
goog.uri.utils.appendQueryData_ = function(buffer) {
  if(buffer[1]) {
    var baseUri = buffer[0];
    var hashIndex = baseUri.indexOf("#");
    if(hashIndex >= 0) {
      buffer.push(baseUri.substr(hashIndex));
      buffer[0] = baseUri = baseUri.substr(0, hashIndex)
    }
    var questionIndex = baseUri.indexOf("?");
    if(questionIndex < 0) {
      buffer[1] = "?"
    }else {
      if(questionIndex == baseUri.length - 1) {
        buffer[1] = undefined
      }
    }
  }
  return buffer.join("")
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if(goog.isArray(value)) {
    goog.asserts.assertArray(value);
    for(var j = 0;j < value.length;j++) {
      goog.uri.utils.appendKeyValuePairs_(key, String(value[j]), pairs)
    }
  }else {
    if(value != null) {
      pairs.push("&", key, value === "" ? "" : "=", goog.string.urlEncode(value))
    }
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2 == 0, "goog.uri.utils: Key/value lists must be even in length.");
  for(var i = opt_startIndex || 0;i < keysAndValues.length;i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_([], keysAndValues, opt_startIndex);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for(var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(arguments.length == 2 ? goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1))
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([uri], map))
};
goog.uri.utils.appendParam = function(uri, key, value) {
  return goog.uri.utils.appendQueryData_([uri, "&", key, "=", goog.string.urlEncode(value)])
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  var index = startIndex;
  var keyLength = keyEncoded.length;
  while((index = uri.indexOf(keyEncoded, index)) >= 0 && index < hashOrEndIndex) {
    var precedingChar = uri.charCodeAt(index - 1);
    if(precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if(!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index
      }
    }
    index += keyLength + 1
  }
  return-1
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return goog.uri.utils.findParam_(uri, 0, keyEncoded, uri.search(goog.uri.utils.hashOrEndRe_)) >= 0
};
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var foundIndex = goog.uri.utils.findParam_(uri, 0, keyEncoded, hashOrEndIndex);
  if(foundIndex < 0) {
    return null
  }else {
    var endPosition = uri.indexOf("&", foundIndex);
    if(endPosition < 0 || endPosition > hashOrEndIndex) {
      endPosition = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    return goog.string.urlDecode(uri.substr(foundIndex, endPosition - foundIndex))
  }
};
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var result = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    position = uri.indexOf("&", foundIndex);
    if(position < 0 || position > hashOrEndIndex) {
      position = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    result.push(goog.string.urlDecode(uri.substr(foundIndex, position - foundIndex)))
  }
  return result
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var buffer = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    buffer.push(uri.substring(position, foundIndex));
    position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex)
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1")
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value)
};
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);
  if(goog.string.endsWith(baseUri, "/")) {
    baseUri = baseUri.substr(0, baseUri.length - 1)
  }
  if(goog.string.startsWith(path, "/")) {
    path = path.substr(1)
  }
  return goog.string.buildString(baseUri, "/", path)
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString())
};
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(f.call(opt_obj, val, undefined, iterator)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      return f.call(opt_obj, val, undefined, iterator)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(dropping && f.call(opt_obj, val, undefined, iterator)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterator.next();
        if(f.call(opt_obj, val, undefined, iterator)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.iter.cycle = function(iterable) {
  var baseIterator = goog.iter.toIterator(iterable);
  var cache = [];
  var cacheIndex = 0;
  var iter = new goog.iter.Iterator;
  var useCache = false;
  iter.next = function() {
    var returnElement = null;
    if(!useCache) {
      try {
        returnElement = baseIterator.next();
        cache.push(returnElement);
        return returnElement
      }catch(e) {
        if(e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        useCache = true
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return returnElement
  };
  return iter
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.net.ErrorCode");
goog.net.ErrorCode = {NO_ERROR:0, ACCESS_DENIED:1, FILE_NOT_FOUND:2, FF_SILENT_ERROR:3, CUSTOM_ERROR:4, EXCEPTION:5, HTTP_ERROR:6, ABORT:7, TIMEOUT:8, OFFLINE:9};
goog.net.ErrorCode.getDebugMessage = function(errorCode) {
  switch(errorCode) {
    case goog.net.ErrorCode.NO_ERROR:
      return"No Error";
    case goog.net.ErrorCode.ACCESS_DENIED:
      return"Access denied to content document";
    case goog.net.ErrorCode.FILE_NOT_FOUND:
      return"File not found";
    case goog.net.ErrorCode.FF_SILENT_ERROR:
      return"Firefox silently errored";
    case goog.net.ErrorCode.CUSTOM_ERROR:
      return"Application custom error";
    case goog.net.ErrorCode.EXCEPTION:
      return"An exception occurred";
    case goog.net.ErrorCode.HTTP_ERROR:
      return"Http response at 400 or 500 level";
    case goog.net.ErrorCode.ABORT:
      return"Request was aborted";
    case goog.net.ErrorCode.TIMEOUT:
      return"Request timed out";
    case goog.net.ErrorCode.OFFLINE:
      return"The resource is not available offline";
    default:
      return"Unrecognized error code"
  }
};
goog.provide("goog.net.HttpStatus");
goog.net.HttpStatus = {CONTINUE:100, SWITCHING_PROTOCOLS:101, OK:200, CREATED:201, ACCEPTED:202, NON_AUTHORITATIVE_INFORMATION:203, NO_CONTENT:204, RESET_CONTENT:205, PARTIAL_CONTENT:206, MULTIPLE_CHOICES:300, MOVED_PERMANENTLY:301, FOUND:302, SEE_OTHER:303, NOT_MODIFIED:304, USE_PROXY:305, TEMPORARY_REDIRECT:307, BAD_REQUEST:400, UNAUTHORIZED:401, PAYMENT_REQUIRED:402, FORBIDDEN:403, NOT_FOUND:404, METHOD_NOT_ALLOWED:405, NOT_ACCEPTABLE:406, PROXY_AUTHENTICATION_REQUIRED:407, REQUEST_TIMEOUT:408, 
CONFLICT:409, GONE:410, LENGTH_REQUIRED:411, PRECONDITION_FAILED:412, REQUEST_ENTITY_TOO_LARGE:413, REQUEST_URI_TOO_LONG:414, UNSUPPORTED_MEDIA_TYPE:415, REQUEST_RANGE_NOT_SATISFIABLE:416, EXPECTATION_FAILED:417, INTERNAL_SERVER_ERROR:500, NOT_IMPLEMENTED:501, BAD_GATEWAY:502, SERVICE_UNAVAILABLE:503, GATEWAY_TIMEOUT:504, HTTP_VERSION_NOT_SUPPORTED:505, QUIRK_IE_NO_CONTENT:1223};
goog.net.HttpStatus.isSuccess = function(status) {
  switch(status) {
    case goog.net.HttpStatus.OK:
    ;
    case goog.net.HttpStatus.CREATED:
    ;
    case goog.net.HttpStatus.ACCEPTED:
    ;
    case goog.net.HttpStatus.NO_CONTENT:
    ;
    case goog.net.HttpStatus.NOT_MODIFIED:
    ;
    case goog.net.HttpStatus.QUIRK_IE_NO_CONTENT:
      return true;
    default:
      return false
  }
};
goog.provide("goog.net.XmlHttpFactory");
goog.net.XmlHttpFactory = function() {
};
goog.net.XmlHttpFactory.prototype.cachedOptions_ = null;
goog.net.XmlHttpFactory.prototype.createInstance = goog.abstractMethod;
goog.net.XmlHttpFactory.prototype.getOptions = function() {
  return this.cachedOptions_ || (this.cachedOptions_ = this.internalGetOptions())
};
goog.net.XmlHttpFactory.prototype.internalGetOptions = goog.abstractMethod;
goog.provide("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.WrapperXmlHttpFactory = function(xhrFactory, optionsFactory) {
  goog.net.XmlHttpFactory.call(this);
  this.xhrFactory_ = xhrFactory;
  this.optionsFactory_ = optionsFactory
};
goog.inherits(goog.net.WrapperXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.WrapperXmlHttpFactory.prototype.createInstance = function() {
  return this.xhrFactory_()
};
goog.net.WrapperXmlHttpFactory.prototype.getOptions = function() {
  return this.optionsFactory_()
};
goog.provide("goog.net.DefaultXmlHttpFactory");
goog.provide("goog.net.XmlHttp");
goog.provide("goog.net.XmlHttp.OptionType");
goog.provide("goog.net.XmlHttp.ReadyState");
goog.require("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.XmlHttp = function() {
  return goog.net.XmlHttp.factory_.createInstance()
};
goog.net.XmlHttp.ASSUME_NATIVE_XHR = false;
goog.net.XmlHttp.getOptions = function() {
  return goog.net.XmlHttp.factory_.getOptions()
};
goog.net.XmlHttp.OptionType = {USE_NULL_FUNCTION:0, LOCAL_REQUEST_ERROR:1};
goog.net.XmlHttp.ReadyState = {UNINITIALIZED:0, LOADING:1, LOADED:2, INTERACTIVE:3, COMPLETE:4};
goog.net.XmlHttp.factory_;
goog.net.XmlHttp.setFactory = function(factory, optionsFactory) {
  goog.net.XmlHttp.setGlobalFactory(new goog.net.WrapperXmlHttpFactory(factory, optionsFactory))
};
goog.net.XmlHttp.setGlobalFactory = function(factory) {
  goog.net.XmlHttp.factory_ = factory
};
goog.net.DefaultXmlHttpFactory = function() {
  goog.net.XmlHttpFactory.call(this)
};
goog.inherits(goog.net.DefaultXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.DefaultXmlHttpFactory.prototype.createInstance = function() {
  var progId = this.getProgId_();
  if(progId) {
    return new ActiveXObject(progId)
  }else {
    return new XMLHttpRequest
  }
};
goog.net.DefaultXmlHttpFactory.prototype.internalGetOptions = function() {
  var progId = this.getProgId_();
  var options = {};
  if(progId) {
    options[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] = true;
    options[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] = true
  }
  return options
};
goog.net.DefaultXmlHttpFactory.prototype.ieProgId_;
goog.net.DefaultXmlHttpFactory.prototype.getProgId_ = function() {
  if(goog.net.XmlHttp.ASSUME_NATIVE_XHR) {
    return""
  }
  if(!this.ieProgId_ && typeof XMLHttpRequest == "undefined" && typeof ActiveXObject != "undefined") {
    var ACTIVE_X_IDENTS = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
    for(var i = 0;i < ACTIVE_X_IDENTS.length;i++) {
      var candidate = ACTIVE_X_IDENTS[i];
      try {
        new ActiveXObject(candidate);
        this.ieProgId_ = candidate;
        return candidate
      }catch(e) {
      }
    }
    throw Error("Could not create ActiveXObject. ActiveX might be disabled," + " or MSXML might not be installed");
  }
  return this.ieProgId_
};
goog.net.XmlHttp.setGlobalFactory(new goog.net.DefaultXmlHttpFactory);
goog.provide("goog.net.EventType");
goog.net.EventType = {COMPLETE:"complete", SUCCESS:"success", ERROR:"error", ABORT:"abort", READY:"ready", READY_STATE_CHANGE:"readystatechange", TIMEOUT:"timeout", INCREMENTAL_DATA:"incrementaldata", PROGRESS:"progress"};
goog.provide("goog.structs.Collection");
goog.structs.Collection = function() {
};
goog.structs.Collection.prototype.add;
goog.structs.Collection.prototype.remove;
goog.structs.Collection.prototype.contains;
goog.structs.Collection.prototype.getCount;
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Collection");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid(val)
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.difference = function(col) {
  var result = this.clone();
  result.removeAll(col);
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
};
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.require("goog.userAgent");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  var retVal = !!opt_cancel;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("535.3")) {
    retVal = !retVal
  }
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return retVal
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.setFunctionResolver = function(resolver) {
  goog.debug.fnNameResolver_ = resolver
};
goog.debug.getFunctionName = function(fn) {
  if(goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn]
  }
  if(goog.debug.fnNameResolver_) {
    var name = goog.debug.fnNameResolver_(fn);
    if(name) {
      goog.debug.fnNameCache_[fn] = name;
      return name
    }
  }
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.debug.fnNameResolver_;
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(buffer[i])
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.logToProfilers = function(msg) {
  if(goog.global["console"]) {
    if(goog.global["console"]["timeStamp"]) {
      goog.global["console"]["timeStamp"](msg)
    }else {
      if(goog.global["console"]["markTimeline"]) {
        goog.global["console"]["markTimeline"](msg)
      }
    }
  }
  if(goog.global["msWriteProfilerMark"]) {
    goog.global["msWriteProfilerMark"](msg)
  }
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("goog.net.XhrIo");
goog.provide("goog.net.XhrIo.ResponseType");
goog.require("goog.Timer");
goog.require("goog.debug.Logger");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.EventTarget");
goog.require("goog.json");
goog.require("goog.net.ErrorCode");
goog.require("goog.net.EventType");
goog.require("goog.net.HttpStatus");
goog.require("goog.net.XmlHttp");
goog.require("goog.object");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.net.XhrIo = function(opt_xmlHttpFactory) {
  goog.events.EventTarget.call(this);
  this.headers = new goog.structs.Map;
  this.xmlHttpFactory_ = opt_xmlHttpFactory || null
};
goog.inherits(goog.net.XhrIo, goog.events.EventTarget);
goog.net.XhrIo.ResponseType = {DEFAULT:"", TEXT:"text", DOCUMENT:"document", BLOB:"blob", ARRAY_BUFFER:"arraybuffer"};
goog.net.XhrIo.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.XhrIo");
goog.net.XhrIo.CONTENT_TYPE_HEADER = "Content-Type";
goog.net.XhrIo.HTTP_SCHEME_PATTERN = /^https?$/i;
goog.net.XhrIo.FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
goog.net.XhrIo.sendInstances_ = [];
goog.net.XhrIo.send = function(url, opt_callback, opt_method, opt_content, opt_headers, opt_timeoutInterval) {
  var x = new goog.net.XhrIo;
  goog.net.XhrIo.sendInstances_.push(x);
  if(opt_callback) {
    goog.events.listen(x, goog.net.EventType.COMPLETE, opt_callback)
  }
  goog.events.listen(x, goog.net.EventType.READY, goog.partial(goog.net.XhrIo.cleanupSend_, x));
  if(opt_timeoutInterval) {
    x.setTimeoutInterval(opt_timeoutInterval)
  }
  x.send(url, opt_method, opt_content, opt_headers)
};
goog.net.XhrIo.cleanup = function() {
  var instances = goog.net.XhrIo.sendInstances_;
  while(instances.length) {
    instances.pop().dispose()
  }
};
goog.net.XhrIo.protectEntryPoints = function(errorHandler) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = errorHandler.protectEntryPoint(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
};
goog.net.XhrIo.cleanupSend_ = function(XhrIo) {
  XhrIo.dispose();
  goog.array.remove(goog.net.XhrIo.sendInstances_, XhrIo)
};
goog.net.XhrIo.prototype.active_ = false;
goog.net.XhrIo.prototype.xhr_ = null;
goog.net.XhrIo.prototype.xhrOptions_ = null;
goog.net.XhrIo.prototype.lastUri_ = "";
goog.net.XhrIo.prototype.lastMethod_ = "";
goog.net.XhrIo.prototype.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
goog.net.XhrIo.prototype.lastError_ = "";
goog.net.XhrIo.prototype.errorDispatched_ = false;
goog.net.XhrIo.prototype.inSend_ = false;
goog.net.XhrIo.prototype.inOpen_ = false;
goog.net.XhrIo.prototype.inAbort_ = false;
goog.net.XhrIo.prototype.timeoutInterval_ = 0;
goog.net.XhrIo.prototype.timeoutId_ = null;
goog.net.XhrIo.prototype.responseType_ = goog.net.XhrIo.ResponseType.DEFAULT;
goog.net.XhrIo.prototype.withCredentials_ = false;
goog.net.XhrIo.prototype.getTimeoutInterval = function() {
  return this.timeoutInterval_
};
goog.net.XhrIo.prototype.setTimeoutInterval = function(ms) {
  this.timeoutInterval_ = Math.max(0, ms)
};
goog.net.XhrIo.prototype.setResponseType = function(type) {
  this.responseType_ = type
};
goog.net.XhrIo.prototype.getResponseType = function() {
  return this.responseType_
};
goog.net.XhrIo.prototype.setWithCredentials = function(withCredentials) {
  this.withCredentials_ = withCredentials
};
goog.net.XhrIo.prototype.getWithCredentials = function() {
  return this.withCredentials_
};
goog.net.XhrIo.prototype.send = function(url, opt_method, opt_content, opt_headers) {
  if(this.xhr_) {
    throw Error("[goog.net.XhrIo] Object is active with another request");
  }
  var method = opt_method ? opt_method.toUpperCase() : "GET";
  this.lastUri_ = url;
  this.lastError_ = "";
  this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
  this.lastMethod_ = method;
  this.errorDispatched_ = false;
  this.active_ = true;
  this.xhr_ = this.createXhr();
  this.xhrOptions_ = this.xmlHttpFactory_ ? this.xmlHttpFactory_.getOptions() : goog.net.XmlHttp.getOptions();
  this.xhr_.onreadystatechange = goog.bind(this.onReadyStateChange_, this);
  try {
    this.logger_.fine(this.formatMsg_("Opening Xhr"));
    this.inOpen_ = true;
    this.xhr_.open(method, url, true);
    this.inOpen_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Error opening Xhr: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
    return
  }
  var content = opt_content || "";
  var headers = this.headers.clone();
  if(opt_headers) {
    goog.structs.forEach(opt_headers, function(value, key) {
      headers.set(key, value)
    })
  }
  if(method == "POST" && !headers.containsKey(goog.net.XhrIo.CONTENT_TYPE_HEADER)) {
    headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER, goog.net.XhrIo.FORM_CONTENT_TYPE)
  }
  goog.structs.forEach(headers, function(value, key) {
    this.xhr_.setRequestHeader(key, value)
  }, this);
  if(this.responseType_) {
    this.xhr_.responseType = this.responseType_
  }
  if(goog.object.containsKey(this.xhr_, "withCredentials")) {
    this.xhr_.withCredentials = this.withCredentials_
  }
  try {
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(this.timeoutInterval_ > 0) {
      this.logger_.fine(this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete"));
      this.timeoutId_ = goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.timeout_, this), this.timeoutInterval_)
    }
    this.logger_.fine(this.formatMsg_("Sending request"));
    this.inSend_ = true;
    this.xhr_.send(content);
    this.inSend_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Send error: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err)
  }
};
goog.net.XhrIo.prototype.createXhr = function() {
  return this.xmlHttpFactory_ ? this.xmlHttpFactory_.createInstance() : goog.net.XmlHttp()
};
goog.net.XhrIo.prototype.timeout_ = function() {
  if(typeof goog == "undefined") {
  }else {
    if(this.xhr_) {
      this.lastError_ = "Timed out after " + this.timeoutInterval_ + "ms, aborting";
      this.lastErrorCode_ = goog.net.ErrorCode.TIMEOUT;
      this.logger_.fine(this.formatMsg_(this.lastError_));
      this.dispatchEvent(goog.net.EventType.TIMEOUT);
      this.abort(goog.net.ErrorCode.TIMEOUT)
    }
  }
};
goog.net.XhrIo.prototype.error_ = function(errorCode, err) {
  this.active_ = false;
  if(this.xhr_) {
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false
  }
  this.lastError_ = err;
  this.lastErrorCode_ = errorCode;
  this.dispatchErrors_();
  this.cleanUpXhr_()
};
goog.net.XhrIo.prototype.dispatchErrors_ = function() {
  if(!this.errorDispatched_) {
    this.errorDispatched_ = true;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ERROR)
  }
};
goog.net.XhrIo.prototype.abort = function(opt_failureCode) {
  if(this.xhr_ && this.active_) {
    this.logger_.fine(this.formatMsg_("Aborting"));
    this.active_ = false;
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false;
    this.lastErrorCode_ = opt_failureCode || goog.net.ErrorCode.ABORT;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ABORT);
    this.cleanUpXhr_()
  }
};
goog.net.XhrIo.prototype.disposeInternal = function() {
  if(this.xhr_) {
    if(this.active_) {
      this.active_ = false;
      this.inAbort_ = true;
      this.xhr_.abort();
      this.inAbort_ = false
    }
    this.cleanUpXhr_(true)
  }
  goog.net.XhrIo.superClass_.disposeInternal.call(this)
};
goog.net.XhrIo.prototype.onReadyStateChange_ = function() {
  if(!this.inOpen_ && !this.inSend_ && !this.inAbort_) {
    this.onReadyStateChangeEntryPoint_()
  }else {
    this.onReadyStateChangeHelper_()
  }
};
goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = function() {
  this.onReadyStateChangeHelper_()
};
goog.net.XhrIo.prototype.onReadyStateChangeHelper_ = function() {
  if(!this.active_) {
    return
  }
  if(typeof goog == "undefined") {
  }else {
    if(this.xhrOptions_[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE && this.getStatus() == 2) {
      this.logger_.fine(this.formatMsg_("Local request error detected and ignored"))
    }else {
      if(this.inSend_ && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE) {
        goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.onReadyStateChange_, this), 0);
        return
      }
      this.dispatchEvent(goog.net.EventType.READY_STATE_CHANGE);
      if(this.isComplete()) {
        this.logger_.fine(this.formatMsg_("Request complete"));
        this.active_ = false;
        try {
          if(this.isSuccess()) {
            this.dispatchEvent(goog.net.EventType.COMPLETE);
            this.dispatchEvent(goog.net.EventType.SUCCESS)
          }else {
            this.lastErrorCode_ = goog.net.ErrorCode.HTTP_ERROR;
            this.lastError_ = this.getStatusText() + " [" + this.getStatus() + "]";
            this.dispatchErrors_()
          }
        }finally {
          this.cleanUpXhr_()
        }
      }
    }
  }
};
goog.net.XhrIo.prototype.cleanUpXhr_ = function(opt_fromDispose) {
  if(this.xhr_) {
    var xhr = this.xhr_;
    var clearedOnReadyStateChange = this.xhrOptions_[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] ? goog.nullFunction : null;
    this.xhr_ = null;
    this.xhrOptions_ = null;
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(!opt_fromDispose) {
      this.dispatchEvent(goog.net.EventType.READY)
    }
    try {
      xhr.onreadystatechange = clearedOnReadyStateChange
    }catch(e) {
      this.logger_.severe("Problem encountered resetting onreadystatechange: " + e.message)
    }
  }
};
goog.net.XhrIo.prototype.isActive = function() {
  return!!this.xhr_
};
goog.net.XhrIo.prototype.isComplete = function() {
  return this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE
};
goog.net.XhrIo.prototype.isSuccess = function() {
  var status = this.getStatus();
  return goog.net.HttpStatus.isSuccess(status) || status === 0 && !this.isLastUriEffectiveSchemeHttp_()
};
goog.net.XhrIo.prototype.isLastUriEffectiveSchemeHttp_ = function() {
  var scheme = goog.uri.utils.getEffectiveScheme(String(this.lastUri_));
  return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(scheme)
};
goog.net.XhrIo.prototype.getReadyState = function() {
  return this.xhr_ ? this.xhr_.readyState : goog.net.XmlHttp.ReadyState.UNINITIALIZED
};
goog.net.XhrIo.prototype.getStatus = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.status : -1
  }catch(e) {
    this.logger_.warning("Can not get status: " + e.message);
    return-1
  }
};
goog.net.XhrIo.prototype.getStatusText = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.statusText : ""
  }catch(e) {
    this.logger_.fine("Can not get status: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getLastUri = function() {
  return String(this.lastUri_)
};
goog.net.XhrIo.prototype.getResponseText = function() {
  try {
    return this.xhr_ ? this.xhr_.responseText : ""
  }catch(e) {
    this.logger_.fine("Can not get responseText: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getResponseXml = function() {
  try {
    return this.xhr_ ? this.xhr_.responseXML : null
  }catch(e) {
    this.logger_.fine("Can not get responseXML: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseJson = function(opt_xssiPrefix) {
  if(!this.xhr_) {
    return undefined
  }
  var responseText = this.xhr_.responseText;
  if(opt_xssiPrefix && responseText.indexOf(opt_xssiPrefix) == 0) {
    responseText = responseText.substring(opt_xssiPrefix.length)
  }
  return goog.json.parse(responseText)
};
goog.net.XhrIo.prototype.getResponse = function() {
  try {
    if(!this.xhr_) {
      return null
    }
    if("response" in this.xhr_) {
      return this.xhr_.response
    }
    switch(this.responseType_) {
      case goog.net.XhrIo.ResponseType.DEFAULT:
      ;
      case goog.net.XhrIo.ResponseType.TEXT:
        return this.xhr_.responseText;
      case goog.net.XhrIo.ResponseType.ARRAY_BUFFER:
        if("mozResponseArrayBuffer" in this.xhr_) {
          return this.xhr_.mozResponseArrayBuffer
        }
    }
    this.logger_.severe("Response type " + this.responseType_ + " is not " + "supported on this browser");
    return null
  }catch(e) {
    this.logger_.fine("Can not get response: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseHeader = function(key) {
  return this.xhr_ && this.isComplete() ? this.xhr_.getResponseHeader(key) : undefined
};
goog.net.XhrIo.prototype.getAllResponseHeaders = function() {
  return this.xhr_ && this.isComplete() ? this.xhr_.getAllResponseHeaders() : ""
};
goog.net.XhrIo.prototype.getLastErrorCode = function() {
  return this.lastErrorCode_
};
goog.net.XhrIo.prototype.getLastError = function() {
  return goog.isString(this.lastError_) ? this.lastError_ : String(this.lastError_)
};
goog.net.XhrIo.prototype.formatMsg_ = function(msg) {
  return msg + " [" + this.lastMethod_ + " " + this.lastUri_ + " " + this.getStatus() + "]"
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = transformer(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
});
goog.provide("fb.simplelogin.transports.XHR");
goog.provide("fb.simplelogin.transports.XHR_");
goog.require("fb.simplelogin.transports.Transport");
goog.require("fb.simplelogin.Vars");
goog.require("fb.simplelogin.util.json");
goog.require("goog.net.XhrIo");
goog.require("goog.events");
goog.require("goog.json");
fb.simplelogin.transports.XHR_ = function() {
  window[CALLBACK_NAMESPACE] = window[CALLBACK_NAMESPACE] || {}
};
fb.simplelogin.transports.XHR_.prototype.open = function(url, options, onComplete) {
  var self = this;
  var request = new goog.net.XhrIo;
  goog.events.listen(request, "complete", function() {
    if(request.isSuccess()) {
      var data = request.getResponseJson();
      var error = data["error"] || null;
      delete data["error"];
      onComplete && onComplete(error, data)
    }else {
      onComplete && onComplete(self.formatError_({code:"SERVER_ERROR", message:"An unknown server error occurred."}))
    }
  });
  url += "?";
  for(var key in options) {
    url += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(options[key])
  }
  request.send(url, "GET", null, {"content-type":"application/json"})
};
fb.simplelogin.transports.XHR_.prototype.isAvailable = function() {
  return window["XMLHttpRequest"] && typeof window["XMLHttpRequest"] === "function"
};
fb.simplelogin.transports.XHR_.prototype.formatError_ = function(error) {
  var errorObj = new Error(error.message || "");
  errorObj.code = error.code || "UNKNOWN_ERROR";
  return errorObj
};
fb.simplelogin.transports.XHR = new fb.simplelogin.transports.XHR_;
goog.provide("fb.simplelogin.util.validation");
var VALID_EMAIL_REGEX_ = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,6})+$/;
fb.simplelogin.util.validation.validateArgCount = function(fnName, minCount, maxCount, argCount) {
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
fb.simplelogin.util.validation.isValidEmail = function(email) {
  return goog.isString(email) && VALID_EMAIL_REGEX_.test(email)
};
fb.simplelogin.util.validation.isValidPassword = function(password) {
  return goog.isString(password)
};
fb.simplelogin.util.validation.isValidNamespace = function(namespace) {
  return goog.isString(namespace)
};
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
      fb.core.util.validation.assert(false, "errorPrefix_ called with argumentNumber > 4.  Need to update it?")
  }
  var error = fnName + " failed: ";
  error += argName + " argument ";
  return error
};
fb.simplelogin.util.validation.validateNamespace = function(fnName, argumentNumber, namespace, optional) {
  if(optional && !goog.isDef(namespace)) {
    return
  }
  if(!goog.isString(namespace)) {
    throw new Error(fb.simplelogin.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid firebase namespace.");
  }
};
fb.simplelogin.util.validation.validateCallback = function(fnName, argumentNumber, callback, optional) {
  if(optional && !goog.isDef(callback)) {
    return
  }
  if(!goog.isFunction(callback)) {
    throw new Error(fb.simplelogin.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid function.");
  }
};
fb.simplelogin.util.validation.validateString = function(fnName, argumentNumber, string, optional) {
  if(optional && !goog.isDef(string)) {
    return
  }
  if(!goog.isString(string)) {
    throw new Error(fb.simplelogin.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid string.");
  }
};
fb.simplelogin.util.validation.validateContextObject = function(fnName, argumentNumber, context, optional) {
  if(optional && !goog.isDef(context)) {
    return
  }
  if(!goog.isObject(context) || context === null) {
    throw new Error(fb.simplelogin.util.validation.errorPrefix_(fnName, argumentNumber, optional) + "must be a valid context object.");
  }
};
goog.provide("fb.simplelogin.transports.JSONP");
goog.provide("fb.simplelogin.transports.JSONP_");
goog.require("fb.simplelogin.transports.Transport");
goog.require("fb.simplelogin.Vars");
goog.require("fb.simplelogin.util.json");
var CALLBACK_NAMESPACE = "_FirebaseSimpleLoginJSONP";
fb.simplelogin.transports.JSONP_ = function() {
  window[CALLBACK_NAMESPACE] = window[CALLBACK_NAMESPACE] || {}
};
fb.simplelogin.transports.JSONP_.prototype.open = function(url, options, onComplete) {
  url += /\?/.test(url) ? "" : "?";
  url += "&transport=jsonp";
  for(var param in options) {
    url += "&" + encodeURIComponent(param) + "=" + encodeURIComponent(options[param])
  }
  var callbackId = this.generateRequestId_();
  url += "&callback=" + encodeURIComponent(CALLBACK_NAMESPACE + "." + callbackId);
  this.registerCallback_(callbackId, onComplete);
  this.writeScriptTag_(callbackId, url, onComplete)
};
fb.simplelogin.transports.JSONP_.prototype.generateRequestId_ = function() {
  return"_FirebaseJSONP" + (new Date).getTime() + Math.floor(Math.random() * 100)
};
fb.simplelogin.transports.JSONP_.prototype.registerCallback_ = function(id, callback) {
  var self = this;
  window[CALLBACK_NAMESPACE][id] = function(result) {
    var error = result["error"] || null;
    delete result["error"];
    callback(error, result);
    self.removeCallback_(id)
  }
};
fb.simplelogin.transports.JSONP_.prototype.removeCallback_ = function(id) {
  setTimeout(function() {
    delete window[CALLBACK_NAMESPACE][id];
    var el = document.getElementById(id);
    if(el) {
      el.parentNode.removeChild(el)
    }
  }, 0)
};
fb.simplelogin.transports.JSONP_.prototype.writeScriptTag_ = function(id, url, cb) {
  var self = this;
  setTimeout(function() {
    try {
      var js = document.createElement("script");
      js.type = "text/javascript";
      js.id = id;
      js.async = true;
      js.src = url;
      js.onerror = function() {
        var el = document.getElementById(id);
        if(el !== null) {
          el.parentNode.removeChild(el)
        }
        cb && cb(self.formatError_({code:"SERVER_ERROR", message:"An unknown server error occurred."}))
      };
      var ref = document.getElementsByTagName("script")[0];
      ref.parentNode.insertBefore(js, ref)
    }catch(e) {
      cb && cb(self.formatError_({code:"SERVER_ERROR", message:"An unknown server error occurred."}))
    }
  }, 0)
};
fb.simplelogin.transports.JSONP_.prototype.formatError_ = function(error) {
  var errorObj = new Error(error.message || "");
  errorObj.code = error.code || "UNKNOWN_ERROR";
  return errorObj
};
fb.simplelogin.transports.JSONP = new fb.simplelogin.transports.JSONP_;
goog.provide("fb.simplelogin.providers.Password");
goog.provide("fb.simplelogin.providers.Password_");
goog.require("fb.simplelogin.Vars");
goog.require("fb.simplelogin.util.validation");
goog.require("fb.simplelogin.Errors");
goog.require("fb.simplelogin.transports.JSONP");
goog.require("fb.simplelogin.transports.XHR");
fb.simplelogin.providers.Password_ = function() {
};
fb.simplelogin.providers.Password_.prototype.getTransport_ = function() {
  if(fb.simplelogin.transports.XHR.isAvailable()) {
    return fb.simplelogin.transports.XHR
  }else {
    return fb.simplelogin.transports.JSONP
  }
};
fb.simplelogin.providers.Password_.prototype.login = function(data, onComplete) {
  var url = fb.simplelogin.Vars.getApiHost() + "/auth/firebase";
  if(!fb.simplelogin.util.validation.isValidNamespace(data["firebase"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_FIREBASE"))
  }
  this.getTransport_().open(url, data, onComplete)
};
fb.simplelogin.providers.Password_.prototype.createUser = function(data, onComplete) {
  var url = fb.simplelogin.Vars.getApiHost() + "/auth/firebase/create";
  if(!fb.simplelogin.util.validation.isValidNamespace(data["firebase"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_FIREBASE"))
  }
  if(!fb.simplelogin.util.validation.isValidEmail(data["email"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_EMAIL"))
  }
  if(!fb.simplelogin.util.validation.isValidPassword(data["password"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_PASSWORD"))
  }
  this.getTransport_().open(url, data, onComplete)
};
fb.simplelogin.providers.Password_.prototype.changePassword = function(data, onComplete) {
  var url = fb.simplelogin.Vars.getApiHost() + "/auth/firebase/update";
  if(!fb.simplelogin.util.validation.isValidNamespace(data["firebase"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_FIREBASE"))
  }
  if(!fb.simplelogin.util.validation.isValidEmail(data["email"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_EMAIL"))
  }
  if(!fb.simplelogin.util.validation.isValidPassword(data["newPassword"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_PASSWORD"))
  }
  this.getTransport_().open(url, data, onComplete)
};
fb.simplelogin.providers.Password_.prototype.removeUser = function(data, onComplete) {
  var url = fb.simplelogin.Vars.getApiHost() + "/auth/firebase/remove";
  if(!fb.simplelogin.util.validation.isValidNamespace(data["firebase"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_FIREBASE"))
  }
  if(!fb.simplelogin.util.validation.isValidEmail(data["email"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_EMAIL"))
  }
  if(!fb.simplelogin.util.validation.isValidPassword(data["password"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_PASSWORD"))
  }
  this.getTransport_().open(url, data, onComplete)
};
fb.simplelogin.providers.Password_.prototype.sendPasswordResetEmail = function(data, onComplete) {
  var url = fb.simplelogin.Vars.getApiHost() + "/auth/firebase/reset_password";
  if(!fb.simplelogin.util.validation.isValidNamespace(data["firebase"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_FIREBASE"))
  }
  if(!fb.simplelogin.util.validation.isValidEmail(data["email"])) {
    return onComplete && onComplete(fb.simplelogin.Errors.get("INVALID_EMAIL"))
  }
  this.getTransport_().open(url, data, onComplete)
};
fb.simplelogin.providers.Password = new fb.simplelogin.providers.Password_;
goog.provide("fb.simplelogin.transports.WindowsMetroAuthBroker");
goog.provide("fb.simplelogin.transports.WindowsMetroAuthBroker_");
goog.require("fb.simplelogin.transports.Popup");
goog.require("fb.simplelogin.Vars");
goog.require("fb.simplelogin.util.json");
goog.require("fb.simplelogin.util.misc");
fb.simplelogin.transports.WindowsMetroAuthBroker_ = function() {
};
fb.simplelogin.transports.WindowsMetroAuthBroker_.prototype.open = function(url, options, onComplete) {
  var Uri, WebAuthenticationOptions, WebAuthenticationBroker, authenticateAsync, callbackInvoked, callbackHandler;
  try {
    Uri = window["Windows"]["Foundation"]["Uri"];
    WebAuthenticationOptions = window["Windows"]["Security"]["Authentication"]["Web"]["WebAuthenticationOptions"];
    WebAuthenticationBroker = window["Windows"]["Security"]["Authentication"]["Web"]["WebAuthenticationBroker"];
    authenticateAsync = WebAuthenticationBroker["authenticateAsync"]
  }catch(err) {
    return onComplete({code:"WINDOWS_METRO", message:'"Windows.Security.Authentication.Web.WebAuthenticationBroker" required when using Firebase Simple Login in Windows Metro context'})
  }
  callbackInvoked = false;
  var callbackHandler = function() {
    var args = Array.prototype.slice.apply(arguments);
    if(!callbackInvoked) {
      callbackInvoked = true;
      onComplete.apply(null, args)
    }
  };
  var startUri = new Uri(url + "&transport=internal-redirect-hash");
  var endUri = new Uri(fb.simplelogin.Vars.getApiHost() + "/blank/page.html");
  authenticateAsync(WebAuthenticationOptions["none"], startUri, endUri).done(function(data) {
    var result;
    if(data && data["responseData"]) {
      try {
        var urlObj = fb.simplelogin.util.misc.parseUrl(data["responseData"]);
        var urlHashEncoded = fb.simplelogin.util.misc.parseQuerystring(decodeURIComponent(urlObj["hash"]));
        var temporaryResult = {};
        for(var key in urlHashEncoded) {
          temporaryResult[key] = fb.simplelogin.util.json.eval(urlHashEncoded[key])
        }
        result = temporaryResult
      }catch(e) {
      }
    }
    if(result && result["token"] && result["user"]) {
      callbackHandler(null, result)
    }else {
      if(result && result["error"]) {
        callbackHandler(result["error"])
      }else {
        callbackHandler({code:"UNKNOWN_ERROR", message:"An unknown error occurred."})
      }
    }
  }, function(err) {
    callbackHandler({code:"UNKNOWN_ERROR", message:"An unknown error occurred."})
  })
};
fb.simplelogin.transports.WindowsMetroAuthBroker = new fb.simplelogin.transports.WindowsMetroAuthBroker_;
goog.provide("fb.simplelogin.providers.Persona");
goog.provide("fb.simplelogin.providers.Persona_");
goog.require("fb.simplelogin.util.validation");
fb.simplelogin.providers.Persona_ = function() {
};
fb.simplelogin.providers.Persona_.prototype.login = function(data, onComplete) {
  navigator["id"]["watch"]({"onlogin":function(assertion) {
    onComplete(assertion)
  }, "onlogout":function() {
  }});
  navigator["id"]["request"]({"oncancel":function() {
    onComplete(null)
  }})
};
fb.simplelogin.providers.Persona = new fb.simplelogin.providers.Persona_;
goog.provide("goog.net.Cookies");
goog.provide("goog.net.cookies");
goog.require("goog.userAgent");
goog.net.Cookies = function(context) {
  this.document_ = context
};
goog.net.Cookies.MAX_COOKIE_LENGTH = 3950;
goog.net.Cookies.SPLIT_RE_ = /\s*;\s*/;
goog.net.Cookies.prototype.isEnabled = function() {
  return navigator.cookieEnabled
};
goog.net.Cookies.prototype.isValidName = function(name) {
  return!/[;=\s]/.test(name)
};
goog.net.Cookies.prototype.isValidValue = function(value) {
  return!/[;\r\n]/.test(value)
};
goog.net.Cookies.prototype.set = function(name, value, opt_maxAge, opt_path, opt_domain, opt_secure) {
  if(!this.isValidName(name)) {
    throw Error('Invalid cookie name "' + name + '"');
  }
  if(!this.isValidValue(value)) {
    throw Error('Invalid cookie value "' + value + '"');
  }
  if(!goog.isDef(opt_maxAge)) {
    opt_maxAge = -1
  }
  var domainStr = opt_domain ? ";domain=" + opt_domain : "";
  var pathStr = opt_path ? ";path=" + opt_path : "";
  var secureStr = opt_secure ? ";secure" : "";
  var expiresStr;
  if(opt_maxAge < 0) {
    expiresStr = ""
  }else {
    if(opt_maxAge == 0) {
      var pastDate = new Date(1970, 1, 1);
      expiresStr = ";expires=" + pastDate.toUTCString()
    }else {
      var futureDate = new Date(goog.now() + opt_maxAge * 1E3);
      expiresStr = ";expires=" + futureDate.toUTCString()
    }
  }
  this.setCookie_(name + "=" + value + domainStr + pathStr + expiresStr + secureStr)
};
goog.net.Cookies.prototype.get = function(name, opt_default) {
  var nameEq = name + "=";
  var parts = this.getParts_();
  for(var i = 0, part;part = parts[i];i++) {
    if(part.indexOf(nameEq) == 0) {
      return part.substr(nameEq.length)
    }
    if(part == name) {
      return""
    }
  }
  return opt_default
};
goog.net.Cookies.prototype.remove = function(name, opt_path, opt_domain) {
  var rv = this.containsKey(name);
  this.set(name, "", 0, opt_path, opt_domain);
  return rv
};
goog.net.Cookies.prototype.getKeys = function() {
  return this.getKeyValues_().keys
};
goog.net.Cookies.prototype.getValues = function() {
  return this.getKeyValues_().values
};
goog.net.Cookies.prototype.isEmpty = function() {
  return!this.getCookie_()
};
goog.net.Cookies.prototype.getCount = function() {
  var cookie = this.getCookie_();
  if(!cookie) {
    return 0
  }
  return this.getParts_().length
};
goog.net.Cookies.prototype.containsKey = function(key) {
  return goog.isDef(this.get(key))
};
goog.net.Cookies.prototype.containsValue = function(value) {
  var values = this.getKeyValues_().values;
  for(var i = 0;i < values.length;i++) {
    if(values[i] == value) {
      return true
    }
  }
  return false
};
goog.net.Cookies.prototype.clear = function() {
  var keys = this.getKeyValues_().keys;
  for(var i = keys.length - 1;i >= 0;i--) {
    this.remove(keys[i])
  }
};
goog.net.Cookies.prototype.setCookie_ = function(s) {
  this.document_.cookie = s
};
goog.net.Cookies.prototype.getCookie_ = function() {
  return this.document_.cookie
};
goog.net.Cookies.prototype.getParts_ = function() {
  return(this.getCookie_() || "").split(goog.net.Cookies.SPLIT_RE_)
};
goog.net.Cookies.prototype.getKeyValues_ = function() {
  var parts = this.getParts_();
  var keys = [], values = [], index, part;
  for(var i = 0;part = parts[i];i++) {
    index = part.indexOf("=");
    if(index == -1) {
      keys.push("");
      values.push(part)
    }else {
      keys.push(part.substring(0, index));
      values.push(part.substring(index + 1))
    }
  }
  return{keys:keys, values:values}
};
goog.net.cookies = new goog.net.Cookies(document);
goog.net.cookies.MAX_COOKIE_LENGTH = goog.net.Cookies.MAX_COOKIE_LENGTH;
goog.provide("fb.simplelogin.SessionStore");
goog.provide("fb.simplelogin.SessionStore_");
goog.require("fb.simplelogin.util.env");
goog.require("goog.net.cookies");
var cookieStoragePath = "/";
var encryptionStorageKey = "firebaseSessionKey";
var sessionPersistentStorageKey = "firebaseSession";
var hasLocalStorage = fb.simplelogin.util.env.hasLocalStorage();
fb.simplelogin.SessionStore_ = function() {
};
fb.simplelogin.SessionStore_.prototype.set = function(session, opt_sessionLengthDays) {
  if(!hasLocalStorage) {
    return
  }
  try {
    var sessionEncryptionKey = session["sessionKey"];
    var payload = sjcl.encrypt(sessionEncryptionKey, fb.simplelogin.util.json.stringify(session));
    localStorage.setItem(sessionPersistentStorageKey, fb.simplelogin.util.json.stringify(payload));
    var maxAgeSeconds = opt_sessionLengthDays ? opt_sessionLengthDays * 86400 : -1;
    goog.net.cookies.set(encryptionStorageKey, sessionEncryptionKey, maxAgeSeconds, cookieStoragePath, null, false)
  }catch(e) {
  }
};
fb.simplelogin.SessionStore_.prototype.get = function() {
  if(!hasLocalStorage) {
    return
  }
  try {
    var sessionEncryptionKey = goog.net.cookies.get(encryptionStorageKey);
    var payload = localStorage.getItem(sessionPersistentStorageKey);
    if(sessionEncryptionKey && payload) {
      var session = fb.simplelogin.util.json.eval(sjcl.decrypt(sessionEncryptionKey, fb.simplelogin.util.json.eval(payload)));
      return session
    }
  }catch(e) {
  }
  return null
};
fb.simplelogin.SessionStore_.prototype.clear = function() {
  if(!hasLocalStorage) {
    return
  }
  localStorage.removeItem(sessionPersistentStorageKey);
  goog.net.cookies.remove(encryptionStorageKey, cookieStoragePath, null)
};
fb.simplelogin.SessionStore = new fb.simplelogin.SessionStore_;
goog.provide("FirebaseSimpleLogin");
goog.require("fb.simplelogin.util.env");
goog.require("fb.simplelogin.util.json");
goog.require("fb.simplelogin.util.validation");
goog.require("fb.simplelogin.util.sjcl");
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
FirebaseSimpleLogin = function(ref, callback, context) {
  var self = this, dataURL = ref.toString(), namespace = null;
  var globalNamespace = "_FirebaseSimpleLogin";
  window[globalNamespace] = window[globalNamespace] || {};
  window[globalNamespace]["callbacks"] = window[globalNamespace]["callbacks"] || [];
  window[globalNamespace]["callbacks"].push({"cb":callback, "ctx":context});
  fb.simplelogin.util.validation.validateArgCount("new FirebaseSimpleLogin", 1, 3, arguments.length);
  fb.simplelogin.util.validation.validateCallback("new FirebaseSimpleLogin", 2, callback, false);
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
  if(window.location.protocol === "file:" && !fb.simplelogin.util.env.isMobileCordovaInAppBrowser() && console && console.log) {
    var message = "FirebaseSimpleLogin(): Due to browser security restrictions, " + "loading applications via `file://*` URLs will prevent popup-based authentication " + "providers from working properly. When testing locally, you'll need to run a " + "barebones webserver on your machine rather than loading your test files via " + "`file://*`. The easiest way to run a barebones server on your local machine is to " + "`cd` to the root directory of your code and run `python -m SimpleHTTPServer`, " + 
    "which will allow you to access your content via `http://127.0.0.1:8000/*`.";
    console.log(message)
  }
  this.mRef = ref;
  this.mNamespace = namespace;
  this.sessionLengthDays = null;
  this.mLoginStateChange = function() {
    var callbacks = window[globalNamespace]["callbacks"] || [];
    var args = Array.prototype.slice.apply(arguments);
    for(var ix = 0;ix < callbacks.length;ix++) {
      var cb = callbacks[ix];
      var invokeCallback = !!args[0] || typeof cb.user === "undefined";
      if(!invokeCallback) {
        var oldAuthToken, newAuthToken;
        if(cb.user && cb.user.firebaseAuthToken) {
          oldAuthToken = cb.user.firebaseAuthToken
        }
        if(args[1] && args[1].firebaseAuthToken) {
          newAuthToken = args[1].firebaseAuthToken
        }
        invokeCallback = (oldAuthToken || newAuthToken) && oldAuthToken !== newAuthToken
      }
      window[globalNamespace]["callbacks"][ix]["user"] = args[1] || null;
      if(invokeCallback) {
        (function(cb, ctx) {
          if(typeof cb === "function") {
            setTimeout(function() {
              cb.apply(ctx, args)
            }, 0)
          }
        })(cb.cb, cb.ctx)
      }
    }
  };
  this.resumeSession()
};
FirebaseSimpleLogin.prototype.setApiHost = function(apiHost) {
  fb.simplelogin.Vars.setApiHost(apiHost)
};
FirebaseSimpleLogin.prototype.resumeSession = function() {
  var session = fb.simplelogin.SessionStore.get();
  if(session && session.token && session.user) {
    this.attemptAuth(session.token, session.user, false)
  }else {
    this.mLoginStateChange(null, null)
  }
};
FirebaseSimpleLogin.prototype.attemptAuth = function(token, user, saveSession) {
  var self = this;
  this.mRef["auth"](token, function(error, dummy) {
    if(!error) {
      if(saveSession) {
        fb.simplelogin.SessionStore.set({token:token, user:user, sessionKey:user["sessionKey"]}, self.sessionLengthDays)
      }
      if(typeof dummy == "function") {
        dummy()
      }
      delete user["sessionKey"];
      user["firebaseAuthToken"] = token;
      self.mLoginStateChange(null, user)
    }else {
      fb.simplelogin.SessionStore.clear();
      self.mLoginStateChange(null, null)
    }
  }, function(error) {
    fb.simplelogin.SessionStore.clear();
    self.mLoginStateChange(null, null)
  })
};
FirebaseSimpleLogin.prototype.login = function() {
  fb.simplelogin.util.validation.validateString(methodId, 1, arguments[0], false);
  var self = this, options = arguments[1] || {}, provider = arguments[0].toLowerCase(), methodId = "FirebaseSimpleLogin.login(" + provider + ")";
  if(provider === "password") {
    if(!fb.simplelogin.util.validation.isValidEmail(options.email)) {
      return this.mLoginStateChange(fb.simplelogin.Errors.get("INVALID_EMAIL"))
    }
    if(!fb.simplelogin.util.validation.isValidPassword(options.password)) {
      return this.mLoginStateChange(fb.simplelogin.Errors.get("INVALID_PASSWORD"))
    }
  }else {
    if(provider === "facebook" || provider === "github" || provider === "persona" || provider === "twitter" || provider === "anonymous") {
      fb.simplelogin.util.validation.validateArgCount(methodId, 1, 2, arguments.length)
    }
  }
  this.sessionLengthDays = options.rememberMe ? 30 : null;
  switch(provider) {
    case "anonymous":
      return this.loginAnonymously(options);
    case "facebook-token":
      return this.loginWithFacebookToken(options);
    case "github":
      return this.loginWithGithub(options);
    case "password":
      return this.loginWithPassword(options);
    case "persona":
      return this.loginWithPersona(options);
    case "twitter-token":
      return this.loginWithTwitterToken(options);
    case "facebook":
      if(options["access_token"]) {
        return this.loginWithFacebookToken(options)
      }else {
        return this.loginWithFacebook(options)
      }
    ;
    case "twitter":
      if(options["oauth_token"] && options["oauth_token_secret"]) {
        return this.loginWithTwitterToken(options)
      }else {
        return this.loginWithTwitter(options)
      }
    ;
    default:
      throw new Error("FirebaseSimpleLogin.login() failed: unrecognized authentication provider");
  }
};
FirebaseSimpleLogin.prototype.loginAnonymously = function(options) {
  var self = this;
  var provider = "anonymous";
  options.firebase = this.mNamespace;
  fb.simplelogin.transports.JSONP.open(fb.simplelogin.Vars.getApiHost() + "/auth/anonymous", options, function(error, response) {
    if(error || !response["token"]) {
      self.mLoginStateChange(fb.simplelogin.Errors.format(error), null)
    }else {
      var token = response["token"];
      var user = response["user"];
      self.attemptAuth(token, user, true)
    }
  })
};
FirebaseSimpleLogin.prototype.loginWithPassword = function(options) {
  var self = this;
  options.firebase = this.mNamespace;
  fb.simplelogin.providers.Password.login(options, function(error, response) {
    if(error || !response["token"]) {
      self.mLoginStateChange(fb.simplelogin.Errors.format(error))
    }else {
      var token = response["token"];
      var user = response["user"];
      self.attemptAuth(token, user, true)
    }
  })
};
FirebaseSimpleLogin.prototype.loginWithGithub = function(options) {
  options["height"] = 850;
  options["width"] = 950;
  this.loginViaOAuth("github", options)
};
FirebaseSimpleLogin.prototype.loginWithFacebook = function(options) {
  this.loginViaOAuth("facebook", options)
};
FirebaseSimpleLogin.prototype.loginWithTwitter = function(options) {
  this.loginViaOAuth("twitter", options)
};
FirebaseSimpleLogin.prototype.loginWithFacebookToken = function(options) {
  this.loginViaToken("facebook", options)
};
FirebaseSimpleLogin.prototype.loginWithTwitterToken = function(options) {
  this.loginViaToken("twitter", options)
};
FirebaseSimpleLogin.prototype.loginWithPersona = function(options) {
  var provider = "persona";
  var self = this;
  if(!navigator["id"]) {
    throw new Error("FirebaseSimpleLogin.login(persona): Unable to find Persona include.js");
  }
  fb.simplelogin.providers.Persona.login({}, function(assertion) {
    if(assertion === null) {
      callback(fb.simplelogin.Errors.get("UNKNOWN_ERROR"))
    }else {
      fb.simplelogin.transports.JSONP.open(fb.simplelogin.Vars.getApiHost() + "/auth/persona/token", {"firebase":self.mNamespace, "assertion":assertion}, function(err, res) {
        if(err || !res["token"] || !res["user"]) {
          self.mLoginStateChange(fb.simplelogin.Errors.format(err), null)
        }else {
          var token = res["token"];
          var user = res["user"];
          self.attemptAuth(token, user, true)
        }
      })
    }
  })
};
FirebaseSimpleLogin.prototype.logout = function() {
  var methodId = "FirebaseSimpleLogin.logout";
  fb.simplelogin.util.validation.validateArgCount(methodId, 0, 0, arguments.length);
  fb.simplelogin.SessionStore.clear();
  this.mRef["unauth"]();
  this.mLoginStateChange(null, null)
};
FirebaseSimpleLogin.prototype.loginViaToken = function(provider, options, cb) {
  options = options || {};
  var self = this, url = fb.simplelogin.Vars.getApiHost() + "/auth/" + provider + "/token?firebase=" + self.mNamespace;
  fb.simplelogin.transports.JSONP.open(url, options, function(err, res) {
    if(err || !res["token"] || !res["user"]) {
      self.mLoginStateChange(fb.simplelogin.Errors.format(err), null)
    }else {
      var token = res["token"];
      var user = res["user"];
      self.attemptAuth(token, user, true)
    }
  })
};
FirebaseSimpleLogin.prototype.loginViaOAuth = function(provider, options, cb) {
  options = options || {};
  var self = this;
  var url = fb.simplelogin.Vars.getApiHost() + "/auth/" + provider + "?firebase=" + this.mNamespace;
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
  var environment = function() {
    if(fb.simplelogin.util.env.isMobileCordovaInAppBrowser()) {
      return"mobile-phonegap"
    }else {
      if(fb.simplelogin.util.env.isMobileTriggerIoTab()) {
        return"mobile-triggerio"
      }else {
        if(fb.simplelogin.util.env.isWindowsMetro()) {
          return"windows-metro"
        }else {
          return"desktop"
        }
      }
    }
  }();
  var transport;
  if(environment === "desktop") {
    transport = "WinChan";
    var window_features_arr = [];
    for(var key in window_features) {
      window_features_arr.push(key + "=" + window_features[key])
    }
    options.url += "&transport=winchan", options.relay_url = fb.simplelogin.Vars.getApiHost() + "/auth/channel", options.window_features = window_features_arr.join(",")
  }else {
    if(environment === "mobile-phonegap") {
      transport = "CordovaInAppBrowser"
    }else {
      if(environment === "mobile-triggerio") {
        transport = "TriggerIoTab"
      }else {
        if(environment === "windows-metro") {
          transport = "WindowsMetroAuthBroker"
        }
      }
    }
  }
  fb.simplelogin.transports[transport].open(url, options, function(error, res) {
    if(res && res.token && res.user) {
      self.attemptAuth(res.token, res.user, true)
    }else {
      var errObj = error || {code:"UNKNOWN_ERROR", message:"An unknown error occurred."};
      if(error === "unknown closed window") {
        errObj = {code:"USER_DENIED", message:"User cancelled the authentication request."}
      }else {
        if(res && res.error) {
          errObj = res.error
        }
      }
      self.mLoginStateChange(fb.simplelogin.Errors.format(errObj), null)
    }
  })
};
FirebaseSimpleLogin.prototype.manageFirebaseUsers = function(method, data, cb) {
  data["firebase"] = this.mNamespace;
  fb.simplelogin.providers.Password[method](data, function(error, user) {
    if(error) {
      return cb && cb(fb.simplelogin.Errors.format(error), null)
    }else {
      return cb && cb(null, user)
    }
  })
};
FirebaseSimpleLogin.prototype.createUser = function(email, password, cb) {
  var method = "FirebaseSimpleLogin.createUser";
  fb.simplelogin.util.validation.validateArgCount(method, 3, 3, arguments.length);
  fb.simplelogin.util.validation.validateCallback(method, 3, cb, false);
  this.manageFirebaseUsers("createUser", {"email":email, "password":password}, cb)
};
FirebaseSimpleLogin.prototype.changePassword = function(email, oldPassword, newPassword, cb) {
  var method = "FirebaseSimpleLogin.changePassword";
  fb.simplelogin.util.validation.validateArgCount(method, 4, 4, arguments.length);
  fb.simplelogin.util.validation.validateCallback(method, 4, cb, false);
  this.manageFirebaseUsers("changePassword", {"email":email, "oldPassword":oldPassword, "newPassword":newPassword}, function(error, user) {
    return cb && cb(error, !!user)
  })
};
FirebaseSimpleLogin.prototype.removeUser = function(email, password, cb) {
  var method = "FirebaseSimpleLogin.removeUser";
  fb.simplelogin.util.validation.validateArgCount(method, 3, 3, arguments.length);
  fb.simplelogin.util.validation.validateCallback(method, 3, cb, false);
  this.manageFirebaseUsers("removeUser", {"email":email, "password":password}, function(error, user) {
    return cb && cb(error, !!user)
  })
};
FirebaseSimpleLogin.prototype.sendPasswordResetEmail = function(email, cb) {
  var method = "FirebaseSimpleLogin.sendPasswordResetEmail";
  fb.simplelogin.util.validation.validateArgCount(method, 2, 2, arguments.length);
  fb.simplelogin.util.validation.validateCallback(method, 2, cb, false);
  this.manageFirebaseUsers("sendPasswordResetEmail", {"email":email}, function(error, user) {
    return cb && cb(error, !!user)
  })
};
FirebaseSimpleLogin.onOpen = function(cb) {
  fb.simplelogin.transports.WinChan.onOpen(cb)
};

