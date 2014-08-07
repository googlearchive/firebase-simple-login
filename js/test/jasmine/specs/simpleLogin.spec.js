describe("Firebase Simple Login Tests:", function() {

  xit("FirebaseSimpleLogin constructor throws error given invalid Firebase reference", function() {
    // TODO: add checking in client for invalid Firebase references
    // TODO: what if you send in a Firebase reference with a limit() attached?
    var invalidFirebaseRefs = [null, undefined, true, false, [], {}, function() {}, 0, 5, "", "test", {test:1}, ["test", 1]];

    invalidFirebaseRefs.forEach(function(invalidFirebaseRef) {
      expect(function() {
        new FirebaseSimpleLogin(invalidFirebaseRef, function() {});
      }).toThrow(new Error("new FirebaseSimpleLogin failed: First argument must be a valid Firebase reference."));
    });
  });

  it("FirebaseSimpleLogin constructor throws error given invalid callback function", function() {
    var invalidCallbacks = [null, undefined, true, false, [], {}, 0, 5, "", "test", {test:1}, ["test", 1]];

    // Get a valid Firebase refence
    var ctx = new Firebase.Context();
    var validFirebaseRef = new Firebase(TEST_NAMESPACE, ctx);

    invalidCallbacks.forEach(function(invalidCallback) {
      expect(function() {
        new FirebaseSimpleLogin(validFirebaseRef, invalidCallback);
      }).toThrow(new Error("new FirebaseSimpleLogin failed: Second argument must be a valid function."));
    });
  });

  xit("FirebaseSimpleLogin constructor properly uses third scope argument", function() {
    //TODO
  });

  it("login() throws an error given invalid provider", function() {
    var ctx = new Firebase.Context();
    var ref = new Firebase(TEST_NAMESPACE, ctx);
    var auth = new FirebaseSimpleLogin(ref, function(error, user) {});
    auth.setApiHost(TEST_AUTH_SERVER);

    expect(function() {
      auth.login("invalid");
    }).toThrow(new Error("FirebaseSimpleLogin.login(invalid) failed: unrecognized authentication provider"));
    // TODO: add period to this error message to be consistent with other error messages
  });

  xit("Logging users out works", function() {
    // TODO
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