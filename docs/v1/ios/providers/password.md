# Authenticating Users with Email & Password - iOS

Firebase Simple Login provides an easy way to integrate email and password authentication in your app. Firebase automatically stores your users' credentials securely (using bcrypt) and redundantly (daily off-site backups).

This separates sensitive user credentials from your application data, and lets you focus on the user interface and experience for your app.


## Creating User Accounts

Firebase Simple Login provides a number of methods for account creation and management.

To create a new user account, use the following snippet:

__Objective-C:__
```objc
FirebaseSimpleLogin* authClient = [[FirebaseSimpleLogin alloc] initWithRef:myRef];
[authClient createUserWithEmail:@"email@domain.com" password:@"very secret"
    andCompletionBlock:^(NSError* error, FAUser* user) {
    if (error != nil) {
        // There was an error creating the account
    } else {
        // We created a new user account
    }
}];
```

__Swift:__
```swift
var authClient = FirebaseSimpleLogin(ref:myRef)
authClient.createUserWithEmail("email@domain.com", password: "very secret",
    andCompletionBlock: { error, user in

    if error {
        // There was an error creating the account
    } else {
        // We created a new user account
    }
})
```

Note that creating an account will not log that new account in.


## Logging Users In

Once an account has been created, you can log a user in to that account like so:

__Objective-C:__
```objc
FirebaseSimpleLogin* authClient = [[FirebaseSimpleLogin alloc] initWithRef:myRef];
[authClient loginWithEmail:@"email@domain.com" andPassword:@"very secret"
    withCompletionBlock:^(NSError* error, FAUser* user) {
    if (error != nil) {
        // There was an error logging in to this account
    } else {
        // We are now logged in
    }
}];
```

__Swift:__
```swift
var authClient = FirebaseSimpleLogin(ref:myRef)
authClient.loginWithEmail("email@domain.com", andPassword: "very secret",
    withCompletionBlock: { error, user in

    if error {
        // There was an error logging in to this account
    } else {
        // We are now logged in
    }
})
```

The `FAUser` instance will contain some basic metadata about the user account, including the email that was used to create the account.


## After Authenticating

Now that the client is logged in, your [Security Rules](https://www.firebase.com/docs/ios/guide/securing-data.html) will have access to their verified User ID. Specifically, the [`auth` variable](TODO) will contain the following values:

| Field | Description | Type |
| --- | --- | --- |
| email | The user's email address. | String |
| id | The user's auto-incrementing id for your Firebase. | String |
| provider | The authentication method used, in this case: 'password'. | String |
| uid | A unique id combining the prefix 'simplelogin' and id, intended as the unique key for user data (will have the format 'simplelogin:<id>'). | String |


## Changing Passwords

You can change the password for a user using the email address and current password as shown:

__Objective-C:__
```objc
FirebaseSimpleLogin* authClient = [[FirebaseSimpleLogin alloc] initWithRef:myRef];
[authClient changePasswordForEmail:@"email@domain.com" oldPassword:@"very secret"
    newPassword:@"very very secret" completionBlock:^(NSError* error, BOOL success) {

    if (error != nil) {
        // There was an error processing the request
    } else if (success) {
        // Password changed successfully
    }
}];
```

__Swift:__
```swift
var authClient = FirebaseSimpleLogin(ref:myRef)
authClient.changePasswordForEmail("email@domain.com", oldPassword: "very secret",
    newPassword: "very very secret", completionBlock: { error, success in

    if error {
        // There was an error processing the request
    } else if success {
        // Password changed successfully
    }
})
```


## Sending Password Reset Emails

You can send the user a password reset email using the email address for that account:

__Objective-C:__
```objc
FirebaseSimpleLogin* authClient = [[FirebaseSimpleLogin alloc] initWithRef:myRef];
[authClient sendPasswordResetForEmail:@"email@domain.com"
    andCompletionBlock:^(NSError* error, BOOL success) {

    if (error != nil) {
        // There was an error processing the request
    } else if (success) {
        // Password reset email sent successfully
    }
}];
```

__Swift:__
```swift
var authClient = FirebaseSimpleLogin(ref:myRef)
authClient.sendPasswordResetForEmail("email@domain.com",
    andCompletionBlock: { error, success in

    if error {
        // There was an error processing the request
    } else if success {
        // Password reset email sent successfully
    }
})
```


## Deleting Users

You can delete a user using their email address and password as shown below:

__Objective-C:__
```objc
FirebaseSimpleLogin* authClient = [[FirebaseSimpleLogin alloc] initWithRef:myRef];
[authClient removeUserWithEmail:@"email@domain.com" password:@"very secret"
    andCompletionBlock:^(NSError* error, BOOL success) {

    if (error != nil) {
        // There was an error processing the request
    } else if (success) {
        // User deleted successfully
    }
}];
```

__Swift:__
```swift
var authClient = FirebaseSimpleLogin(ref:myRef)
authClient.removeUserWithEmail("email@domain.com", password: "very secret",
    andCompletionBlock: { error, success in

    if error {
        // There was an error processing the request
    } else if success {
        // User deleted successfully
    }
})
```
