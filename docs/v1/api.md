# API Reference - Web

A `FirebaseSimpleLogin` object is used to manage user login to a Firebase. Note that you must include the Simple Login JavaScript library in your application to use these features. Read the Simple Login section of the web guide to get started.


## Methods

[new FirebaseSimpleLogin(ref, callback, [context])](#new-firebasesimpleloginref-callback-context)

[login(provider, [options])](#loginprovider-options)

[logout()](#logout)

[createUser(email, password, [callback])](#createuseremail-password-callback)

[changePassword(email, oldPassword, newPassword, [callback])](#changepasswordemail-oldpassword-newpassword-callback)

[sendPasswordResetEmail(email, [callback])](#sendpasswordresetemailemail-callback)

[removeUser(email, password, [callback])](#removeuseremail-password-callback)


## new FirebaseSimpleLogin(ref, callback, [context])

Creates a new login object for the specified Firebase reference. The specified callback will be called once with the user's initial login state and again anytime the user's login state changes.

### Arguments

#### `ref` Firebase

The Firebase reference to which the user should be authenticated.

#### `callback` Function

A callback function that will be called when authentication has completed. On failure, the first argument will be an Error object. On success, the first argument will be null, and the second will be an object containing information about the user that has just logged in.

#### `context` Object _(optional)_

An object passed as a context will become this when the callback is called.

### Return Value

#### `FirebaseSimpleLogin`

A `FirebaseSimpleLogin` object that can be used to manage the user's login state.

### Code Sample

```javascript
// Print the current login state whenever it changes
var ref = new Firebase("https://<YOUR-FIREBASE>.firebaseio.com");
var authClient = new FirebaseSimpleLogin(ref, function(error, user) {
  if (error !== null) {
    console.log("Error authenticating:", error);
  } else if (user !== null) {
    console.log("User is logged in:", user);
  } else {
    console.log("User is logged out");
  }
});
```


## login(provider, [options])

Initiates a user login for the specified provider.

### Arguments

#### `provider` String

The login provider to use (i.e. "facebook", "password", etc.).

#### `options` Object _(optional)_

An options dictionary containing additional arguments needed for login, such as an email, password, or rememberMe.

### Return Value

No return value.

### Notes

Read the [Simple Login guide](./README.md) for a complete list of supported authentication methods. After login an `auth` variable will be accessible from your Firebase [Security Rules](https://www.firebase.com/docs/web/guide/securing-data.html). Security rules allow you to control what actions each user is allowed to make on your Firebase.

### Code Samples

```javascript
// Log a user in using Facebook authentication with the public profile and friends permissions
auth.login("facebook", {
  scope: "public_profile, user_friends"
});
```

```javascript
// Log a user in using email/password authentication
auth.login("password", {
  email: "me@here.com",
  password: "mypassword",
  rememberMe: true
});
```


## logout()

Logs a user out.

### Return Value

No return value.

### Code Sample

```javascript
auth.logout();
```


## createUser(email, password, [callback])

Creates a new account for the specified email address. Note that this function does not log the user in automatically; you must call `login()` after account creation completes.

### Arguments

#### `email` String

The user's email address.

#### `password` String

The password to set for this user.

#### `callback` Function __(optional)__

A callback that is fired after account creation completes. The callback will take two arguments: an `error` and an object containing user data. The `error` will be `null` on success, and the user data will be `null` on failure.

### Return Value

No return value.

### Code Sample

```javascript
auth.createUser(email, password, function(error, user) {
  if (error === null) {
    console.log("User created successfully:", user);
  } else {
    console.log("Error creating user:", error);
  }
});
```


## changePassword(email, oldPassword, newPassword, [callback])

Changes the password for the email / password account specified.

### Arguments

#### `email` String

The email address of the account to modify.

#### `oldPassword` String

The account's current password.

#### `newPassword` String

The new password to set for the account.

#### `callback` Function __(optional)__

A callback to be triggered after the password change completes. The callback will take a single `error` argument which will be an `Error` object upon failure and `null` upon success.

### Return Value

No return value.

### Code Sample

```javascript
auth.changePassword(email, oldPassword, newPassword, function(error) {
  if (error === null) {
    console.log("Password changed successfully");
  } else {
    console.log("Error changing password:", error);
  }
});
```


## sendPasswordResetEmail(email, [callback])

Sends a password reset email to the owner of the email / password account specified. The password reset email will include a new, temporary password that the user may use to log into their account and update their credentials.

### Arguments

#### `email` String

The email address of the account to send an account recovery email.

#### `callback` Function _(optional)_

A callback to be triggered after the password reset email send completes. The callback will take a single `error` argument which will be an `Error` object upon failure and `null` upon success.

### Return Value

No return value.

### Code Sample

```javascript
auth.sendPasswordResetEmail(email, function(error) {
  if (error === null) {
    console.log("Password reset email sent successfully");
  } else {
    console.log("Error sending password reset email:", error);
  }
});
```


## removeUser(email, password, [callback])

Deletes the email / password user account specified.

### Arguments

#### `email` String

The email address of the account to delete.

#### `password` String

The account's current password.

#### `callback` Function _(optional)_

A callback to be triggered after the account deletion completes. The callback will take a single `error` argument which will be an `Error` object upon failure and `null` upon success.

### Return Value

No return value.

### Code Sample

```javascript
auth.removeUser(email, password, function(error) {
  if (error === null) {
    console.log("User removed successfully");
  } else {
    console.log("Error removing user:", error);
  }
});
```
