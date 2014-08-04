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

casper.test.begin('GitHub OAuth Redirect Flow', 6, function suite(test) {
  var result;
  casper.start(TEST_URL, function() {
    this.log('GitHub 01: Instantiating FirebaseSimpleLogin...', 'info');
    this.evaluate(function(TEST_FIREBASE) {
      var ref = new Firebase(TEST_FIREBASE);
      var authClient = new FirebaseSimpleLogin(ref, function(error, user) {});
      authClient.logout();
      authClient.login('gitHub', {
        preferRedirect: true
      });
    }, TEST_FIREBASE);
    this.log('GitHub 02: Waiting for redirect...', 'info');
  });

  casper.waitForSelector('div#login > form', function then() {
    this.log('GitHub 03: Submitting login form...', 'info');
    this.fill('div#login > form', {
      'login'    : 'FirebaseTestuser',
      'password' : 'firebasetest0'
    }, true);
  });

  casper.waitFor(function check() {
    return this.getCurrentUrl() === TEST_URL;
  }, function then() {
    this.log('GitHub 04: Received authentication callback...', 'info');
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
    test.assert(result.user && result.user.provider === 'github', 'user.provider === "github"');
    test.assert(result.user.id === '4391301', 'user.id matches registered account value');
    test.assert(result.user.username === 'FirebaseTestuser', 'user.username matches registered account value');
    test.assert(result.user.displayName === 'Firebase Testuser', 'user.displayName matches registered account value');
    test.assert(typeof result.user.firebaseAuthToken === 'string', 'typeof user.firebaseAuthToken === "string"');
    this.log('GitHub 05: Finished....', 'info');
  });

  casper.run(function() {
    test.done();
  });
});
