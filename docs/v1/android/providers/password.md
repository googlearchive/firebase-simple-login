# Authenticating Users with Email & Password - Android

Firebase Simple Login provides an easy way to integrate email and password authentication in your app. Firebase automatically stores your users' credentials securely (using bcrypt) and redundantly (daily off-site backups).

This separates sensitive user credentials from your application data, and lets you focus on the user interface and experience for your app.


## Creating User Accounts

Firebase Simple Login provides a number of methods for account creation and management.

To create a new user account, use the following snippet:

```java
SimpleLogin authClient = new SimpleLogin(myRef, getApplicationContex());
authClient.createUser("email@example.com", "very secret", new SimpleLoginAuthenticatedHandler() {
  public void authenticated(FirebaseSimpleLoginError error, FirebaseSimpleLoginUser user) {
    if(error != null) {
      // There was an error creating this account
    }
    else {
      // We created a new user account
    }
  }
});
```

Note that reating an account will not log that new account in.


## Logging Users In

Once an account has been created, you can log a user in to that account like so:

```java
SimpleLogin authClient = new SimpleLogin(myRef, getApplicationContex());
authClient.loginWithEmail("email@example.com", "very secret", new SimpleLoginAuthenticatedHandler() {
  public void authenticated(FirebaseSimpleLoginError error, FirebaseSimpleLoginUser user) {
    if(error != null) {
      // There was an error logging into this account
    }
    else {
      // We are now logged in
    }
  }
});
```

The `User` instance will contain some basic metadata about the user account, including the email that was used to create the account.


## After Authenticating

Now that the client is logged in, your [Security Rules](https://www.firebase.com/docs/android/guide/securing-data.html) will have access to their unique user id. Specifically, the [`auth` variable](TODO) will contain the following values:

| Field | Description | Type |
| --- | --- | --- |
| email | The user's email address. | String |
| id | The user's auto-incrementing id for your Firebase. | String |
| provider | The authentication method used, in this case: 'password'. | String |
| uid | A unique id combining the prefix 'simplelogin' and id, intended as the unique key for user data (will have the format 'simplelogin:<id>'). | String |


## Changing Passwords

You can change the password for a user using the email address and current password as shown:

```java
SimpleLogin authClient = new SimpleLogin(myRef, getApplicationContex());
authClient.changePassword("email@example.com", "very secret", "very very secret", new SimpleLoginCompletionHandler() {
  public void completed(FirebaseSimpleLoginError error, boolean success) {
    if(error != null) {
      // There was an error processing this request
    }
    else if(success) {
      // Password changed successfully
    }
  }
});
```


## Sending Password Reset Emails

You can send the user a password reset email using the email address for that account:

```java
SimpleLogin authClient = new SimpleLogin(myRef, getApplicationContex());
authClient.sendPasswordResetEmail("email@example.com", new SimpleLoginCompletionHandler() {
  public void completed(FirebaseSimpleLoginError error, boolean success) {
    if(error != null) {
      // There was an error processing this request
    }
    else if(success) {
      // Password reset email sent successfully
    }
  }
});
```


## Deleting Users

You can delete a user using their email address and password as shown below:

```java
SimpleLogin authClient = new SimpleLogin(myRef, getApplicationContex());
authClient.removeUser("email@example.com", "very secret", new SimpleLoginCompletionHandler() {
  public void completed(FirebaseSimpleLoginError error, boolean success) {
    if(error != null) {
      // There was an error processing this request
    }
    else if(success) {
      // User deleted successfully
    }
  }
});
```
