/* Keeps track of all the current asynchronous tasks being run */
function Checklist(items, expect, done) {
  var eventsToComplete = items;

  /* Removes a task from the events list */
  this.x = function(item) {
    var index = eventsToComplete.indexOf(item);
    if (index === -1) {
      expect("Attempting to delete unexpected item '" + item + "' from Checklist").toBeFalsy();
    }
    else {
      eventsToComplete.splice(index, 1);
      if (this.isEmpty()) {
        done();
      }
    }
  };

  /* Returns the length of the events list */
  this.length = function() {
    return eventsToComplete.length;
  };

  /* Returns true if the events list is empty */
  this.isEmpty = function() {
    return (this.length() === 0);
  };
};

describe("Firebase Simple Login", function() {

  it("Check that invalid parameters throw and correct ones don't", function(done) {

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

    //createUser
    authClient.createUser("testuser@firebase.com", "password", function() {
      //changePassword
      authClient.changePassword("testuser@firebase.com", "password", "newPassword", function() {
        //removeUser
        authClient.removeUser("testuser@firebase.com", "newPassword", function() {
          done();
        });
      });
    });
  });

  it("Multiple client instances work concurrently", function(done) {
    var cl = new Checklist(["clientA", "clientB"], expect, done);

    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    // Since we cannot stop the login callback from firing even after this test
    // has run, use a flag to prevent future firings from having any effect
    var statusA = "first";
    var statusB = "first";

    var clientA = new FirebaseSimpleLogin(ref, function(resError, resUser) {
      if (statusA !== "done" && resUser !== null) {
        expect(resError).toBeNull();
        statusA = "done";
        cl.x("clientA");
      }
    });
    clientA.setApiHost(TEST_AUTH_SERVER);
    clientA.logout();

    var clientB = new FirebaseSimpleLogin(ref, function(resError, resUser) {
      if (statusB !== "done" && resUser !== null) {
        expect(resError).toBeNull();
        statusB = "done";
        cl.x("clientB");
      }
    });
    clientB.setApiHost(TEST_AUTH_SERVER);
    clientB.logout();

    clientA.login('anonymous');
  });

});


describe("Email / Password Tests", function() {

  it("Attempt To Create Duplicate Account", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var authClient = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        authClient.removeUser("person@firebase.com", "pw", function() {
          authClient.createUser("person@firebase.com", "pw", function(error1, user1) {
            expect(error1).toBeNull();
            expect(user1).not.toBeNull();
            authClient.createUser("person@firebase.com", "pw", function(error2, user2) {
              expect(error2.code).toBe("EMAIL_TAKEN");
              expect(user2).toBeNull();

              status = "done";

              done();
            });
          });
        });
      }
    });
    authClient.setApiHost(TEST_AUTH_SERVER);
    authClient.logout();
  });

  it("Attempt Login With Incorrect Password", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var authClient = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        authClient.login("password", { email: "person@firebase.com", password: "blah" });
      }
      else if (status !== "done") {
        expect(authError.code).toBe("INVALID_PASSWORD");
        expect(authUser).toBeNull();

        status = "done";

        done();
      }
    });
    authClient.setApiHost(TEST_AUTH_SERVER);
    authClient.logout();
  });

  it("Attempt Login With Incorrect Password - With Promise", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var authClient = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        authClient.login("password", { email: "person@firebase.com", password: "blah" })
          .then(function(resUser) {
            expect(true).toBeFalsy();
          }, function(resError) {
            expect(resError.code).toBe("INVALID_PASSWORD");

            status = "done";

            done();
          });
      }
    });
    authClient.setApiHost(TEST_AUTH_SERVER);
    authClient.logout();
  });

  it("Attempt Login With Correct Password And Different Case", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var authClient = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        authClient.login("password", { email: "PeRsOn@firebase.com", password: "pw" });
      }
      else if (status !== "done") {
        expect(authError).toBeNull();
        expect(authUser).not.toBeNull();

        status = "done";

        done();
      }
    });
    authClient.setApiHost(TEST_AUTH_SERVER);
    authClient.logout();
  });

  it("Attempt Login With Correct Password And Different Case - With Promise", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var authClient = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        authClient.login("password", { email: "PeRsOn@firebase.com", password: "pw" })
          .then(function(resUser) {
            expect(resUser).not.toBeNull();

            status = "done";

            done();
          }, function(resError) {
            expect(true).toBeFalsy();
          });
      }
    });
    authClient.setApiHost(TEST_AUTH_SERVER);
    authClient.logout();
  });

  it("Remove User", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var authClient = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        authClient.removeUser("person@firebase.com", "pw", function(error) {
          expect(error).toBe(null);

          status = "done";

          done();
        });
      }
    });
    authClient.setApiHost(TEST_AUTH_SERVER);
    authClient.logout();
  });

  it("Set Password", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);
    var uid = "person+" + (2<<29 * Math.random()) + "@firebase.com";

    var status = "first";
    var authClient = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        status = "notFirst";

        authClient.createUser(uid, "pw", function(error, user) {
          expect(error).toBeNull();
          expect(user).not.toBeNull();

          authClient.changePassword(uid, "pw", "blah", function(error) {
            expect(error).toBeNull();

            authClient.login("password", { email: uid, password: "blah" }).then(function(resUser) {
              expect(resUser).not.toBeNull();

              status = "done";
              done();
            }, function(resError) {
              expect(true).toBeFalsy();
            });
          });
        });
      }
    });
    authClient.setApiHost(TEST_AUTH_SERVER);
    authClient.logout();
  });
});

describe("Anonymous Login Tests", function() {

  it("Anonymous Auth. Test", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var authClient = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        authClient.login("anonymous");
      }
      else if (status !== "done") {
        expect(authError).toBeNull();
        expect(authUser).not.toBeNull();
        expect(authUser.provider).toBe("anonymous");
        expect(typeof authUser.id).toBe("string");
        expect(authUser.uid).toBe(authUser.provider + ":" + authUser.id);
        expect(authUser.displayName).toBeDefined();

        status = "done";

        done();
      }
    });
    authClient.setApiHost(TEST_AUTH_SERVER);
    authClient.logout();
  });

  it("Anonymous Auth. Test - With Promise", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var authClient = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        authClient.login("anonymous")
          .then(function(resUser) {
            expect(resUser).not.toBeNull();
            expect(resUser.provider).toBe("anonymous");
            expect(typeof resUser.id).toBe("string");
            expect(resUser.uid).toBe(resUser.provider + ":" + resUser.id);
            expect(resUser.displayName).toBeDefined();

            status = "done";

            done();
          }, function(resError) {
            expect("true").toBeFalsy();
          });
      }
    });
    authClient.setApiHost(TEST_AUTH_SERVER);
    authClient.logout();
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
