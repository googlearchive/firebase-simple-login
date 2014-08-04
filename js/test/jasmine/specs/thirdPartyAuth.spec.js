describe("Third Party Providers Tests:", function() {
  if (TEST_FACEBOOK_ACCESS_TOKEN) {
    it("Facebook Access Token Auth. Test", function() {
      var ctx = new Firebase.Context();
      var ref = new Firebase(TEST_NAMESPACE, ctx);

      var done = false, error = null, user = null;
      var authClient = new FirebaseSimpleLogin(ref, function(resError, resUser) {
        error = resError; user = resUser; done = true;
      });
      authClient.setApiHost(TEST_AUTH_SERVER);
      authClient.logout();

      waitsFor(function() {
        return done;
      }, "initialize client and ensure user logged out", TEST_TIMEOUT);

      // See the TEST_FACEBOOK_ACCESS_TOKEN definition for details on obtaining a valid token.
      runs(function() {
        done = false;
        authClient.login("facebook", {
          access_token : TEST_FACEBOOK_ACCESS_TOKEN
        });
      });

      waitsFor(function() {
        return done;
      }, "attempt authentication with Facebook access token", TEST_TIMEOUT);

      runs(function() {
        expect(error).toBe(null);
        expect(user.provider).toBe("facebook");
        expect(typeof user.id).toBe("string");
        expect(user.uid).toBe(user.provider + ":" + user.id);
        expect(user.displayName).toBeDefined();
      });
    });
  }

  if (TEST_GOOGLE_ACCESS_TOKEN) {
    it("Google OAuth Token Auth. Test", function() {
      var ctx = new Firebase.Context();
      var ref = new Firebase(TEST_NAMESPACE, ctx);

      var done = false, error = null, user = null;
      var authClient = new FirebaseSimpleLogin(ref, function(resError, resUser) {
        error = resError; user = resUser; done = true;
      });
      authClient.setApiHost(TEST_AUTH_SERVER);
      authClient.logout();

      waitsFor(function() {
        return done;
      }, "initialize client and ensure user logged out", TEST_TIMEOUT);

      runs(function() {
        done = false;
        authClient.login("google", {
          access_token : TEST_GOOGLE_ACCESS_TOKEN
        });
      });

      waitsFor(function() {
        return done;
      }, "attempt authentication with Twitter OAuth token", TEST_TIMEOUT);

      runs(function() {
        expect(error).toBe(null);
        expect(user.provider).toBe("google");
        expect(typeof user.id).toBe("string");
        expect(user.uid).toBe(user.provider + ":" + user.id);
        expect(user.displayName).toBeDefined();
      });
    });
  }

  if (TEST_TWITTER_USER_ID && TEST_TWITTER_OAUTH_TOKEN && TEST_TWITTER_OAUTH_TOKEN_SECRET) {
    it("Twitter OAuth Token Auth. Test", function() {
      var ctx = new Firebase.Context();
      var ref = new Firebase(TEST_NAMESPACE, ctx);

      var done = false, error = null, user = null;
      var authClient = new FirebaseSimpleLogin(ref, function(resError, resUser) {
        error = resError; user = resUser; done = true;
      });
      authClient.setApiHost(TEST_AUTH_SERVER);
      authClient.logout();

      waitsFor(function() {
        return done;
      }, "initialize client and ensure user logged out", TEST_TIMEOUT);

      runs(function() {
        done = false;
        authClient.login("twitter", {
          user_id            : TEST_TWITTER_USER_ID,
          oauth_token        : TEST_TWITTER_OAUTH_TOKEN,
          oauth_token_secret : TEST_TWITTER_OAUTH_TOKEN_SECRET
        });
      });

      waitsFor(function() {
        return done;
      }, "attempt authentication with Twitter OAuth token", TEST_TIMEOUT);

      runs(function() {
        expect(error).toBe(null);
        expect(user.provider).toBe("twitter");
        expect(typeof user.id).toBe("string");
        expect(user.uid).toBe(user.provider + ":" + user.id);
        expect(user.displayName).toBeDefined();
      });
    });
  }
});