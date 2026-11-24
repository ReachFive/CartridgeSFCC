# Purse Identity console

The cartridges use one Purse Identity account. Its domain, `<account>.reach5.net`, goes in the `reach5Domain` site
preference. In the examples below, `<storefront>` is the storefront host as the browser sees it after the SFCC
redirects, for example `abcd-001.my.commercecloud.salesforce.com`, and `<site>` is the site ID, such as `RefArch`.

## Identity client

The browser SDK and the storefront server share this client: `reach5ApiKey` and `reach5ClientSecret`.

| Setting | Value |
|---|---|
| Type | First-party Identity client |
| Token Endpoint Authentication Method | `Post`: the server sends the secret in the body of `/oauth/token` |
| Scopes | `openid`, `profile`, `email`, `phone`, `full_write`, `offline_access` |
| Allowed Origins (CORS) | `https://<storefront>` |
| Allowed Callback URLs | `https://<storefront>/on/demandware.store/Sites-<site>-Site/<locale>/ReachFiveController-CallbackReachFiveRequest`<br>`https://<storefront>/on/demandware.store/Sites-<site>-Site/<locale>/Login-Show` (link of the password reset email) |
| Enable Refresh Tokens | on: the cartridge renews the session with `grant_type=refresh_token` |
| Disable ROPC flow | off: the password change on the storefront uses `grant_type=password` |
| Enforce scope | off: that password grant asks for a `test` scope that does not exist |

`offline_access` is required: without it, no refresh token is issued, and the logs show `Check reachfive client
preferences scope for "offline_access"`.

## Management client

The storefront server calls the Management API with this client: `reach5ManagementApiKey`,
`reach5ManagementClientSecret` and `reach5ManagementScope`. Signup and login do not use it, so a wrong value only shows
when a Management call runs: the account link form, profile updates, verification emails, user deletion and the
synchronization jobs.

| Setting | Value |
|---|---|
| Type | Management client |
| Token Endpoint Authentication Method | `Post` |
| Permissions | `read:users`, `manage:users` |
| Allowed Origins, Allowed IP addresses | empty: only the storefront server calls it |

`reach5ManagementScope` holds the same permissions, separated by a space: `read:users manage:users`.

## Logout URL

**Settings > Security > SSO > Allowed logout callback URLs**, at the account level, not on a client:

```
https://<storefront>/on/demandware.store/Sites-<site>-Site/<locale>/Login-Logout
```

## Social providers

The widget shows the providers configured on the account (**Settings > Providers**), nothing else.

Each provider redirects to `https://<account>.reach5.net/login/callback`, which must be registered on the provider side.
For KakaoTalk, in [Kakao Developers](https://developers.kakao.com): **App > Platform Key > REST API key > Kakao Login
Redirect URI**. The REST API key is the client ID of the provider in the console. A key holds at most 10 redirect URIs.

A KakaoTalk app that has not passed the Kakao review only accepts its team members. Adding a member needs the owner or
an administrator of the app, not an editor.

## Checking the configuration

The SDK loads the configuration of the client from the storefront origin. The same request shows whether the domain,
the client and the origin match:

```sh
curl -s -H 'Origin: https://<storefront>' 'https://<account>.reach5.net/identity/v1/config?client_id=<Identity client ID>'
```

A `200` response lists the scopes and the `social_providers`. See [Troubleshooting](troubleshooting.md) for the errors.
The parameter is `client_id`, not `clientId`: with `clientId`, every client looks unknown.
