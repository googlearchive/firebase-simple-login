# Firebase Simple Login - Web

Firebase Simple Login is a library that allows authentication using only client-side code. Easily authenticate users via email and password or through a number of third-party providers such as Facebook, Twitter, GitHub, and Google.


## Overview

When a client initially connects to Firebase, it is anonymous and is granted a default set of permissions as specified in our Security Rules. To grant a client a different set of permissions, we must authenticate it.

Firebase can manage authentication for us, using the Simple Login service. Firebase can authenticate users using social login providers such as Facebook, Google, Twitter and GitHub or manage user registration using email and password login. If we don't want to require a user to log in but want to have some concept of an individual user for our security rules, we can use anonymous authentication. If we have our own server and and want integrate existing authentication mechanisms with Firebase; we can generate the auth tokens using Custom Login.


## Installing

To install Firebase Simple Login we'll need to include the referencing script:

```javascript
<script src="https://cdn.firebase.com/js/simple-login/1.6.4/firebase-simple-login.js"></script>
```

## API Reference

[You can find a full API reference here.](./api.md)


## Authentication Providers

Select a authentication provider for specific installation and configuration information.

| Platform | Description |
| --- | --- |
| [Email & Password](./providers/password.md) | Integrate Email & Password authentication in your app. |
| [Custom](./providers/custom.md) | Integrate Custom authentication in your app. |
| [Anonymous](./providers/anonymous.md) | Integrate Anonymous authentication in your app. |
| [Facebook](./providers/facebook.md) | Integrate Facebook authentication in your app. |
| [Twitter](./providers/twitter.md) | Integrate Twitter authentication in your app. |
| [GitHub](./providers/github.md) | Integrate GitHub authentication in your app. |
| [Google](./providers/google.md) | Integrate Google authentication in your app. |


## Configuring Simple Login

Only domains that you whitelist are allowed to make requests to Firebase Simple Login for your application. For testing purposes, all Firebases have `localhost` and `127.0.0.1` enabled by default. Add more to enable access from domains where your application is hosted.

In the dashboard we can navigate to the __Simple Login__ tab. From here we need to include all of the domains that will access our app. If we're just testing, `localhost` and `127.0.0.1` will work for now.

### Enabling providers

Before we can write any login code we need to select which providers we want to authenticate with.

In the __Simple Login__ tab go down to the __Authentication Providers__ section. There we can select a tab for a provider and enable authentication.


## Monitoring Authentication

To initialize Simple Login we need to create a `FirebaseSimpleLogin` object. This object takes in a `Firebase` reference and a callback function. The callback is triggered any time that the user's authentication state is changed.

```javascript
var myRef = new Firebase("https://<your-firebase>.firebaseio.com");
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) {
  if (error) {
    // an error occurred while attempting login
    console.log(error);
  } else if (user) {
    // user authenticated with Firebase
    console.log("User ID: " + user.uid + ", Provider: " + user.provider);
  } else {
    // user is logged out
  }
});
```

In addition to using the `FirebaseSimpleLogin` object, we can also use the Firebase API to monitor a user's authentication status. By attaching an event listener on the location `/.info/authenticated` we'll be able to observe any changes to a user's authentication status.

```javascript
var authRef = new Firebase("https://<your-firebase>.firebaseio.com/.info/authenticated");
authRef.on("value", function(snap) {
  if (snap.val() === true) {
    alert("authenticated");
  } else {
    alert("not authenticated");
  }
});
```


## Logging Users In

To log in a user, we call the `login()` function. This function takes a string parameter that represents the provider we'll be logging the user in with:

```javascript
authClient.login("<provider>"); // this could be "facebook", "twitter", "password", etc...
```

