# Authenticating Users with Facebook - Web


## Configuring Your Application

To get started with Facebook authentication in Firebase Simple Login, you need to first [create a new Facebook application](https://developers.facebook.com/apps). Click the __Create New App__ button in the top right of that page. Choose a name, namespace, and category for your application.

In your Facebook app configuration, click on the __Settings__ tab on the left-hand navigation menu. Then go to the __Advanced__ tab at the top and scroll down to the __Security__ section. At the bottom of that section, add `https://auth.firebase.com/auth/facebook/callback` to your __Valid OAuth redirect URIs__ and click __Save Changes__ at the bottom of the page.

Next, you'll need to get your app credentials from Facebook. Click on the __Basic__ tab at the top of the page. You should still be within the __Settings__ tab. Towards the top of this page, you will see your __App ID__ and __App Secret__. Your __App ID__ will be displayed in plain text and you can view your __App Secret__ by clicking on the __Show__ button and typing in your Facebook password. Copy these Facebook application credentials (__App ID__ and __Secret__) in the __Simple Login__ section in your Firebase Dashboard.

### Adding Contact Information

Facebook requires that you have a valid contact email specified in order to make your app available to all users. You can specify this email address from the same __Basic__ tab within the __Settings__ section. After you have provided your email, click on __Save Changes__. The last thing you need to do to approve your app is click on the __Status & Review__ tab on the left-hand navigation menu and move the slider at the top of that page to the __Yes__ position. When prompted with a popup, click __Confirm__. Your app will now be live and can be used with Firebase Simple Login.


## Logging Users In

If your user does not have an existing session, you can prompt the user to login and then invoke the Facebook login popup (e.g. after they've clicked a 'Login' button) with the following snippet:

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.login('facebook');
```

### Optional Settings

| Name | Description | Type |
| --- | --- | --- |
| access_token | Skip the OAuth popup-dialog and create a user session directly using an existing Facebook access token. Use this option to continue using the Facebook JS SDK as the primary authentication method in your application. | String |
| preferRedirect | Redirect the browser to Facebook, and back to your site, instead of using a popup. | Boolean |
| rememberMe | Override default session length (browser session) to be 30 days. | Boolean |
| scope | A comma-delimited list of requested extended permissions. See https://developers.facebook.com/docs/reference/login/#permissions for more information. | String |

Here is an example where the session will be stored for 30 days and we also request some extended permissions:

```
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
authClient.login('facebook', {
  rememberMe: true,
  scope: 'email,user_likes'
});
```


## After Authenticating

Now that the client is logged in, your [Security Rules](https://www.firebase.com/docs/web/guide/securing-data.html) will have access to their verified Facebook user id. Specifically, the `auth` variable will contain the following values:

| Field | Description | Type |
| --- | --- | --- |
| id | The user's Facebook id. | String |
| provider | The authentication method used, in this case: `facebook`. | String |
| uid | A unique id combining the provider and id, intended as the unique key for user data (will have the format `facebook:<id>`). | String |

The `user` object returned to your callback contains some additional data as a convenience. At a minimum, it will contain the fields indicated below:

| Field | Description | Type |
| --- | --- | --- |
| accessToken | The Facebook access token. | String |
| displayName | The user's display name. | String |
| firebaseAuthToken | The Firebase authentication token for this session. | String |
| id | The user's Facebook id. | String |
| provider | The authentication method used, in this case: `facebook`. | String |
| thirdPartyUserData | User account data returned by Facebook. | Object |
| uid | A unique id combining the provider and id, intended as the unique key for user data (will have the format `facebook:<id>`). | String |


## Permission Scope

Facebook only provides us with access to a user's basic profile information. If we want access to other private data, we need to request permission. We can provide our permissions — also known as scopes — when calling the `login()` method. The `scope` property will allow us to request access the these permissions.

The `email` and `user_likes` scopes will give us access to the user's primary email and a list of things that the user likes, respectively. Those are just two of [many permissions we can request](https://developers.facebook.com/docs/facebook-login/permissions/). To gain access to those permissions [a review process is required by Facebook](https://developers.facebook.com/docs/facebook-login/permissions/#review). If the review is approved we then can provide the permissions to the `login()` method. Make sure to select these permission on Facebook's app dashboard in addition to providing them in `scope`.

The Facebook permissions are encoded in the `accessToken` that is returned within the `user` object. With this `accessToken` we can query the Open Graph API to access our requested permissions.

```javascript
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) { ... });
auth.login("facebook", {
  rememberMe: true,
  scope: "email,user_likes" // the permissions requested
});
```

When the user successfully logs in we will get back an `accessToken` in the `user` object.

```javascript
var ref = new Firebase("https://<your-firebase>.firebaseio.com");
var authClient = new FirebaseSimpleLogin(myRef, function(error, user) {
  if (user) {
    // the access token will allow us to make Open Graph API calls
    console.log(user.accessToken);
  }
});
```
