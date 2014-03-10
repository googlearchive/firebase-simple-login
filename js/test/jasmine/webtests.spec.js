describe("Firebase Simple Login", function() {

  it("Check that invalid parameters throw and correct ones don't", function() {

    //constructor
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);
    var authClient = new FirebaseSimpleLogin(ref, function(error, user) {});
    authClient.setApiHost(TEST_AUTH_SERVER);

    expect(function() {
      new FirebaseSimpleLogin(17);
    }).toThrow();

    expect(function() {
      new FirebaseSimpleLogin();
    }).toThrow();

    expect(function() {
      authClient.createUser("testuser");
    }).toThrow();

    expect(function() {
      authClient.createUser("testuser", "sdfsdf", 17);
    }).toThrow();

    expect(function() {
      authClient.login("nonexistentprovider");
    }).toThrow();

    expect(function() {
      authClient.changePassword("testuser");
    }).toThrow();

    expect(function() {
      authClient.changePassword("testuser", false, false);
    }).toThrow();

    authClient.changePassword("testuser", false, false, function(error, token, user) {
      expect(error.code).toBe('INVALID_EMAIL');
    });

    expect(function() {
      authClient.removeUser("testuser", 'test');
    }).toThrow();

    authClient.removeUser("testuser@domain.com", false, function(error, token, user) {
      expect(error.code).toBe('INVALID_PASSWORD');
    });

    var done = false;
    runs(function() {
      //createUser
      authClient.createUser("testuser@firebase.com", "password", function() {
        //changePassword
        authClient.changePassword("testuser@firebase.com", "password", "newPassword", function() {
          //removeUser
          authClient.removeUser("testuser@firebase.com", "newPassword", function() {});
          done = true;
        });
      });
    });

    waitsFor(function() {
      return done;
    }, "test all method parameters", TEST_TIMEOUT);
  });

  it("Multiple client instances work concurrently", function() {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);
    var gotA, gotB;

    var clientA = new FirebaseSimpleLogin(ref, function(resError, resUser) {
      if (resUser) gotA = true;
    });
    clientA.setApiHost(TEST_AUTH_SERVER);
    clientA.logout();

    var gotB = false;
    var clientB = new FirebaseSimpleLogin(ref, function(resError, resUser) {
      if (resUser) gotB = true;
    });
    clientB.setApiHost(TEST_AUTH_SERVER);
    clientB.logout();

    gotA = false, gotB = false;
    clientA.login('anonymous');

    waitsFor(function() {
      return gotA && gotB;
    }, "both client instances received on-login callback", TEST_TIMEOUT);
  });

});


describe("Email / Password Tests", function() {

  it("Create Account and Login", function() {
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
      authClient.createUser("person@firebase.com", "pw", function(error, userId) {
        expect(error).toBe(null);
        authClient.createUser("person@firebase.com", "pw", function(error, userId) {
          expect(error.code).toBe("EMAIL_TAKEN");
          done = true;
        });
      });
    });

    waitsFor(function() {
      return done;
    }, "attempt creating duplicate account", TEST_TIMEOUT);

    runs(function() {
      done = false;
      authClient.login("password", { email: "person@firebase.com", password: "blah" });
    });

    waitsFor(function() {
      return done;
    }, "attempt login with incorrect password", TEST_TIMEOUT);

    runs(function() {
      expect(error.code).toBe("INVALID_PASSWORD");
    });

    runs(function() {
      done = false;
      authClient.login("password", { email: "PeRsOn@firebase.com", password: "pw" });
    });

    waitsFor(function() {
      return done;
    }, "attempt login with correct password and different case", TEST_TIMEOUT);

    runs(function() {
      expect(error).toBe(null);
    });

    runs(function() {
      done = false;
      authClient.removeUser("person@firebase.com", "pw", function(error) {
        expect(error).toBe(null);
        done = true;
      });
    });

    waitsFor(function() {
      return done;
    }, "account removal", TEST_TIMEOUT);
  });

  it("Set Password", function() {
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
      authClient.createUser("person@firebase.com", "pw", function(error, user) {
        authClient.changePassword("person@firebase.com", "pw", "blah", function(error) {
          expect(error).toBe(null);
          done = true;
        });
      });
    });

    waitsFor(function() {
      return done;
    }, "create user and change password", TEST_TIMEOUT);

    runs(function() {
      done = false;
      authClient.login("password", { email: "person@firebase.com", password: "blah" });
    });

    waitsFor(function() {
      return done;
    }, "login with new password", TEST_TIMEOUT);

    runs(function() {
      done = false;
      authClient.login("password", { email: "person@firebase.com", password: "invalidpassword" });
    });

    waitsFor(function() {
      return done;
    }, "invalid password login", TEST_TIMEOUT);

    runs(function() {
      done = false;
      authClient.removeUser("person@firebase.com", "blah", function(error) {
        expect(error).toBe(null);
        done = true;
      });
    });

    waitsFor(function() {
      return done;
    }, "remove user", TEST_TIMEOUT);

    runs(function() {
      done = false;
      authClient.changePassword("sdfsdrwbw@firebase.com", "blah", "pw", function(error) {
        expect(error.code).toBe("INVALID_USER");
        done = true;
      });
    });

    waitsFor(function() {
      return done;
    }, "set password of nonexistent user", TEST_TIMEOUT);
  });

  it("Remove Account", function() {
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
      authClient.createUser("person@firebase.com", "pw", function(error, user) {
        expect(error).toBe(null);
        expect(typeof user).toBe("object");
        authClient.removeUser("person@firebase.com", "pw", function(error) {
          expect(error).toBe(null);
          done = true;
        });
      });
    });

    waitsFor(function() {
      return done;
    }, "account creation and deletion", TEST_TIMEOUT);

    runs(function() {
      done = false;
      authClient.login("password", { email: "person@firebase.com", password: "pw" });
    });

    waitsFor(function() {
      return done;
    }, "attempt login of deleted user", TEST_TIMEOUT);

    runs(function() {
      expect(error.code).toBe("INVALID_USER");
    });
  });

});

describe("Anonymous Login Tests", function() {

  it("Anonymous Auth. Test", function() {
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
      authClient.login("anonymous");
    });

    waitsFor(function() {
      return done;
    }, "attempt authentication with Anonymous", TEST_TIMEOUT);

    runs(function() {
      expect(error).toBe(null);
      expect(user.provider).toBe("anonymous");
      expect(typeof user.id).toBe("string");
      expect(user.uid).toBe(user.provider + ":" + user.id);
      expect(user.displayName).toBeDefined();
    });

  });
});

describe("OAuth Provider+Token Tests", function() {

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
