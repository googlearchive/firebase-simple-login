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

casper.test.begin('Facebook OAuth Redirect Flow', 5, function suite(test) {
  var result;
  casper.start(TEST_URL, function() {
    this.log('Facebook 01: Instantiating FirebaseSimpleLogin...', 'info');
    this.evaluate(function(TEST_FIREBASE) {
      var ref = new Firebase(TEST_FIREBASE);
      var authClient = new FirebaseSimpleLogin(ref, function(error, user) {});
      authClient.logout();
      authClient.login('facebook', {
        preferRedirect: true
      });
    }, TEST_FIREBASE);
    this.log('Facebook 02: Waiting for redirect...', 'info');
  });

  casper.waitForSelector('form#login_form', function then() {
    this.log('Facebook 03: Submitting login form...', 'info');
    this.fill('form#login_form', {
      'email' : 'test_yskstwo_user@tfbnw.net',
      'pass'  : 'testpassword'
    }, true);
  });

  casper.waitFor(function check() {
    return this.getCurrentUrl() === TEST_URL;
  }, function then() {
    this.log('Facebook 04: Received authentication callback...', 'info');
    this.evaluate(function(TEST_FIREBASE) {
      window.result = null;
      Firebase.enableLogging(true);
      var ref = new Firebase(TEST_FIREBASE);
      var authClient = new FirebaseSimpleLogin(ref, function(error, user) {
        window.result = {
          done: true,
          user: user,
          error: error
        };
      });
    }, TEST_FIREBASE);
  });

  casper.waitFor(function check() {
    result = this.evaluate(function() {
      return window.result;
    });
    return result && result.done;
  });

  casper.then(function() {
    test.assertFalsy(result.error, 'error is falsy');
    test.assert(result.user && result.user.provider === 'facebook', 'user.provider === "facebook"');
    test.assert(result.user.id === '100006858094166', 'user.id matches registered account value');
    test.assert(result.user.displayName === 'Test User', 'user.displayName matches registered account value');
    test.assert(typeof result.user.firebaseAuthToken === 'string', 'typeof user.firebaseAuthToken === "string"');
    this.log('Facebook 05: Finished....', 'info');
  });

  casper.run(function() {
    test.done();
  });
});
