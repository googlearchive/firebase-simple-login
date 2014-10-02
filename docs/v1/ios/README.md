# Firebase Simple Login - iOS

Firebase Simple Login is a library that allows authentication using only client-side code. Easily authenticate users via email and password or through a number of third-party providers such as Facebook, Twitter, GitHub, and Google.


## Overview

When a client initially connects to Firebase, it is anonymous and is granted a default set of permissions as specified in our Security Rules. To grant a client a different set of permissions, we must authenticate it.

Firebase can manage authentication for us, using the Simple Login service. Firebase can authenticate users using social login providers such as Facebook, Google, Twitter and GitHub or manage user registration using email and password login. If we don't want to require a user to log in but want to have some concept of an individual user for our security rules, we can use anonymous authentication. If we have our own server and and want integrate existing authentication mechanisms with Firebase; we can generate the auth tokens using Custom Login.


## Installing

To install Firebase Simple Login we'll need to download the associated framework for iOS. You can [download the latest version right here](https://cdn.firebase.com/ios/FirebaseSimpleLogin.framework-1.3.4.zip). After the download completes, we'll include the framework in our project.

### Include dependencies

Firebase Simple Login depends on two other frameworks, __Accounts__ and __Social__. Add them to your project.


## Authentication Providers

Select a authentication provider for specific installation and configuration information.

| Platform | Description |
| --- | --- |
| [Email & Password](./providers/password.md) | Integrate Email & Password authentication in your app. |
| [Custom](./providers/custom.md) | Integrate Custom authentication in your app. |
| [Anonymous](./providers/anonymous.md) | Integrate Anonymous authentication in your app. |
| [Facebook](./providers/facebook.md) | Integrate Facebook authentication in your app. |
| [Twitter](./providers/twitter.md) | Integrate Twitter authentication in your app. |
| [Google](./providers/google.md) | Integrate Google authentication in your app. |


## Configuring Simple Login

Only domains that you whitelist are allowed to make requests to Firebase Simple Login for your application. For testing purposes, all Firebases have `localhost` and `127.0.0.1` enabled by default. Add more to enable access from domains where your application is hosted.

In the dashboard we can navigate to the Simple Login tab. From here we need to include all of the domains that will access our app. If we're just testing then `localhost` and `127.0.0.1` will work for now.


### Enabling providers

Before we can write any login code we need to select which providers we want to authenticate with.

In the __Simple Login__ tab go down to the __Authentication Providers__ section. There we can select a tab for a provider and enable authentication.


## Monitoring Authentication

To initialize Simple Login we need to instantiate a `FirebaseSimpleLogin` class. This class is initialized with a `Firebase` reference. We can then implement the `checkAuthStatusWithBlock` block to check whether or not we have a user. This block is triggered once asynchronously.

__Objective-C:__
```objc
Firebase* myRef = [[Firebase alloc] initWithUrl:@"https://<your-firebase>.firebaseio.com"];
FirebaseSimpleLogin* authClient = [[FirebaseSimpleLogin alloc] initWithRef:myRef];
[authClient checkAuthStatusWithBlock:^(NSError* error, FAUser* user) {
    if (error != nil) {
        // an error occurred while attempting login
        NSLog(@"%@", error);
    } else if (user == nil) {
        // No user is logged in
    } else {
        // user authenticated with Firebase
        NSLog(@"%@", user);
    }
}];
```

__Swift:__
```swift
var myRef = Firebase(url:"https://<your-firebase>.firebaseio.com")
var authClient = FirebaseSimpleLogin(ref:myRef)

authClient.checkAuthStatusWithBlock({ error, user in
    if error {
        // an error occurred while attempting to login
        println(error)
    } else if user == nil {
        // No user is logged in
    } else {
        println(user)
    }
})
```

In addition to using the Firebase Simple Login object, we can also use the Firebase API to monitor a user's authentication status. By attaching an event listener on the location `/.info/authenticated`, we'll be able to observe any changes to a user's authentication status.

__Objective-C:__
```objc
Firebase* authRef = [myRef.root childByAppendingPath:@".info/authenticated"];
[authRef observeEventType:FEventTypeValue withBlock:^(FDataSnapshot* snapshot) {
    BOOL isAuthenticated = [snapshot.value boolValue];
}];
```

__Swift:__
```swift
var authRef = myRef.root.childByAppendingPath(".info/authenticated")
authRef.observeEventType(.Value, withBlock: { snapshot in
    var isAuthenticated = snapshot.value as? Bool
})
```

To log in a user, we call a login method specific to each provider.

