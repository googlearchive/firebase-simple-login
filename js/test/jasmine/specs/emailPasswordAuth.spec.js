describe("Email/Password Authentication Tests:", function() {

  // FirebaseSimpleLogin instance
  var auth;

  // Invalid emails
  var invalidEmails = [undefined, null, 0, [], {}, function() {}, ["test@test.com"], {a: "test@test.com"}, "", "test", "test@", "@test.com", "test@test", "test@.com", "test@test.7"];
  var numInvalidEmails = invalidEmails.length;

  // Invalid passwords
  var invalidPasswords = [undefined, null, 0, [], {}, function() {}, ["test@test.com"], {a: "test@test.com"}];
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
    auth = new FirebaseSimpleLogin(ref, function(error, user) {});
    auth.setApiHost(TEST_AUTH_SERVER);
  });

  afterEach(function(done) {
    // Log out the currently logged in user (if any)
    auth.logout();

    // Clean up the user created in the test if its password is provided
    if (passwordToDeleteCreatedTestUser !== null) {
      auth.removeUser(testUserEmail, passwordToDeleteCreatedTestUser, function(resError) {
        expect(resError).toBeNull();

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
  var validateEmailPasswordAuthUserPayload = function(user, expectUserProperty) {
    var userSpecificKeys = [
      "id",
      "uid",
      "email",
      "provider",
      "md5_hash",
      "isTemporaryPassword"
    ];

    expect(user).not.toBeNull();
    if (expectUserProperty) {
      expect(user).toOnlyHaveTheseKeys(userSpecificKeys.concat(["user", "token", "sessionKey"]));
      expect(user.user).toOnlyHaveTheseKeys(userSpecificKeys.concat(["sessionKey"]));
    }
    else {
      expect(user).toOnlyHaveTheseKeys(userSpecificKeys.concat(["firebaseAuthToken"]));
    }

    // Root object (TODO: do these checks even matter? only token should matter)
    expect(typeof user.id).toBe("string");
    expect(user.uid).toBe("simplelogin:" + user.id);
    expect(typeof user.email).toBe("string");
    // TODO: validate that it is an email
    expect(user.provider).toBe("password");
    expect(typeof user.md5_hash).toBe("string");
    // TOOD: more expecations for md5_hash?
    expect(typeof user.isTemporaryPassword).toBe("boolean");

    if (expectUserProperty) {
      expect(typeof user.token).toBe("string");
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
    } else {
      expect(typeof user.firebaseAuthToken).toBe("string");
    }
  };


  describe("Creating Users:", function() {

    xit("createUser() does not throw an error given only two inputs", function(done) {
      expect(function() {
        auth.createUser(generateRandomEmail(), testUserPassword);
        // TODO: remove this hack and get this passing in Travis
        // Creating two users at the same time causes issues, so we should either fix that
        // issue or wait a fair amount of time until this request has probably succeeded
        setTimeout(done, 3000);
      }).not.toThrow();
    });

    it("createUser() throws error given invalid email", function(done) {
      invalidEmails.forEach(function(invalidEmail, i) {
        auth.createUser(invalidEmail, testUserPassword, function(resError, resUser) {
          expect(resUser).toBeNull();
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: Invalid email specified."));
          // TODO: get error type in auth callback instead

          if (i === numInvalidEmails - 1) {
            done();
          }
        });
      });
    });

    it("createUser() throws error given invalid password", function(done) {
      invalidPasswords.forEach(function(invalidPassword, i) {
        auth.createUser(testUserEmail, invalidPassword, function(resError, resUser) {
          expect(resUser).toBeNull();
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: Invalid password specified."));
          // TODO: get error type in auth callback instead

          if (i === numInvalidPasswords - 1) {
            done();
          }
        });
      });
    });

    it("Creating a user with a valid email and password does not throw an error", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        // Set the created test user to be deleted after this test
        passwordToDeleteCreatedTestUser = testUserPassword;

        done();
      });
    });

    it("Attempting to create an existing user throws an error", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.createUser(testUserEmail, testUserPassword, function(resError2, resUser2) {
          expect(resUser2).toBeNull();
          expect(resError2).toEqual(new Error("FirebaseSimpleLogin: The specified email address is already in use."));

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        });
      });
    });

    it("Attempting to create an existing user with a different case throws an error", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.createUser(testUserEmail.toUpperCase(), testUserPassword, function(resError2, resUser2) {
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

    xit("removeUser() does not throw an error given only two inputs", function(done) {
      var email = generateRandomEmail();
      expect(function() {
        auth.createUser(email, testUserPassword, function(resError, resUser) {
          expect(resError).toBeNull();
          validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

          auth.removeUser(email, testUserPassword);

          done();
        });
      }).not.toThrow();
    });

    it("removeUser() throws error given invalid email", function(done) {
      invalidEmails.forEach(function(invalidEmail, i) {
        auth.removeUser(invalidEmail, testUserPassword, function(resError) {
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: Invalid email specified."));
          // TODO: get error type in auth callback instead

          if (i === numInvalidEmails - 1) {
            done();
          }
        });
      });
    });

    it("removeUser() throws error given invalid password", function(done) {
      invalidPasswords.forEach(function(invalidPassword, i) {
        auth.removeUser(testUserEmail, invalidPassword, function(resError) {
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: Invalid password specified."));
          // TODO: get error type in auth callback instead

          if (i === numInvalidPasswords - 1) {
            done();
          }
        });
      });
    });

    it("Removing an existing user with the wrong password throws error", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.removeUser(testUserEmail, "invalid", function(resError2) {
          expect(resError2).toEqual(new Error("FirebaseSimpleLogin: The specified password is incorrect."));
          // TODO: get error code INVALID_PASSWORD in auth callback instead

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        });
      });
    });

    it("Removing a non-existing user throws error", function(done) {
      auth.removeUser(testUserEmail, testUserPassword, function(resError) {
        expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified user does not exist."));
        // TODO: get error code INVALID_PASSWORD in auth callback instead

        done();
      });
    });

    it("Removing an existing user with the correct password removes the user", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.removeUser(testUserEmail, testUserPassword, function(resError2) {
          expect(resError2).toBeNull();

          done();
        });
      });
    });

    it("Removing an existing user with the correct password but different email case removes the user", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.removeUser(testUserEmail.toUpperCase(), testUserPassword, function(resError2) {
          expect(resError2).toBeNull();

          done();
        });
      });
    });

    xit("Removing a user logs them out of their existing session", function(done) {
      // TODO
    });

  });


  describe("Changing Passwords:", function() {

    xit("changePassword() does not throw an error given only three inputs", function(done) {
      var email = generateRandomEmail();
      expect(function() {
        auth.createUser(email, testUserPassword, function(resError, resUser) {
          expect(resError).toBeNull();
          validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

          auth.changePassword(email, testUserPassword, testUserNewPassword);

          done();
        });
      }).not.toThrow();
    });

    it("changePassword() throws error given invalid email", function(done) {
      invalidEmails.forEach(function(invalidEmail, i) {
        auth.changePassword(invalidEmail, testUserPassword, testUserNewPassword, function(resError) {
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: Invalid email specified."));
          // TODO: get error type in auth callback instead

          if (i === numInvalidEmails - 1) {
            done();
          }
        });
      });
    });

    xit("changePassword() throws error given invalid old password", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        invalidPasswords.forEach(function(invalidPassword, i) {
          auth.changePassword(testUserEmail, invalidPassword, testUserNewPassword, function(resError) {
            // TODO: this test actually throws this error: "FirebaseSimpleLogin: The specified password is incorrect."
            expect(resError).toEqual(new Error("FirebaseSimpleLogin: Invalid password specified."));
            // TODO: get error type in auth callback instead

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
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        invalidPasswords.forEach(function(invalidPassword, i) {
          auth.changePassword(testUserEmail, testUserPassword, invalidPassword, function(resError2) {
            expect(resError2).toEqual(new Error("FirebaseSimpleLogin: Invalid password specified."));
            // TODO: get error type in auth callback instead

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
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.changePassword(testUserEmail, "invalid", testUserNewPassword, function(resError2) {
          expect(resError2).toEqual(new Error("FirebaseSimpleLogin: The specified password is incorrect."));
          // TODO: get error code INVALID_PASSWORD in auth callback instead

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        });
      });
    });

    it("Changing the password of a non-existing user throws error", function(done) {
      auth.changePassword(testUserEmail, testUserPassword, testUserNewPassword, function(resError) {
        expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified user does not exist."));
        // TODO: get error code INVALID_PASSWORD in auth callback instead

        done();
      });
    });

    it("Changing the password of an existing user with the correct password changes their password", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.changePassword(testUserEmail, testUserPassword, testUserNewPassword, function(resError2) {
          expect(resError2).toBeNull();

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserNewPassword;

          done();
        });
      });
    });

    it("Changing the password of an existing user with the correct password changes their password even if the email used has different case", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.changePassword(testUserEmail.toUpperCase(), testUserPassword, testUserNewPassword, function(resError2) {
          expect(resError2).toBeNull();

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserNewPassword;

          done();
        });
      });
    });

    it("Changing the password of an existing user to the same password does not throw an error", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.changePassword(testUserEmail, testUserPassword, testUserPassword, function(resError2) {
          expect(resError2).toBeNull();

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        });
      });
    });

    it("Changing the password of an existing user to a new password and then back to the original one works", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.changePassword(testUserEmail, testUserPassword, testUserNewPassword, function(resError2) {
          expect(resError2).toBeNull();

          auth.changePassword(testUserEmail, testUserNewPassword, testUserPassword, function(resError3) {
            expect(resError3).toBeNull();

            // Set the created test user to be deleted after this test
            passwordToDeleteCreatedTestUser = testUserPassword;

            done();
          });
        });
      });
    });

    it("Changing the password of an existing user prevents you from removing that user with the old password", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.changePassword(testUserEmail, testUserPassword, testUserNewPassword, function(resError2) {
          expect(resError2).toBeNull();

          auth.removeUser(testUserEmail, testUserPassword, function(resError3) {
            expect(resError3).toEqual(new Error("FirebaseSimpleLogin: The specified password is incorrect."));

            // Set the created test user to be deleted after this test
            passwordToDeleteCreatedTestUser = testUserNewPassword;

            done();
          });
        });
      });
    });

    it("Changing the password of an existing user allows you to remove that user with the new password", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        expect(resError).toBeNull();
        validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

        auth.changePassword(testUserEmail, testUserPassword, testUserNewPassword, function(resError2) {
          expect(resError2).toBeNull();

          auth.removeUser(testUserEmail, testUserNewPassword, function(resError3) {
            expect(resError3).toBeNull();

            done();
          });
        });
      });
    });

  });


  describe("Sending Password Reset Emails:", function() {

    xit("sendPasswordResetEmail() does not throw an error given only one input", function(done) {
      var email = generateRandomEmail();
      expect(function() {
        auth.createUser(email, testUserPassword, function(resError, resUser) {
          expect(resError).toBeNull();
          validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ true);

          auth.sendPasswordResetEmail(email);

          done();
        });
      }).not.toThrow();
    });

    it("sendPasswordResetEmail() throws error given invalid email", function(done) {
      invalidEmails.forEach(function(invalidEmail, i) {
        auth.sendPasswordResetEmail(invalidEmail, function(resError) {
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: Invalid email specified."));
          // TODO: get error type in auth callback instead

          if (i === numInvalidEmails - 1) {
            done();
          }
        });
      });
    });

    it("sendPasswordResetEmail() throws error when passed non-existent user", function(done) {
      auth.sendPasswordResetEmail(testUserEmail, function(resError) {
        expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified user does not exist."));
        // TODO: get error type in auth callback instead

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


  describe("Logging Users In:", function() {

    xit("login() throws error given only one argument", function(done) {
      auth.login("password").then(function(resUser) {
        expect("Should not be here").toBeFalsy();
      }).catch(function(resError) {
        // TODO: improve the error message in the client here
        // current returns "FirebaseSimpleLogin: The specified user does not exist."
        expect(resError).toEqual(new Error("TODO"));
        done();
      });
    });

    xit("login() throws error given invalid email", function(done) {
      // TODO: some emails are invalid but do not throw the correct error
      // Instead, we get this error: "FirebaseSimpleLogin: The specified user does not exist."
      invalidEmails.forEach(function(invalidEmail, i) {
        auth.login("password", {
          email: invalidEmail,
          password: testUserPassword
        }).then(function(resUser) {
          expect("Should not be here").toBeFalsy();
        }).catch(function(resError) {
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified email address is incorrect."));

          if (i === numInvalidEmails - 1) {
            done();
          }
        });
      });
    });

    it("login() throws error given invalid password", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        invalidPasswords.forEach(function(invalidPassword, i) {
          auth.login("password", {
            email: testUserEmail,
            password: invalidPassword
          }).then(function(resUser) {
            expect("Should not be here").toBeFalsy();
          }).catch(function(resError) {
            expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified password is incorrect."));

            if (i === numInvalidPasswords - 1) {
              // Set the created test user to be deleted after this test
              passwordToDeleteCreatedTestUser = testUserPassword;

              done();
            }
          });
        });
      });
    });

    it("login() throws error given email for non-existent user", function(done) {
      auth.login("password", {
        email: testUserEmail,
        password: testUserPassword
      }).then(function(resUser) {
        expect("Should not be here").toBeFalsy();
      }).catch(function(resError) {
        expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified user does not exist."));

        done();
      });
    });

    it("login() throws error given incorrect password for existing user", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        auth.login("password", {
          email: testUserEmail,
          password: "invalid"
        }).then(function(resUser) {
          expect("Should not be here").toBeFalsy();
        }).catch(function(resError) {
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified password is incorrect."));

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        });
      });
    });

    it("login() throws error given password different case (but otherwise correct) for existing user", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        auth.login("password", {
          email: testUserEmail,
          password: testUserPassword.toUpperCase()
        }).then(function(resUser) {
          expect("Should not be here").toBeFalsy();
        }).catch(function(resError) {
          expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified password is incorrect."));

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        });
      });
    });

    it("Logging in returns correct user payload", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        auth.login("password", {
          email: testUserEmail,
          password: testUserPassword
        }).then(function(resUser) {
          validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ false);

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        }).catch(function(resError) {
          expect("Should not be here").toBeFalsy();
        });
      });
    });

    it("Logging in works even if email has wrong case", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        auth.login("password", {
          email: testUserEmail.toUpperCase(),
          password: testUserPassword
        }).then(function(resUser) {
          validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ false);

          // Set the created test user to be deleted after this test
          passwordToDeleteCreatedTestUser = testUserPassword;

          done();
        }).catch(function(resError) {
          expect("Should not be here").toBeFalsy();
        });
      });
    });

    it("Logging in with old, incorrect password throws error", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        auth.changePassword(testUserEmail, testUserPassword, testUserNewPassword, function(resError2) {
          expect(resError2).toBeNull();

          auth.login("password", {
            email: testUserEmail,
            password: testUserPassword
          }).then(function(resUser) {
            expect("Should not be here").toBeFalsy();
          }).catch(function(resError) {
            expect(resError).toEqual(new Error("FirebaseSimpleLogin: The specified password is incorrect."));

            // Set the created test user to be deleted after this test
            passwordToDeleteCreatedTestUser = testUserNewPassword;

            done();
          });
        });
      });
    });

    it("Logging in with new, changed password does not throw error", function(done) {
      auth.createUser(testUserEmail, testUserPassword, function(resError, resUser) {
        auth.changePassword(testUserEmail, testUserPassword, testUserNewPassword, function(resError2) {
          expect(resError2).toBeNull();

          auth.login("password", {
            email: testUserEmail,
            password: testUserNewPassword
          }).then(function(resUser) {
            validateEmailPasswordAuthUserPayload(resUser, /* expectUserProperty */ false);

            // Set the created test user to be deleted after this test
            passwordToDeleteCreatedTestUser = testUserNewPassword;

            done();
          }).catch(function(resError) {
            expect("Should not be here").toBeFalsy();
          });
        });
      });
    });

  });

});