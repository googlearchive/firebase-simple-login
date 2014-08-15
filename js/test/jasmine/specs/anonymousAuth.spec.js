describe("Anonymous Authentication Tests:", function() {

  beforeEach(function() {
    // Add custom Jamine matchers
    jasmine.addMatchers(customMatchers);
  });

  /* Validates that the anonymous auth user variable contains the correct payload */
  var validateAnonymousAuthUserPayload = function(user) {
    expect(user).not.toBeNull();
    expect(user).toOnlyHaveTheseKeys([
      "id",
      "uid",
      "provider",
      "firebaseAuthToken"
    ]);

    expect(typeof user.id).toBe("string");
    expect(user.uid).toBe(user.provider + ":" + user.id);
    expect(user.provider).toBe("anonymous");
    expect(typeof user.firebaseAuthToken).toBe("string");
  };

  it("Logging in returns correct user payload", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var auth = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        // Log in anonymously
        auth.login("anonymous");
      }
      else if (status !== "done") {
        expect(authError).toBeNull();
        validateAnonymousAuthUserPayload(authUser);

        auth.logout();

        status = "done";
        done();
      }
    });
    auth.setApiHost(TEST_AUTH_SERVER);
    auth.logout();
  });

  it("Logging in returns correct user payload [promisified]", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var auth = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        // Log in anonymously
        auth.login("anonymous").then(function(resUser) {
          validateAnonymousAuthUserPayload(resUser);

          auth.logout();

          status = "done";
          done();
        }, function(resError) {
          expect(true).toBeFalsy();
        });
      }
    });
    auth.setApiHost(TEST_AUTH_SERVER);
    auth.logout();
  });

});