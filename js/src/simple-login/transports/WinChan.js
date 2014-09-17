goog.provide("fb.simplelogin.transports.WinChan");
goog.require('fb.simplelogin.transports.Transport');
goog.require('fb.simplelogin.Vars');
goog.require('fb.simplelogin.util.json');

/**
 * A fork of WinChan, modified for use with the Closure compiler.
 * Site: https://github.com/mozilla/winchan
 * License: MIT
 */

var RELAY_FRAME_NAME = "__winchan_relay_frame";
var CLOSE_CMD = "die";

function addListener(w, event, cb) {
  if (w['attachEvent']) w['attachEvent']('on' + event, cb);
  else if (w['addEventListener']) w['addEventListener'](event, cb, false);
}

function removeListener(w, event, cb) {
  if (w['detachEvent']) w['detachEvent']('on' + event, cb);
  else if (w['removeEventListener']) w['removeEventListener'](event, cb, false);
}

function extractOrigin(url) {
  if (!/^https?:\/\//.test(url)) url = window.location.href;
  var m = /^(https?:\/\/[\-_a-zA-Z\.0-9:]+)/.exec(url);
  if (m) return m[1];
  return url;
}

// find the relay iframe in the opener
function findRelay() {
  var loc = window.location;
  var frames = window.opener.frames;
  var origin = loc.protocol + '//' + loc.host;
  for (var i = frames.length - 1; i >= 0; i--) {
    try {
      if (frames[i].location.href.indexOf(origin) === 0 &&
          frames[i].name === RELAY_FRAME_NAME)
      {
        return frames[i];
      }
    } catch(e) { }
  }
  return;
}

// checking for IE8 or above
var isInternetExplorer = (function() {
  var re, match, rv = -1; // Return value assumes failure.
  var ua = navigator['userAgent'];
  if (navigator['appName'] === 'Microsoft Internet Explorer') {
    re = /MSIE ([0-9]{1,}[\.0-9]{0,})/;
    match = ua.match(re);
    if (match && match.length > 1) {
      rv = parseFloat(match[1]);
    }
  } else if (ua.indexOf('Trident') > -1) { // IE > 11
    re = /rv:([0-9]{2,2}[\.0-9]{0,})/;
    match = ua.match(re);
    if (match && match.length > 1) {
      rv = parseFloat(match[1]);
    }
  }
  return rv >= 8;
})();

/**
 * @constructor
 * @implements {fb.simplelogin.Popup}
 */
fb.simplelogin.transports.WinChan_ = function() {};

/**
 * Opens a new tab overlay using WinChan.
 *
 * @export
 * @param {String} url Popup endpoint
 * @param {Object} options Object of multiple options
 * @param {function(Object, Object)} onComplete Callback when popup-flow completes
 */
fb.simplelogin.transports.WinChan_.prototype.open = function(url, opts, cb) {
  /*  General flow:
   *                  0. user clicks
   *  (IE SPECIFIC)   1. caller adds relay iframe (served from trusted domain) to DOM
   *                  2. caller opens window (with content from trusted domain)
   *                  3. window on opening adds a listener to 'message'
   *  (IE SPECIFIC)   4. window on opening finds iframe
   *                  5. window checks if iframe is "loaded" - has a 'doPost' function yet
   *  (IE SPECIFIC5)  5a. if iframe.doPost exists, window uses it to send ready event to caller
   *  (IE SPECIFIC5)  5b. if iframe.doPost doesn't exist, window waits for frame ready
   *  (IE SPECIFIC5)  5bi. once ready, window calls iframe.doPost to send ready event
   *                  6. caller upon reciept of 'ready', sends args
   */
  if (!cb) throw "missing required callback argument";

  opts.url = url;

  // test required options
  var err;
  if (!opts.url) err = "missing required 'url' parameter";
  if (!opts.relay_url) err = "missing required 'relay_url' parameter";
  if (err) setTimeout(function() { cb(err); }, 0);

  // supply default options
  if (!opts.window_name) opts.window_name = null;
  if (!opts.window_features || fb.simplelogin.util.env.isFennec()) opts.window_features = undefined;

  // opts.params may be undefined

  var iframe;

  // sanity check, are url and relay_url the same origin?
  var origin = extractOrigin(opts.url);
  if (origin !== extractOrigin(opts.relay_url)) {
    return setTimeout(function() {
      cb('invalid arguments: origin of url and relay_url must match');
    }, 0);
  }

  var messageTarget;

  if (isInternetExplorer) {
    // first we need to add a "relay" iframe to the document that's served
    // from the target domain.  We can postmessage into a iframe, but not a
    // window
    iframe = document.createElement("iframe");
    // iframe.setAttribute('name', framename);
    iframe.setAttribute('src', opts.relay_url);
    iframe.style.display = "none";
    iframe.setAttribute('name', RELAY_FRAME_NAME);
    document.body.appendChild(iframe);
    messageTarget = iframe.contentWindow;
  }

  var w = window.open(opts.url, opts.window_name, opts.window_features);

  if (!messageTarget) messageTarget = w;

  // lets listen in case the window blows up before telling us
  var closeInterval = setInterval(function() {
    if (w && w.closed) {
      cleanup();
      if (cb) {
        cb('unknown closed window');
        cb = null;
      }
    }
  }, 500);

  var req = fb.simplelogin.util.json.stringify({a: 'request', d: opts.params});

  // cleanup on unload
  function cleanup(forceKeepWindowOpen) {
    if (iframe) document.body.removeChild(iframe);
    iframe = undefined;
    if (closeInterval) closeInterval = clearInterval(closeInterval);
    removeListener(window, 'message', onMessage);
    removeListener(window, 'unload', cleanup);
    if (w && !forceKeepWindowOpen) {
      try {
        w.close();
      } catch (securityViolation) {
        // This happens in Opera 12 sometimes
        // see https://github.com/mozilla/browserid/issues/1844
        messageTarget.postMessage(CLOSE_CMD, origin);
      }
    }
    w = messageTarget = undefined;
  }

  addListener(window, 'unload', cleanup);

  function onMessage(e) {
    if (e.origin !== origin) { return; }
    try {
      var d = fb.simplelogin.util.json.parse(e.data);
      if (d.a === 'ready') messageTarget.postMessage(req, origin);
      else if (d.a === 'error') {
        cleanup();
        if (cb) {
          cb(d.d);
          cb = null;
        }
      } else if (d.a === 'response') {
        cleanup(d.forceKeepWindowOpen);
        if (cb) {
          cb(null, d.d);
          cb = null;
        }
      }
    } catch(err) { }
  }

  addListener(window, 'message', onMessage);

  return {
    close: cleanup,
    focus: function() {
      if (w) {
        try {
          w.focus();
        } catch (e) {
          // IE7 blows up here, do nothing
        }
      }
    }
  };
};

/**
 * @export
 */
fb.simplelogin.transports.WinChan_.prototype.onOpen = function(cb) {
  var o = "*";
  var msgTarget = isInternetExplorer ? findRelay() : window.opener;
  var autoClose = true;

  if (!msgTarget) throw "can't find relay frame";
  function doPost(msg) {
    msg = fb.simplelogin.util.json.stringify(msg);
    if (isInternetExplorer) msgTarget.doPost(msg, o);
    else msgTarget.postMessage(msg, o);
  }

  function onMessage(e) {
    // only one message gets through, but let's make sure it's actually
    // the message we're looking for (other code may be using
    // postmessage) - we do this by ensuring the payload can
    // be parsed, and it's got an 'a' (action) value of 'request'.
    var d;
    try {
      d = fb.simplelogin.util.json.parse(e.data);
    } catch(err) { }
    if (!d || d.a !== 'request') return;
    removeListener(window, 'message', onMessage);
    o = e.origin;
    if (cb) {
      // this setTimeout is critically important for IE8 -
      // in ie8 sometimes addListener for 'message' can synchronously
      // cause your callback to be invoked.  awesome.
      setTimeout(function() {
        cb(o, d.d, function(r, forceKeepWindowOpen) {
          autoClose = !forceKeepWindowOpen;
          cb = undefined;
          doPost({a: 'response', d: r, forceKeepWindowOpen: forceKeepWindowOpen});
        });
      }, 0);
    }
  }

  function onDie(e) {
    if (autoClose && e.data === CLOSE_CMD) {
      try { window.close(); } catch (o_O) {}
    }
  }
  addListener(isInternetExplorer ? msgTarget : window, 'message', onMessage);
  addListener(isInternetExplorer ? msgTarget : window, 'message', onDie);

  // we cannot post to our parent that we're ready before the iframe
  // is loaded. (IE specific possible failure)
  try {
    doPost({a: "ready"});
  } catch(e) {
    // this code should never be exectued outside IE
    addListener(msgTarget, 'load', function(e) {
      doPost({a: "ready"});
    });
  }

  // if window is unloaded and the client hasn't called cb, it's an error
  var onUnload = function() {
    try {
      // IE8 doesn't like this...
      removeListener(isInternetExplorer ? msgTarget : window, 'message', onDie);
    } catch (ohWell) { }
    if (cb) doPost({ a: 'error', d: 'client closed window' });
    cb = undefined;
    // explicitly close the window, in case the client is trying to reload or nav
    try { window.close(); } catch (e) { }
  };
  addListener(window, 'unload', onUnload);
  return {
    detach: function() {
      removeListener(window, 'unload', onUnload);
    }
  };
};


fb.simplelogin.transports.WinChan_.prototype.isAvailable = function() {
  return fb.simplelogin.util.json &&
         fb.simplelogin.util.json.parse &&
         fb.simplelogin.util.json.stringify &&
         window.postMessage;
};

/**
 * Singleton for fb.simplelogin.transports.WinChan_
 */
fb.simplelogin.transports.WinChan = new fb.simplelogin.transports.WinChan_();
