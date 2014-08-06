describe("Anonymous Authentication Tests:", function() {

  beforeEach(function() {
    jasmine.addMatchers(customMatchers);
  });

  /* Validates that the anonymous auth user variable contains the correct payload */
  var validateAnonymousAuthUserPayload = function(user) {
    expect(user).not.toBeNull();
    expect(user).toOnlyHaveTheseKeys([
      "id",
      "uid",
      "provider",
      "displayName",
      "firebaseAuthToken"
    ]);

    expect(typeof user.id).toBe("string");
    expect(user.uid).toBe(user.provider + ":" + user.id);
    expect(user.provider).toBe("anonymous");
    expect(typeof user.firebaseAuthToken).toBe("string");

    // TODO: should anonymous auth even have a display name?
    expect(user.displayName).toBeDefined();
    // expect(user.displayName).toBe("");
  };

  it("Anonymous authentication returns correct user payload", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var authClient = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        // Log in anonymously
        authClient.login("anonymous");
      }
      else if (status !== "done") {
        expect(authError).toBeNull();
        validateAnonymousAuthUserPayload(authUser);
        status = "done";
        done();
      }
    });
    authClient.setApiHost(TEST_AUTH_SERVER);
    authClient.logout();
  });

  it("Anonymous authentication returns correct user payload [promisified]", function(done) {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);

    var status = "first";
    var authClient = new FirebaseSimpleLogin(ref, function(authError, authUser) {
      if (status === "first") {
        expect(authError).toBeNull();
        expect(authUser).toBeNull();

        status = "notFirst";

        // Log in anonymously
        authClient.login("anonymous").then(function(resUser) {
          validateAnonymousAuthUserPayload(resUser);

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

});