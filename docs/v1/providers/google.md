# Authenticating Users with Google - Web


## Configuring Your Application

To get started with Google authentication in Firebase Simple Login, you need to first [create a new Google application](https://cloud.google.com/console). Click the __Create Project__ button on that page and fill in a name and ID for your project. Once your application is created, navigate to __APIs & AUTH → Credentials__ in the left-hand navigation menu, and select __Create New Client ID__.

Simple Login requires web application access, so select __Web application__. Set __Authorized JavaScript origins__ to `https://auth.firebase.com`. Finally, set the __Authorized Redirect URI__ to `https://auth.firebase.com/auth/google/callback`. This allows your application to properly communicate with Firebase.

Make sure your application also has its __Product Name__ set on the __APIs & AUTH → Consent Screen__ or Google will return a `401` error when authenticating.

After configuring your Google application, head on over to the __Simple Login__ section in your Firebase Dashboard. Enable Google authentication and then copy your Google application credentials (__Client ID__ and __Client Secret__) into the appropriate inputs. You can find your Google application's client ID and secret from the same __APIs & AUTH → Credentials__ page you were just on. Look for them under the __Client ID for web application__ header.


## Logging Users In

If your user does not have an existing session, you can prompt the user to login and then invoke the Google login popup (e.g. after they've clicked a 'Login' button) with the following snippet:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.login('google');
```

### Optional Settings

| Name | Description | Type |
| --- | --- | --- |
| preferRedirect | Redirect the browser to Google, and back to your site, instead of using a popup. | Boolean |
| rememberMe | Override default session length (browser session) to be 30 days. | Boolean |
| scope | A comma-delimited list of requested extended permissions. See https://developers.google.com/+/api/oauth for more information. | String |

Here is an example where the session will be stored for 30 days and we also request some extended permissions:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
auth.login('google', {
  rememberMe: true,
  scope: 'https://www.googleapis.com/auth/plus.login'
});
```


## After Authenticating

Now that the client is logged in, your [Security Rules](https://www.firebase.com/docs/web/guide/securing-data.html) will have access to their verified Google user id. Specifically, the `auth` variable will contain the following values:

| Field | Description | Type |
| --- | --- | --- |
| email | The user's Google email address. | String |
| id | The user's Google id. | String |
| provider | The authentication method used, in this case: `google`. | String |
| uid | A unique id combining the provider and id, intended as the unique key for user data (will have the format `google:<id>`). | String |

The `user` object returned to your callback contains some additional data as a convenience. At a minimum, it will contain the fields indicated below:

| Field | Description | Type |
| --- | --- | --- |
| accessToken | The Google access token. | String |
| displayName | The user's display name. | String |
| email | The user's Google email. | String |
| firebaseAuthToken | The Firebase authentication token for this session. | String |
| id | The user's Google id. | String |
| provider | The authentication method used, in this case: `google`. | String |
| thirdPartyUserData | User account data returned by Google. | Object |
| uid | A unique id combining the provider and id, intended as the unique key for user data (will have the format `google:<id>`). | String |
