if (typeof casper === 'undefined') {
  var casper = require('casper').create({
    verbose: true,
    logLevel: 'debug'
  });
}

phantom.clearCookies();

casper.on('remote.message', function(msg) {
  this.log('> ' + msg, 'debug');
});

var TEST_URL = 'http://localhost:9090/js/test/casper/',
    TEST_FIREBASE = 'https://demos.firebaseio.com';

casper.test.begin('Facebook OAuth Popup Flow', 5, function suite(test) {
  var result;
  casper.start(TEST_URL, function() {
    this.log('Facebook 01: Instantiating FirebaseSimpleLogin...', 'info');
    this.evaluate(function(TEST_FIREBASE) {
      window.result = { error: null, user: null };
      Firebase.enableLogging(true);
      var ref = new Firebase(TEST_FIREBASE);
      var authClient = new FirebaseSimpleLogin(ref, function(error, user) {
        if (error) {
          console.error(error);
        }
        if (user) {
          window.result.user = user;
          window.result.error = error;
        }
      });
      authClient.logout();
      authClient.login('facebook');
    }, TEST_FIREBASE);
    this.log('Facebook 02: Waiting for popup...', 'info');
  });

  casper.waitForPopup(/^https:\/\/www\.facebook\.com\/login\.php/, function() {
    this.log('Facebook 03: Found popup!', 'info');
  });

  casper.waitFor(function() {
    return casper.popups.length && casper.popups[0].evaluate(function() {
      return document.querySelectorAll('form#login_form').length > 0;
    });
  });

  casper.withPopup(/^https:\/\/www\.facebook\.com\/login\.php/, function() {
    this.log('Facebook 04: Submitting login form...', 'info');
    this.fill('form#login_form', {
      'email' : 'test_yskstwo_user@tfbnw.net',
      'pass'  : 'testpassword'
    }, true);
  });

  casper.waitFor(function check() {
    result = this.evaluate(function() {
      return window.result;
    });
    return result.error || result.user;

  }, function then() {
    this.log('Facebook 05: Received authentication callback...', 'info');
    test.assertFalsy(result.error, 'error is falsy');
    test.assert(result.user && result.user.provider === 'facebook', 'user.provider === "facebook"');
    test.assert(result.user.id === '100006858094166', 'user.id matches registered account value');
    test.assert(result.user.displayName === 'Test User', 'user.displayName matches registered account value');
    test.assert(typeof result.user.firebaseAuthToken === 'string', 'typeof user.firebaseAuthToken === "string"');
  }, function timeout() {
    test.fail('Facebook : failed to receive authentication callback');
  });

  casper.then(function() {
    this.log('Facebook 06: Finished....', 'info');
  });

  casper.run(function() {
    test.done();
  });
});
