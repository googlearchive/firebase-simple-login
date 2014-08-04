describe("Firebase Simple Login Tests:", function() {

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
      authClient.login("nonexistentprovider");
    }).toThrow();





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