# Custom Authentication - iOS

Firebase gives you complete control over user authentication by allowing you to authenticate users using secure JSON Web Tokens (JWTs). This method of authentication is useful in cases where you are already managing user accounts on your server or where you have more advanced authentication needs.


## Generating a Secure Token

To authenticate a user using Custom Login, we must provide each client with a secure JWT that has been generated on a server. We provide [several helper libraries](#helper-libraries) for generating JWTs. Use the Firebase Secret to generate these tokens, this can be found by logging into the Firebase account and clicking on the Security tab in the Firebase Dashboard.

Firebase JWTs should always be generated on a trusted server so that the Firebase Secret which is needed to generate them can be kept private. Here are some examples of generating JWTs on a server using JavaScript and Java:

__JavaScript:__
```javascript
// Generate a new secure JWT
var FirebaseTokenGenerator = require("firebase-token-generator");
var tokenGenerator = new FirebaseTokenGenerator(YOUR_FIREBASE_SECRET);
var token = tokenGenerator.createToken({uid: "1", some: "arbitrary", data: "here"});
```

__Java:__
```java
// Generate a new secure JWT
Map<String, Object> payload = new HashMap<String, Object>();
payload.put("uid", "1");
payload.put("some", "arbitrary");
payload.put("data", "here");

TokenGenerator tokenGenerator = new TokenGenerator(YOUR_FIREBASE_SECRET);
String token = tokenGenerator.createToken(payload);

System.out.println(token);
```

When authenticating with a secure JWT, the data encoded in the token will be accessible in the [Security Rules](https://www.firebase.com/docs/web/guide/securing-data.html) as the [`auth` variable](TODO). This allows rules to be written which grant access based on the data within the token.

By default, authentication tokens expire 24 hours after they are issued and the client will automatically be unauthenticated at that time. We can override this by changing the Session Length setting on the Login & Auth tab of the Firebase's dashboard, or individually when creating the token by providing a specific expiration date (for details, see the docs for the specific token generator you're using).

To handle token expiration gracefully, the authentication function in the client library for each platform (JS, Obj-C, Java) allows us to set a cancel callback that is triggered when a token expires. The authentication function's success callback will provide authentication info. Using this, we can tell in advance when the token will expire.

### Token Restrictions

The token payload can contain any data of your choosing, however it must contain a `"uid"` key, which must be a string of less than 256 characters.  The generated token must be less than 1024 characters in total.


## Authenticating Clients

Once we've generated a secure JWT, we can use any Firebase reference to authenticate. The following examples show authentication methods in JavaScript and Java:

__JavaScript:__
```javascript
var dataRef = new Firebase("https://<YOUR-FIREBASE>.firebaseio.com/");
// Log me in.
dataRef.auth(AUTH_TOKEN, function(error) {
  if(error) {
    console.log("Login Failed!", error);
  } else {
    console.log("Login Succeeded!");
  }
});
```

__Java:__
```java
Firebase dataRef = new Firebase("https://<YOUR-FIREBASE>.firebaseio.com/");
// Log me in.
dataRef.auth(AUTH_TOKEN, new Firebase.AuthListener() {

    @Override
    public void onAuthError(FirebaseError error) {
        System.err.println("Login Failed! " + error.getMessage());
    }

    @Override
    public void onAuthSuccess(Object authData) {
        System.out.println("Login Succeeded!");
    }

    @Override
    public void onAuthRevoked(FirebaseError error) {
        System.err.println("Authenticcation status was cancelled! " + error.getMessage());
    }

});
```

Calling an authentication method on any Firebase reference will authenticate to the entire Firebase. __If our app loses its internet connection, Firebase will automatically handle re-authenticating to the server when it reconnects.__ If we need to change a client's credentials (for example, when a user logs in to a different account), simply re-authenticate with a new token.

It is not possible to authenticate with multiple credentials to the same Firebase simultaneously, even if we call `auth()` on different Firebase references. Authentication state is global and applies to all references to the Firebase. However, it is possible to create references to two or more different Firebases and authenticate to those independently.

To unauthenticate a client, use the `unauth()` method which is shown in JavaScript below:

```
dataRef.unauth();
```


## Authenticating a Server

If we're are running a trusted server that is connecting to Firebase, we can authenticate it in several ways:

* __Using a Firebase Secret:__ All authentication methods can accept a Firebase Secret instead of a JWT token. This will grant the server complete read and write access to the entire Firebase. This access will never expire unless it is revoked from the Firebase Dashboard.

* __Using a secure JWT with the optional admin claim set to true:__ This method will grant a server complete read and write access to the entire Firebase. This token will expire normally, so it is important to set the expiration times accordingly.

* __Using a secure JWT designed to give access to only the pieces of data a server needs to touch:__ This method is more complicated, but it is the safest way to authenticate a server, as it lets the [Security Rules](https://www.firebase.com/docs/web/guide/securing-data.html) prevent the server from doing anything it's not supposed to, even if it becomes compromised in some way.


## Generating a Secure Token Without a Helper Library

Firebase JWTs can also be generated with any existing JWT generation library then signed by a SHA-256 HMAC signature. When using an existing library, a Firebase authentication token must contain the following claims:

| Claim | Description |
| --- | --- |
| v | The version of the token. Set this to the number 0. |
| iat | The "issued at" date as a number of seconds since the epoch. |
| d | The authentication data. This is the payload of the token that will become visible as the auth variable in the Security Rules. |

The following claims are optional when using an authentication token:

| Claim | Description |
| --- | --- |
| nbf | The token "not before" date as a number of seconds since the epoch. If specified, the token will not be considered valid until after this date. |
| exp | The token expiration date as a number of seconds since the epoch. If not specified, by default the token will expire 24 hours after the "issued at" date (iat). |
| admin | Set to true to make this an "admin" token, which grants full read/write access to all data. |
| debug | Set to true to enable debug mode, which provides verbose error messages when Security Rules fail. |


## Helper Libraries

We support the following token generator helper libraries:
* [Java](https://github.com/firebase/firebase-token-generator-java)
* [.NET](https://github.com/firebase/firebase-token-generator-dotNet)
* [Node.js](https://github.com/firebase/firebase-token-generator-node)
* [Perl](https://metacpan.org/module/Firebase::Auth) (Unofficial)
* [PHP](https://github.com/firebase/firebase-token-generator-php)
* [Python](https://github.com/firebase/firebase-token-generator-python)
* [Ruby](https://github.com/firebase/firebase-token-generator-ruby)
