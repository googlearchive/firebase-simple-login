# Anonymous Authentication - Web

Firebase Simple Login provides an easy way to create anonymous guest accounts in your application, which lets you write and enable security rules without requiring credentials from your users.

Each time you login a user anonymously, a new, unique user ID will be generated, and your Firebase reference will be authenticated using these new credentials. The session will live until its configured expiration time in the __Simple Login__ tab of your Firebase Dashboard, or when you explicitly end the session by calling `logout()`.

This is particularly useful in applications where you don't want to require account creation or login, but security rules are required to ensure that users only have access to a specific set of data.


## Logging Users In

If your user does not have an existing session, you can login with the following snippet:

```javascript
var ref = new Firebase("https://<your-firebase>.firebaseio.com/");
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) {
  if (error !== null) {
    console.log("Login error:", error);
  } else if (user !== null) {
    console.log("User authenticated with Firebase:", user);
  } else {
    console.log("User is logged out");
  }
});

// Log user in anonymously
authClient.login("anonymous");
```


## Optional Settings

| Name | Description | Type |
| --- | --- | --- |
| rememberMe | Override the default session length to be 30 days. | Boolean |

Here is an example of anonymous login where the session will be stored for 30 days:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.login("anonymous", {
  rememberMe: true
});
```

The `user` object returned to your callback after a user has logged in anonymously contains the following fields:

| Field | Description | Type |
| --- | --- | --- |
| firebaseAuthToken | The Firebase authentication token for this session. | String |
| id | The new, user-specific alphanumeric ID. | String |
| provider | The authentication method used, in this case: `anonymous`. | String |
| uid | A unique ID combining the provider and ID, intended as the user's unique key across all providers; will have the format `anonymous:<id>`. | String |


### Security Rules

Once the client is logged in, your [Security Rules](https://www.firebase.com/docs/web/guide/securing-data.html) will have access to a subset of their unique user data. Specifically, the `auth` variable will contain the following:

| Field | Description | Type |
| --- | --- | --- |
| id | The new, user-specific alphanumeric ID. | String |
| provider | The authentication method used; in this case, `anonymous`. | String |
| uid | A unique ID combining the provider and ID, intended as the user's unique key across all providers; will have the format `anonymous:<id>`. | String |

Here is an example of how to use the `auth` variable in your Security Rules:

```javascript
{
  "rules": {
    "users": {
      "$uid": {
        // grants write access to the owner of this user account whose uid must exactly match the key ($uid)
        ".write": "auth !== null && auth.uid === $uid",
        // grants read access to any user who is logged in anonymously
        ".read": "auth !== null && auth.provider === 'anonymous'"
      }
    }
  }
}
````
