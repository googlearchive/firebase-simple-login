# Authenticating Users with Email & Password - Web

Firebase Simple Login provides an easy way to integrate email and password authentication in your app. Firebase automatically stores your users' credentials securely (using bcrypt) and redundantly (daily off-site backups).

This separates sensitive user credentials from your application data, and lets you focus on the user interface and experience for your app.


## Creating User Accounts

Firebase exposes a number of JavaScript convenience methods for account creation and management, letting you have full control over the interface for your application. Create new user accounts with the following snippet:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.createUser(email, password, function(error, user) {
  if (error === null) {
    console.log("User created successfully:", user);
  } else {
    console.log("Error creating user:", error);
  }
});
```

Creating an account will not log that new account in.


## Logging Users In

Once an account has been created, if your user does not have an existing session, you can log a user in with the following snippet:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.login('password', {
  email: '<email@domain.com>',
  password: '<password>'
});
```


###  Optional Settings

| Name | Description | Type |
| --- | --- | --- |
| rememberMe | Override default session length (browser session) to be 30 days. | Boolean |

Here is an example where the session will be stored for 30 days.

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.login('password', {
  email: '<email@domain.com>',
  password: '<password>',
  rememberMe: true
});
```


## After Authenticating

Now that the client is logged in, your [Security Rules](https://www.firebase.com/docs/web/guide/securing-data.html) will have access to their unique user id. Specifically, the `auth` variable will contain the following values:

| Field | Description | Type |
| --- | --- | --- |
| email | The user's email address. | String |
| id | The user's auto-incrementing id for your Firebase. | String |
| provider | The authentication method used, in this case: `password`. | String |
| uid | A unique id combining the prefix 'simplelogin' and id, intended as the unique key for user data (will have the format `simplelogin:<id>`). | String |

The `user` object returned to your callback contains some additional data as a convenience. At a minimum, it will contain the fields indicated below:

| Field | Description | Type |
| --- | --- | --- |
| email | The user's email address. | String |
| firebaseAuthToken | The Firebase authentication token for this session. | String |
| id | The user's auto-incrementing id for your Firebase. | String |
| md5_hash | An MD5 hash of the user's email address, suitable for Gravatar image URLs. | String |
| provider | The authentication method used, in this case: `password`. | String |
| uid | A unique id combining the prefix 'simplelogin' and id, intended as the unique key for user data (will have the format `simplelogin:<id>`). | String |


## Changing Passwords

You can change the password for a user using the email address and current password as shown:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.changePassword(email, oldPassword, newPassword, function(error) {
  if (error === null) {
    console.log("Password changed successfully");
  } else {
    console.log("Error changing password:", error);
  }
});
```


## Sending Password Reset Emails

You can send the user a password reset email using the email address for that account:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.sendPasswordResetEmail(email, function(error) {
  if (error === null) {
    console.log("Password reset email sent successfully");
  } else {
    console.log("Error sending password reset email:", error);
  }
});
```


## Deleting Users

You can delete a user using their email address and password as shown below:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.removeUser(email, password, function(error) {
  if (error === null) {
    console.log("User removed successfully");
  } else {
    console.log("Error removing user:", error);
  }
});
```