The callback that we specified above will be invoked with the result of this login attempt, including a user object on success, or an error otherwise. Select the provider in the [Authentication Providers](#authentication-providers) section above for specific configuration, setup and login information.


## Logging Users Out

The tokens issued to the logged in users are valid for 30 days by default. We can change this default value in the dashboard. Calling `logout` invalidates the user's token and logs them out of your application:

__Objective-C:__
```objc
[authClient logout]
```

__Swift:__
```objc
authClient.logout()
```


## Storing User Data

Internally, Simple Login generates JWT auth tokens after authenticating against the appropriate provider. It then calls `Firebase.auth()` with those tokens. It does not store profile or state information in Firebase. In order to persist user data we'll have to save it to our Firebase.

In the sample below we are saving a user when they log in through Simple Login:

__Objective-C:__
```objc
// we would probably save a profile when we register new users on our site
// we could also read the profile to see if it's null
// here we will just simulate this with an isNewUser boolean
BOOL isNewUser = false;
[authClient checkAuthStatusWithBlock:^(NSError* error, FAUser* user) {
    if (error != nil) {
        // Oh no! There was an error performing the check
    } else if (user == nil) {
        // No user is logged in
    } else {
        // save new user's profile into Firebase so we can
        // list users, use them in security rules, and show profiles
        if (isNewUser) {
            // save them to the users location
            NSDictionary *newUser = @{
                @"user_id": user.userId,
                @"provider": [[NSNumber alloc] initWithInt:user.provider],
                @"email": user.email
            };
            [[myRef childByAppendingPath:@"users"] setValue:user];
        }
    }
}];
```

__Swift:__
```swift
// we would probably save a profile when we register new users on our site
// we could also read the profile to see if it's null
// here we will just simulate this with an isNewUser boolean
var isNewUser = false
authClient.checkAuthStatusWithBlock({ error, user in
    if error {
        // Oh no! There was an error performing the check
        println(error)
    } else if user == nil {
        // No user is logged in
    } else {
        // save new user's profile into Firebase so we can
        // list users, use them in security rules, and show profiles
        if isNewUser {
            var newUser = [
                "user_id": user.userId,
                "provider": Int(user.provider.value),
                "email": user.email
            ]

            myRef.childByAppendingPath("users").setValue(user)
        }
    }
})
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


## Handling Errors

In Firebase Simple Login, the callback we specified when creating the `FirebaseSimpleLogin` object is called any time the user's authentication state has changed, or an error has occurred in the authentication process.

In some cases we may want to explicitly check for specific errors so that we an update our messaging to the user, or prompt them to login again.

### Error Format

All errors are of type `NSError` and have the `code` and `description` attributes.

### Checking Specific Errors

Rather than handling for every possible error that could happen, it's best to just handle a specific subset. See the [next section](#full-error-listing) for the full error listing.

For example, if we're using email / password authentication we would want to check for an invalid email and an invalid password.

__Objective-C:__
```objc
[authClient checkAuthStatusWithBlock:^(NSError* error, FAUser* user) {
    if (error != nil) {
        // an error occurred while attempting login
        switch(error.code) {
            case FAErrorInvalidEmail:
                // handle an invalid email
            case FAErrorInvalidPassword:
                // handle an invalid password
            default:
                break;
        }
    } else if (user == nil) {
        // No user is logged in
    } else {
        // User is logged in
    }
}];
```

__Swift:__
```swift
authClient.checkAuthStatusWithBlock({ error, user in
    if error {
        switch error.code {
        case Int(FAErrorInvalidEmail.value):
            // handle an invalid email
            break
        case Int(FAErrorInvalidPassword.value):
            // handle an invalid password
            break
        default:
            break
        }
    } else if user == nil {
        // No user is logged in
    } else {
        // User is logged in
    }
})
```


## Full Error Listing

| Error | Code | Description |
| --- | --- |
| FAErrorUserDoesNotExist | The specified account does not exist |
| FAErrorInvalidPassword | Email/password auth: An incorrect password was given |
| FAErrorAccessNotGranted | The user did not authorize the application. This error can be triggered by the user closing the OAuth popup or canceling the authentication request. |
| FAErrorAccountNotFound | The 3rd party account was not found |
FAErrorAuthenticationProviderNotEnabled The specified auth provider is not enabled for your Firebase. |
| FAErrorInvalidEmail | Email/password auth: The specified email is invalid. |
| FAErrorBadSystemToken | The cached system token for the auth provider is no longer valid. The user has most likely disabled the specified auth provider. |
| FAErrorUnknown | An unknown error occurred. |
