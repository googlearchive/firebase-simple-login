# Firebase Simple Login - Android

Firebase Simple Login is a library that allows authentication using only client-side code. Easily authenticate users via email and password or through a number of third-party providers such as Facebook, Twitter, GitHub, and Google.


## Overview

When a client initially connects to Firebase, it is anonymous and is granted a default set of permissions as specified in our Security Rules. To grant a client a different set of permissions, we must authenticate it.

Firebase can manage authentication for us, using the Simple Login service. Firebase can authenticate users using social login providers such as Facebook, Google, Twitter and GitHub or manage user registration using email and password login. If we don't want to require a user to log in but want to have some concept of an individual user for our security rules, we can use anonymous authentication. If we have our own server and and want integrate existing authentication mechanisms with Firebase; we can generate the auth tokens using Custom Login.


## Installing

To use Simple Login in your Android or Java application you can download the latest Simple Login library or install it as a Gradle or Maven dependency in your project.

### Download and Install

You can grab the latest Simple Login Java library here:
[Download Firebase Simple Login Android/Java Library](https://cdn.firebase.com/java/firebase-simple-login-1.4.2.jar)

After downloading the JAR, place it on your application's classpath. Typically, this is in your `libs` folder. Depending on your IDE, you may need to explicitly add the library to your project as a dependency.

### Using Gradle or Maven

We publish builds of the Simple Login library to the Maven central repository. To install the library inside Android Studio, you can simply declare it as dependency in your `build.gradle` file:

```
dependencies {
    compile 'com.firebase:firebase-simple-login:1.4.2+'
}
```

If you use Maven to build your application, you can add the following dependency to your pom.xml:

```
<dependency>
  <groupId>com.firebase</groupId>
  <artifactId>firebase-simple-login</artifactId>
  <version>[1.4.2,)</version>
</dependency>
```


## Authentication Providers

Select a authentication provider for specific installation and configuration information.

TODO: links

| Platform | Description |
| --- | --- |
| Email & Password | Integrate Email & Password authentication in your app. |
| Custom | Integrate Custom authentication in your app. |
| Anonymous | Integrate Anonymous authentication in your app. |
| Facebook | Integrate Facebook authentication in your app. |
| Twitter | Integrate Twitter authentication in your app. |
| Google |Integrate Google authentication in your app. |


## Enable Providers

Before writing any login code we need to select which providers to authenticate our users with. We do this in the [Account Dashboard](https://www.firebase.com/account/). Select the Firebase to enable Simple Login with, choose the __Simple Login__ tab and find the __Authentication Providers__ section. There we can select a tab for a provider and enable authentication.


## Monitoring Authentication

To initialize Simple Login we need to create an instance of `SimpleLogin`. This object takes in a Firebase reference and an Android context if we're writing an Android app. Once we have a `SimpleLogin` object, we can check the user's current authentication status.

```java
Firebase myRef = new Firebase("https://<your-firebase>.firebaseio.com");
SimpleLogin authClient = new SimpleLogin(myRef, getApplicationContex());
authClient.checkAuthStatus(new SimpleLoginAuthenticatedHandler() {
    @Override
    public void authenticated(FirebaseSimpleLoginError error, FirebaseSimpleLoginUser user) {
        if (error != null) {
            // Oh no! There was an error performing the check
        } else if (user == null) {
            // No user is logged in
        } else {
            // There is a logged in user
        }
    }
});
```

In addition, you can monitor the user's authentication state with respect to your Firebase by observing events at a special location in our Firebase: `.info/authenticated`:

```java
Firebase authRef = myRef.getRoot().child(".info/authenticated");
authRef.addValueEventListener(new ValueEventListener() {
    @Override
    public void onDataChange(DataSnapshot snapshot) {
        boolean isAuthenticated = snapshot.getValue(Boolean.class);
    }
});
```


## Logging Users In

To log in a user, we call a login method specific to each provider.

The callback that we specified above will be invoked with the result of this login attempt, including a user object on success, or an error otherwise. Select the provider in the Authentication Providers section above for specific configuration, setup and login information.


## Logging Users Out

The tokens issued to the logged in users are valid for 30 days by default. This value can be changed by going to the Simple Login tab in your account dashboard. Calling `logout()` invalidates the user's token and logs them out of your application:

```java
authClient.logout();
```

The logout process is asynchronous so we'll want to observe the `.info/authenticated` location as in the example above to be notified when the logout process has completed.


## Storing User Data

Internally, Simple Login generates JWT auth tokens after authenticating against the appropriate provider. It then calls `Firebase.auth()` with those tokens. It does not store profile or state information in Firebase. In order to persist user data we'll have to save it to our Firebase.

In the sample below we are saving a user when they log in through Simple Login:

```java
// we would probably save a profile when we register new users on our site
// we could also read the profile to see if it's null
// here we will just simulate this with an isNewUser boolean
final boolean isNewUser = true;
final Firebase myRef = new Firebase("https://<your-firebase>.firebaseio.com");
SimpleLogin authClient = new SimpleLogin(myRef, getApplicationContext());
authClient.checkAuthStatus(new SimpleLoginAuthenticatedHandler() {
    @Override
    public void authenticated(FirebaseSimpleLoginError error, FirebaseSimpleLoginUser user) {
        if (isNewUser) {
            Map<String, String> map = new HashMap<String, String>();
            map.put("email", user.getEmail());
            map.put("provider", user.getProvider().name());
            map.put("provider_id", user.getUserId());
            myRef.child("users").child(user.getUid()).setValue(map);
        }
    }
});
```

When a user is saved using the above code, our structure will resemble something like this:

```json
{
  "users": {
    "simplelogin:1": {
      "email": "alanisawesome@firebase.com",
      "provider": "password",
      "provider_id": "1"
    },
    "simplelogin:2": {
      "email": "gracehop@firebase.com",
      "provider": "password",
      "provider_id": "2"
    }
  }
}
```

Since the user's `uid` property is unique, it will serve as an appropriate key for storing users.


## Handling Errors

The listener we specified in our `SimpleLogin.checkAuthStatus()` is notified any time the user's authentication state has changed, or an error has occurred in the authentication process. In some cases we may want to explicitly check for specific errors so that we an update our messaging to the user, or prompt them to login again.

For example, if we're using email / password authentication we would want to check for an invalid email and an invalid password:

```java
Firebase myRef = new Firebase("https://<your-firebase>.firebaseio.com");
authClient.checkAuthStatus(new SimpleLoginAuthenticatedHandler() {
    @Override
    public void authenticated(FirebaseSimpleLoginError error, FirebaseSimpleLoginUser user) {
        if(error != null) {
            switch (error.getCode()) {
                case InvalidEmail:
                    //handle an invalid email
                    break;
                case InvalidPassword:
                    //handle an invalid password
                    break;
                default:
                    //handle other errors
            }
        } else if(user != null) {
            // user authenticated with Firebase
        } else {
            // user is logged out
        }
    }
});
```


## Full Error Listing

| Error Code | Description |
| --- | --- |
| AUTHENTICATION_DISABLED | The specified authentication type is not enabled for this Firebase. |
| EMAIL_TAKEN | Email/password auth: The specified email address is already in use. |
| INVALID_EMAIL | Email/password auth: The specified email address is incorrect. |
| INVALID_FIREBASE | Invalid Firebase specified. |
| INVALID_ORIGIN | Unauthorized request origin. This most likely means we need to add the domain to our whitelist. |
| INVALID_PASSWORD | Email/password auth: The specified password is incorrect. |
| INVALID_USER | Email/password auth: The specified user does not exist. |
| UNKNOWN_ERROR | An unknown error occurred. Please contact support@firebase.com. |
| USER_DENIED | User denied authentication request. This error can be triggered by the user closing the OAuth popup or canceling the authentication request. |