The callback that we specified will be invoked with the result of this login attempt, including a user object on success, or an error otherwise. Select the provider in the [Authentication Providers](#authentication-providers) section above for specific configuration, setup and login information.


## Logging Users Out

The tokens issued to the logged in users are valid for 30 days by default. This value can be changed by going to the Simple Login tab in your account dashboard. Calling `logout()` invalidates the user's token and logs them out of your application:

```javascript
authClient.logout();
```


## Storing User Data

Internally, Simple Login generates JWT auth tokens after authenticating against the appropriate provider. It then calls `Firebase.auth()` with those tokens. It does not store profile or state information in Firebase. In order to persist user data we'll have to save it to our Firebase.

In the sample below we are saving a user when they log in through Simple Login:

```javascript
// we would probably save a profile when we register new users on our site
// we could also read the profile to see if it's null
// here we will just simulate this with an isNewUser boolean
var isNewUser = true;
var myRef = new Firebase("https://<your-firebase>.firebaseio.com");
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) {
  if (error) { ... }
  else if (user) {
    if( isNewUser ) {
      // save new user's profile into Firebase so we can
      // list users, use them in security rules, and show profiles
      myRef.child('users').child(user.uid).set({
        displayName: user.displayName,
        provider: user.provider,
        provider_id: user.id
      });
    }
  }
  else { ... }
}
```

When a user is saved using the above code, our structure will resemble something like this:

```json
{
  "users": {
    "simplelogin:1": {
      "displayName": "alanisawesome",
      "provider": "password",
      "provider_id": "1"
    },
    "simplelogin:2": {
      "displayName": "gracehop",
      "provider": "password",
      "provider_id": "2"
    }
  }
}
```

Since the user's `uid` property is unique, it will serve as an appropriate key for storing users.


##Dealing with Popups

Third-party authentication methods use a browser pop-up window to prompt the user to sign-in, approve the application, and return the user's data to the requesting application. Most modern browsers will block the opening of this pop-up window unless it was invoked by direct user action. __Therefore, we should only invoke the `login()` function for third-party authentication upon the user's click.__


### Firefeed

For a robust example of Firebase Simple Login in a production environment, showcasing both third-party authentication as well as manual token persistence, see the [Firefeed repository on Github](https://github.com/firebase/firefeed).


## Handling Errors

In Firebase Simple Login, the callback we specified when creating the `FirebaseSimpleLogin` object is called any time the user's authentication state has changed, or an error has occurred in the authentication process.

In some cases we may want to explicitly check for specific errors so that we can update our messaging to the user, or prompt them to login again.

### Error Format

All errors are JSON objects containing at least a code and message attributes. In some cases, additional information will be provided. For example:

```javascript
{
  code: 'INVALID_PASSWORD',
  message: 'The specified password is incorrect.'
}
```

### Checking Specific Errors

Rather than handling for every possible error that could happen, it's best to just handle a specific subset. See the [next section](#full-error-listing) for the full error listing.

For example, if we're using email / password authentication we would want to check for an invalid email and an invalid password.

```javascript
var myRef = new Firebase("https://<your-firebase>.firebaseio.com");
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) {
  if (error) {
    // an error occurred while attempting login
    switch(error.code) {
      case "INVALID_EMAIL":
      // handle an invalid email
      case "INVALID_PASSWORD":
      // handle an invalid password
      default:
    }
  } else if (user) {
    // user authenticated with Firebase
    console.log("User ID: " + user.uid + ", Provider: " + user.provider);
  } else {
    // user is logged out
  }
});
```


## Authentication Sample App

[This interactive demo](http://jsfiddle.net/firebase/wPBj5/embedded/result,js/) demonstrates registration and login. Once the user is logged in, we save that user information to a users location in our Firebase and take them to a screen showing all the registered users in the system.


## Full Error Listing

| Error Code | Description |
| --- | --- | --- |
| AUTHENTICATION_DISABLED | The specified authentication type is not enabled for this Firebase. |
| EMAIL_TAKEN | Email/password auth: The specified email address is already in use. |
| INVALID_EMAIL | Email/password auth: The specified email address is incorrect. |
| INVALID_FIREBASE | Invalid Firebase specified. |
| INVALID_ORIGIN | Unauthorized request origin. This most likely means we need to add the domain to our whitelist. |
| INVALID_PASSWORD | Email/password auth: The specified password is incorrect. |
| INVALID_USER | Email/password auth: The specified user does not exist. |
| UNKNOWN_ERROR | An unknown error occurred. Please contact support@firebase.com. |
| USER_DENIED | User denied authentication request. This error can be triggered by the user closing the OAuth popup or canceling the authentication request. |


## API Reference

[You can find a full API reference here.](./api.md)
