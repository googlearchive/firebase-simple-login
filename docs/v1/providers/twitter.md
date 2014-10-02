# Authenticating Users with Twitter - Web


## Configuring Your Application

To get started with Twitter authentication in Firebase Simple Login, you need to first [create a new Twitter application](https://apps.twitter.com/). Click the __Create New App__ button at the top right of that page and fill in a name, description, and website for your application. Set the application's __Callback URL__ to `https://auth.firebase.com/auth/twitter/callback` so that your application can properly communicate with Firebase.

After configuring your Twitter application, head on over to the __Simple Login__ section in your Firebase Dashboard. Enable Twitter authentication and then copy your Twitter application credentials (__API key__ and __API secret__) into the appropriate inputs. You can find your Twitter application's key and secret at the top of the __API Keys__ tab of the application's Twitter dashboard.


## Logging Users In

If your user does not have an existing session, you can prompt the user to login and then invoke the Twitter login popup (e.g. after they've clicked a 'Login' button) with the following snippet:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.login('twitter');
```

### Optional Settings

| Name | Description | Type |
| --- | --- | --- |
| oauth_token | Skip the OAuth popup-dialog and create a user session directly using an existing Twitter session. In order to invoke this mode, the oauth_token_secret and user_id attributes are also required. | String |
| preferRedirect | Redirect the browser to Twitter, and back to your site, instead of using a popup. | Boolean |
| rememberMe | Override default session length (browser session) to be 30 days. | Boolean |

Here is an example where the session will be stored for 30 days and we also request some extended permissions:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.login('twitter', {
  rememberMe: true
});
```


## After Authenticating

Now that the client is logged in, your [Security Rules](https://www.firebase.com/docs/web/guide/securing-data.html) will have access to their verified Twitter user id. Specifically, the `auth` variable will contain the following values:

| Field | Description | Type |
| --- | --- | --- |
|id | The user's Twitter id. | String |
| provider | The authentication method used, in this case: `twitter`. | String |
| uid | A unique id combining the provider and id, intended as the unique key for user data (will have the format `twitter:<id>`). | String |

The `user` object returned to your callback contains some additional data as a convenience. At a minimum, it will contain the fields indicated below:

| Field | Description | Type |
| --- | --- | --- |
| accessToken | The Twitter access token. | String |
| accessTokenSecret | The Twitter access token secret. | String |
| displayName | The user's display name. | String |
| firebaseAuthToken | The Firebase authentication token for this session. | String |
| id | The user's Twitter id. | String |
| provider | The authentication method used, in this case: `twitter`. | String |
| thirdPartyUserData | User account data returned by Twitter. | Object |
| uid | A unique id combining the provider and id, intended as the unique key for user data (will have the format `twitter:<id>`). | String |
| username | The user's Twitter username. | String |
