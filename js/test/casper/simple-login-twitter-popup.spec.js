if (typeof casper === 'undefined') {
  var casper = require('casper').create({
    verbose: true,
    logLevel: 'error'
  });
}

phantom.clearCookies();

casper.on('remote.message', function(msg) {
  this.log('> ' + msg, 'debug');
});

var TEST_URL = 'http://localhost:9090/js/test/casper/',
    TEST_FIREBASE = 'https://demos.firebaseio.com';

casper.test.begin('Twitter OAuth Popup Flow', 6, function suite(test) {
  var result;
  casper.start(TEST_URL, function() {
    this.log('Twitter 01: Instantiating FirebaseSimpleLogin...', 'info');
    this.evaluate(function(TEST_FIREBASE) {
      window.result = { error: null, user: null };
      Firebase.enableLogging(true);
      var ref = new Firebase(TEST_FIREBASE);
      var authClient = new FirebaseSimpleLogin(ref, function(error, user) {
        if (user) {
          window.result.user = user;
          window.result.error = error;
        }
      });
      authClient.logout();
      authClient.login('twitter');
    }, TEST_FIREBASE);
    this.log('Twitter 02: Waiting for popup...', 'info');
  });

  casper.waitForPopup(/api\.twitter\.com/g, function() {
    this.log('Twitter 03: Found popup!', 'info');
  });

  casper.withPopup(/api\.twitter\.com/g, function() {
    this.log('Twitter 04: Submitting login form...', 'info');
    this.fill('form#oauth_form', {
      'session[username_or_email]' : 'FirebaseTestuse',
      'session[password]'          : 'firebasetest'
    }, true);
  });

  casper.waitFor(function check() {
    result = this.evaluate(function() {
      return window.result;
    });
    return result.error || result.user;

  }, function then() {
    this.log('Twitter 05: Received authentication callback...', 'info');
    test.assertFalsy(result.error, 'error is falsy');
    test.assert(result.user && result.user.provider === 'twitter', 'user.provider === "twitter"');
    test.assert(result.user.id === '1416596586', 'user.id matches registered account value');
    test.assert(result.user.username === 'FirebaseTestuse', 'user.username matches registered account value');
    test.assert(result.user.displayName === 'Firebase Testuser', 'user.displayName matches registered account value');
    test.assert(typeof result.user.firebaseAuthToken === 'string', 'typeof user.firebaseAuthToken === "string"');
  }, function timeout() {
    test.fail('Twitter : failed to receive authentication callback');
  });

  casper.then(function() {
    this.log('Twitter 06: Finished....', 'info');
  });

  casper.run(function() {
    test.done();
  });
});
