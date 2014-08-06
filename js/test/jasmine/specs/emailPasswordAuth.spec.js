describe("Email/Password Authentication Tests:", function() {

  var authClient;

  // Invalid emails
  var invalidEmails = [undefined, null, 0, [], {}, ["test@test.com"], {a: "test@test.com"}, "", "test", "test@", "@test.com", "test@test", "test@.com", "test@test.7"];
  var numInvalidEmails = invalidEmails.length;

  // Invalid passwords
  var invalidPasswords = [undefined, null, 0, [], {}, ["test@test.com"], {a: "test@test.com"}];
  var numInvalidPasswords = invalidPasswords.length;

  // Default user information
  var testUserEmail = "test@test.com";
  var testUserPassword = "password";
  var testUserNewPassword = "new-password";

  // Every test runs with a fresh user database containing no users
  // When this variable is null, there is no user to clean up from a test
  // Otherwise, user testUserEmail should be removed and its password will be stored in this variable
  var passwordToDeleteCreatedTestUser = null;

  beforeEach(function() {
    // Add custom Jamine matchers
    jasmine.addMatchers(customMatchers);

    // Authentication client constructor
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);
    authClient = new FirebaseSimpleLogin(ref, function(error, user) {});
    authClient.setApiHost(TEST_AUTH_SERVER);
  });

  afterEach(function(done) {
    // Clean up the user created in the test if its password is provided
    if (passwordToDeleteCreatedTestUser !== null) {
      authClient.removeUser(testUserEmail, passwordToDeleteCreatedTestUser, function(resError, success) {
        expect(resError).toBeNull();
        // TODO: success is undefined but our docs say it should be true or false
        //expect(success).toBeTruthy();

        if (resError !== null) {
          expect("Removing user in afterEach() threw an error.").toBeFalsy();
        }

        passwordToDeleteCreatedTestUser = null;

        done();
      });
    } else {
      done();
    }
  });

  /* Validates that the email/password auth user variable contains the correct payload */
  var validateEmailPasswordAuthUserPayload = function(user) {
    expect(user).not.toBeNull();
    expect(user).toOnlyHaveTheseKeys([
      "user",
      "id",
      "uid",
      "email",
      "token",
      "provider",
      "md5_hash",
      "sessionKey",
      "isTemporaryPassword"
    ]);
    expect(user.user).toOnlyHaveTheseKeys([
      "id",
      "uid",
      "email",
      "provider",
      "md5_hash",
      "sessionKey",
      "isTemporaryPassword"
    ]);

    // Root object (TODO: do these checks even matter? only token should matter)
    expect(typeof user.id).toBe("string");
    expect(user.uid).toBe("simplelogin:" + user.id);
    expect(typeof user.email).toBe("string");
    // TODO: validate that it is an email
    expect(typeof user.token).toBe("string");
    expect(user.provider).toBe("password");
    expect(typeof user.md5_hash).toBe("string");
    // TOOD: more expecations for md5_hash?
    expect(typeof user.sessionKey).toBe("string");
    expect(typeof user.isTemporaryPassword).toBe("boolean");

    // Nested user object
    expect(typeof user.user.id).toBe("string");
    expect(user.user.uid).toBe("simplelogin:" + user.user.id);
    expect(typeof user.user.email).toBe("string");
    // TODO: validate that it is an email
    expect(user.user.provider).toBe("password");
    expect(typeof user.user.md5_hash).toBe("string");
    // TOOD: more expecations for md5_hash?
    expect(typeof user.user.sessionKey).toBe("string");
    expect(typeof user.user.isTemporaryPassword).toBe("boolean");
  };


  describe("Creating Users:", function() {
    // TODO: In src/FirebaseSimpleLogin.js, we require createUser() to have three inputs
    //       However, our docs say the callback is optional; which is probably how it should be...
    // fb.simplelogin.util.validation.validateArgCount(method, 3, 3, arguments.length);
    xit("createUser() does not throw an error given only two inputs", function() {
      expect(function() {
        authClient.createUser(testUserEmail, testUserPassword);

        // TODO: need to sleep until createUser() finishes

        // Set the created test user to be deleted after this test
        passwordToDeleteCreatedTestUser = testUserPassword;
      }).not.toThrow();
    });

    it("createUser() throws error given invalid email", function(done) {
      invalidEmails.forEach(function(invalidEmail, i) {
        authClient.createUser(invalidEmail, testUserPassword, function(resError, resUser) {
          expect(resUser).toBeNull();
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: FirebaseSimpleLogin: Invalid email specified."));
          // TODO: get error type in authClient callback instead
          // TODO: remove double "FirebaseSimpleLogin:" prefixes

          if (i === numInvalidEmails - 1) {
            done();
          }
        });
      });
    });

    it("createUser() throws error given invalid password", function(done) {
      invalidPasswords.forEach(function(invalidPassword, i) {
        authClient.createUser(testUserEmail, invalidPassword, function(resError, resUser) {
          expect(resUser).toBeNull();
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: FirebaseSimpleLogin: Invalid password specified."));
          // TODO: get error type in authClient callback instead
          // TODO: remove double "FirebaseSimpleLogin:" prefixes

          if (i === numInvalidPasswords - 1) {
            done();
          }
        });
      });
    });

    it("Creating a user with a valid email and password does not throw an error", function(done) {
      authClient.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser);

        // Set the created test user to be deleted after this test
        passwordToDeleteCreatedTestUser = testUserPassword;

        done();
      });
    });

    it("Attempting to create an existing user throws an error", function(done) {
      authClient.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser);

        authClient.createUser(testUserEmail, testUserPassword, function(resError2, resUser2) {
          expect(resUser2).toBeNull();
          expect(resError2).toEqual(new Error("FirebaseSimpleLogin: The specified email address is already in use."));

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        });
      });
    });
  });


  describe("Removing Users:", function() {
    // TODO: In src/FirebaseSimpleLogin.js, we require removeUser() to have three inputs
    //       However, our docs say the callback is optional; which is probably how it should be...
    // fb.simplelogin.util.validation.validateArgCount(method, 3, 3, arguments.length);
    xit("removeUser() does not throw an error given only two inputs", function(done) {
      // TODO
    });

    it("removeUser() throws error given invalid email", function(done) {
      invalidEmails.forEach(function(invalidEmail, i) {
        authClient.removeUser(invalidEmail, testUserPassword, function(resError, success) {
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: FirebaseSimpleLogin: Invalid email specified."));
          //expect(succes).toBe(false);
          // TODO: get error type in authClient callback instead
          // TODO: remove double "FirebaseSimpleLogin:" prefixes

          if (i === numInvalidEmails - 1) {
            done();
          }
        });
      });
    });

    it("removeUser() throws error given invalid password", function(done) {
      invalidPasswords.forEach(function(invalidPassword, i) {
        authClient.removeUser(testUserEmail, invalidPassword, function(resError, success) {
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: FirebaseSimpleLogin: Invalid password specified."));
          //expect(success).toBe(false);
          // TODO: get error type in authClient callback instead
          // TODO: remove double "FirebaseSimpleLogin:" prefixes

          if (i === numInvalidPasswords - 1) {
            done();
          }
        });
      });
    });

    it("Removing an existing user with the wrong password throws error", function(done) {
      authClient.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser);

        authClient.removeUser(testUserEmail, "wrong", function(resError2, success) {
          expect(resError2).toEqual(new Error("FirebaseSimpleLogin: The specified password is incorrect."));
          //expect(success).toBe(false);
          // TODO: get error code INVALID_PASSWORD in authClient callback instead

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        });
      });
    });

    it("Removing a non-existing user throws error", function(done) {
      authClient.removeUser(testUserEmail, testUserPassword, function(resError, success) {
        expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified user does not exist."));
        //expect(success).toBe(false);
        // TODO: get error code INVALID_PASSWORD in authClient callback instead

        done();
      });
    });

    it("Removing an existing user with the correct password removes the user", function(done) {
      authClient.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser);

        authClient.removeUser(testUserEmail, testUserPassword, function(resError2, success) {
          expect(resError2).toBeNull();
          //expect(success).toBe(false);

          done();
        });
      });
    });

    xit("Removing a user logs them out of their existing session", function(done) {
      // TODO
    });
  });


  describe("Changing Passwords:", function() {
    // TODO: In src/FirebaseSimpleLogin.js, we require changePassword() to have four inputs
    //       However, our docs say the callback is optional; which is probably how it should be...
    // fb.simplelogin.util.validation.validateArgCount(method, 4, 4, arguments.length);
    xit("changePassword() does not throw an error given only three inputs", function(done) {
      // TODO
    });

    it("changePassword() throws error given invalid email", function(done) {
      invalidEmails.forEach(function(invalidEmail, i) {
        authClient.changePassword(invalidEmail, testUserPassword, testUserNewPassword, function(resError, success) {
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: FirebaseSimpleLogin: Invalid email specified."));
          //expect(succes).toBe(false);
          // TODO: get error type in authClient callback instead
          // TODO: remove double "FirebaseSimpleLogin:" prefixes

          if (i === numInvalidEmails - 1) {
            done();
          }
        });
      });
    });

    xit("changePassword() throws error given invalid old password", function(done) {
      authClient.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser);

        invalidPasswords.forEach(function(invalidPassword, i) {
          authClient.changePassword(testUserEmail, invalidPassword, testUserNewPassword, function(resError, success) {
            // TODO: this test actually throws this error: "FirebaseSimpleLogin: The specified password is incorrect."
            expect(resError).toEqual(new Error("FirebaseSimpleLogin: FirebaseSimpleLogin: Invalid password specified."));
            //expect(success).toBe(false);
            // TODO: get error type in authClient callback instead
            // TODO: remove double "FirebaseSimpleLogin:" prefixes

            if (i === numInvalidPasswords - 1) {
              // Set the created test user to be deleted after this test
              passwordToDeleteCreatedTestUser = testUserPassword;

              done();
            }
          });
        });
      });
    });

    it("changePassword() throws error given invalid new password", function(done) {
      authClient.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser);

        invalidPasswords.forEach(function(invalidPassword, i) {
          authClient.changePassword(testUserEmail, testUserPassword, invalidPassword, function(resError2, success) {
            expect(resError2).toEqual(new Error("FirebaseSimpleLogin: FirebaseSimpleLogin: Invalid password specified."));
            //expect(success).toBe(false);
            // TODO: get error type in authClient callback instead
            // TODO: remove double "FirebaseSimpleLogin:" prefixes

            if (i === numInvalidPasswords - 1) {
              // Set the created test user to be deleted after this test
              passwordToDeleteCreatedTestUser = testUserPassword;

              done();
            }
          });
        });
      });
    });

    it("Changing the password of an existing user with the wrong old password throws error", function(done) {
      authClient.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser);

        authClient.changePassword(testUserEmail, "wrong", testUserNewPassword, function(resError2, success) {
          expect(resError2).toEqual(new Error("FirebaseSimpleLogin: The specified password is incorrect."));
          //expect(success).toBe(false);
          // TODO: get error code INVALID_PASSWORD in authClient callback instead

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        });
      });
    });

    it("Changing the password of a non-existing user throws error", function(done) {
      authClient.changePassword(testUserEmail, testUserPassword, testUserNewPassword, function(resError, success) {
        expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified user does not exist."));
        //expect(success).toBe(false);
        // TODO: get error code INVALID_PASSWORD in authClient callback instead

        done();
      });
    });

    it("Changing the password of an existing user with the correct password changes their password", function(done) {
      authClient.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser);

        authClient.changePassword(testUserEmail, testUserPassword, testUserNewPassword, function(resError2, success) {
          expect(resError2).toBeNull();
          //expect(success).toBe(true);

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserNewPassword;

          done();
        });
      });
    });

    it("Changing the password of an existing user to the same password does not throw an error", function(done) {
      authClient.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser);

        authClient.changePassword(testUserEmail, testUserPassword, testUserPassword, function(resError2, success) {
          expect(resError2).toBeNull();
          //expect(success).toBe(true);

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        });
      });
    });

    it("Changing the password of an existing user to a new password and then back to the original one works", function(done) {
      authClient.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser);

        authClient.changePassword(testUserEmail, testUserPassword, testUserNewPassword, function(resError2, success2) {
          expect(resError2).toBeNull();
          //expect(success2).toBe(true);

          authClient.changePassword(testUserEmail, testUserNewPassword, testUserPassword, function(resError3, success3) {
            expect(resError3).toBeNull();
            //expect(success3).toBe(true);

            // Set the created test user to be deleted after this test
            passwordToDeleteCreatedTestUser = testUserPassword;

            done();
          });
        });
      });
    });
  });


  describe("Sending Password Reset Emails:", function() {
    it("sendPasswordResetEmail() throws error given invalid email", function(done) {
      invalidEmails.forEach(function(invalidEmail, i) {
        authClient.sendPasswordResetEmail(invalidEmail, function(resError, success) {
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: FirebaseSimpleLogin: Invalid email specified."));
          //expect(succes).toBe(false);
          // TODO: get error type in authClient callback instead
          // TODO: remove double "FirebaseSimpleLogin:" prefixes

          if (i === numInvalidEmails - 1) {
            done();
          }
        });
      });
    });

    it("sendPasswordResetEmail() throws error when passed non-existent user", function(done) {
      authClient.sendPasswordResetEmail(testUserEmail, function(resError, success) {
        expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified user does not exist."));
        //expect(succes).toBe(false);
        // TODO: get error type in authClient callback instead
        // TODO: remove double "FirebaseSimpleLogin:" prefixes

        done();
      });
    });

    xit("sendPasswordResetEmail() successfully sends a password reset email", function(done) {
      //TODO
    });

    xit("Temporary password in password reset email works", function(done) {
      //TODO
    });
  });


  xdescribe("login():", function() {

  });


  xit("Attempt Login With Incorrect Password", function(done) {
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

  xit("Attempt Login With Incorrect Password - With Promise", function(done) {
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

  xit("Attempt Login With Correct Password And Different Case", function(done) {
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

  xit("Attempt Login With Correct Password And Different Case - With Promise", function(done) {
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

  xit("Set Password", function(done) {
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