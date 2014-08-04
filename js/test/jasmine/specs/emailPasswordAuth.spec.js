describe("Email/password Authentication Tests:", function() {

  var authClient;

  beforeEach(function() {
    jasmine.addMatchers(customMatchers);

    //constructor
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);
    authClient = new FirebaseSimpleLogin(ref, function(error, user) {});
    authClient.setApiHost(TEST_AUTH_SERVER);
  });

  /* Validates that the email/password auth user variable contains the correct payload */
  var validateEmailPasswordAuthUserPayload = function(user) {
    try {
      expect(user).not.toBeNull();
      expect(user).toOnlyHaveTheseKeys([
        "id",
        "uid",
        "provider",
        "displayName",
        "firebaseAuthToken"
      ]);

      expect(typeof user.firebaseAuthToken).toBe("string");
      expect(user.provider).toBe("password");
      expect(typeof user.id).toBe("string");
      expect(user.uid).toBe("simplelogin:" + user.id);

      // TODO: should anonymous auth even have a display name?
      expect(user.displayName).toBeDefined();
      // expect(user.displayName).toBe("");
    }
    catch (error) {
      console.log("Anonymous auth payload verification failed.");
    }
  };

  describe("createUser():", function() {

    // TODO: In src/FirebaseSimpleLogin.js, we require createUser() to have three inputs
    //       However, our docs say the callback is optional; which is probably how it should be...
    // fb.simplelogin.util.validation.validateArgCount(method, 3, 3, arguments.length);
    xit("createUser() doesn't throw an error given only two inputs", function() {
      expect(function() {
        authClient.createUser("asdf@firebase.com", "password");
      }).not.toThrow();
    });

    it("createUser() throws error given invalid email", function() {
      var invalidEmails = [undefined, null, 0, [], {}, ["test@test.com"], {a: "test@test.com"}, "test", "test@", "@test.com", "test@test", "test@.com", "test@test.7"];

      invalidEmails.forEach(function(invalidEmail) {
        authClient.createUser(invalidEmail, "password", function(resError, resUser) {
          expect(resUser).toBeNull();
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: FirebaseSimpleLogin: Invalid email specified."));
          // TODO: get error type in authClient callback instead
          // TODO: remove double "FirebaseSimpleLogin:" prefixes
        });
      });
    });

    it("createUser() throws error given invalid password", function() {
      var invalidPasswords = [undefined, null, 0, [], {}, ["test@test.com"], {a: "test@test.com"}];

      invalidPasswords.forEach(function(invalidPassword) {
        authClient.createUser("test@test.com", invalidPassword, function(resError, resUser) {
          expect(resUser).toBeNull();
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: FirebaseSimpleLogin: Invalid password specified."));
          // TODO: get error type in authClient callback instead
          // TODO: remove double "FirebaseSimpleLogin:" prefixes
        });
      });
    });

    // TODO: we currently allow the password to be the ANY string
    //       (including the empty string), which seems wrong

  });

  xdescribe("changePassword():", function() {
expect(function() {
      authClient.changePassword("testuser");
    }).toThrow();

    expect(function() {
      authClient.changePassword("testuser", false, false);
    }).toThrow();

    authClient.changePassword("testuser", false, false, function(error, token, user) {
      expect(error.code).toBe('INVALID_EMAIL');
    });
  });

  xdescribe("removeUser():", function() {
    expect(function() {
      authClient.removeUser("testuser", 'test');
    }).toThrow();

    authClient.removeUser("testuser@domain.com", false, function(error, token, user) {
      expect(error.code).toBe('INVALID_PASSWORD');
    });
  });

  xdescribe("sendPasswordResetEmail():", function() {

  });



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