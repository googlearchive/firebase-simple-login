# Authenticating Users with GitHub - Web


## Configuring Your Application

To get started with GitHub authentication in Firebase Simple Login, you need to first [create a new GitHub application](https://github.com/settings/applications). Click the __Register new application__ button at the top right of that page and fill in a name, description, and website for your application. Set the __Authorization callback URL__ to `https://auth.firebase.com/auth/github/callback` so that your application can properly communicate with Firebase.

After configuring your GitHub application, head on over to the __Simple Login__ section in your Firebase Dashboard. Enable GitHub authentication and then copy your GitHub application credentials (__Client ID__ and __Client Secret__) into the appropriate inputs. You can find your GitHub application's client ID and secret at the top of the application's GitHub dashboard.


## Logging Users In

If your user does not have an existing session, you can prompt the user to login and then invoke the GitHub login popup (e.g. after they've clicked a 'Login' button) with the following snippet:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.login('github');
```

### Optional Settings

| Name | Description | Type |
| --- | --- | --- |
| preferRedirect | Redirect the browser to GitHub, and back to your site, instead of using a popup. | Boolean |
| rememberMe | Override default session length (browser session) to be 30 days. | Boolean |
| scope | A comma-delimited list of requested extended permissions. See http://developer.github.com/v3/oauth/#scopes for more information. | String |

Here is an example where the session will be stored for 30 days and we also request some extended permissions:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.login('github', {
  rememberMe: true,
  scope: 'user,gist'
});
```


## After Authenticating

Now that the client is logged in, your [Security Rules](https://www.firebase.com/docs/web/guide/securing-data.html) will have access to their verified GitHub user id. Specifically, the `auth` variable will contain the following values:

| Field | Description | Type |
| --- | --- | --- |
| id | The user's GitHub id. | String |
| provider | The authentication method used, in this case: `github`. | String |
| uid | A unique id combining the provider and id, intended as the unique key for user data (will have the format `github:<id>`). | String |

The `user` object returned to your callback contains some additional data as a convenience. At a minimum, it will contain the fields indicated below:

| Field | Description | Type |
| --- | --- | --- |
| accessToken | The GitHub access token. | String |
| displayName | The user's display name. | String |
| firebaseAuthToken | The Firebase authentication token for this session. | String |
| id | The user's GitHub id. | String |
| provider | The authentication method used, in this case: `github`. | String |
| username | The user's GitHub username. | String |
| thirdPartyUserData | User account data returned by GitHub. | Object |
| uid | A unique id combining the provider and id, intended as the unique key for user data (will have the format `github:<id>`). | String |
