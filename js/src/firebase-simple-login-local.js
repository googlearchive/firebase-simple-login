/**
 * @fileoverview Bootstrapper for local development.
 *
 * This script can be used during development instead of the compiled firebase-simple-login.js.
 * It pulls in the raw source files, so no compilation step is required (though if you
 * change any dependencies, e.g. by adding goog.require statements, you'll need to
 * run compile-js.sh to rebuild deps.js)
 *
 * This script pulls in google closure's base.js and our dependencies file
 * automatically. All other required scripts will be pulled in based on goog.require
 * statements.
 */

// Figure out the base path of firebase-simple-login-local.js.
var basePath = null;
var scripts = document.getElementsByTagName('script');
for (var i = scripts.length - 1; i >= 0; i--) {
  var src = scripts[i].src;
  var l = src.indexOf('firebase-simple-login-local.js');
  if (l != -1) {
    basePath = src.substr(0, l);
    break;
  }
}

if (basePath === null)
  throw "Couldn't determine location of firebase-simple-login-local.js.  WHAT DID YOU DO!?!?!";

document.write('<script type="text/javascript" src="' + basePath + '../../lib/closure/library/closure/goog/base.js"></script>');
document.write('<script type="text/javascript" src="' + basePath + '../deps.js"></script>');
document.write('<script type="text/javascript" src="' + basePath + 'firebase-simple-login-require.js"></script>');
