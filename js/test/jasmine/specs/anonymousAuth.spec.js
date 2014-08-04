describe("Anonymous Authentication Tests:", function() {

  it("Anonymous authentication works", function(done) {
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

  it("Anonymous authentication works [promisified]", function(done) {
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