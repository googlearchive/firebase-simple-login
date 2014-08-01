describe("Email/password Authentication Tests:", function() {

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