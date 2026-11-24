# Troubleshooting

## Storefront

| Symptom | Cause | Fix |
|---|---|---|
| The login tab is empty: no widget | `GET /identity/v1/config` fails. Run the `curl` of [Purse Identity console](purse-identity-console.md#checking-the-configuration) | See the rows below for the error it returns |
| `403 origin_not_allowed` | The storefront origin is not allowed on the Identity client | Add `https://<storefront>` to **Allowed Origins (CORS)** |
| `401 invalid_client` on `/identity/v1/config` | The client does not exist on this domain, or the request used `clientId` instead of `client_id` | Check `reach5Domain` and `reach5ApiKey` |
| No social button | No provider is configured on the account | Add the provider in **Settings > Providers** |
| `error.logout.redirectUrl.notAllowed` when logging out | The `Login-Logout` URL is not allowed | Add it to **Settings > Security > SSO > Allowed logout callback URLs** |
| Kakao shows `KOE006` | The Kakao app does not know `https://<account>.reach5.net/login/callback` | Add it to the redirect URIs of the REST API key in Kakao Developers |
| Kakao asks for consent again | The Purse Identity profile of that Kakao identity was deleted: the deletion unlinks it on the Kakao side | Expected once |

## Server logs

See [Business Manager](business-manager.md#logs) to read them.

| Message | Cause | Fix |
|---|---|---|
| `service=reachfive.rest.auth status=ERROR errorCode=401` with `invalid_client` | Wrong client ID or secret in the site preferences. A Management call failing this way means the Management client: signup and login never use it | Copy the ID and the secret again, with the copy button of the console |
| `Check reachfive client preferences scope for "offline_access"` | No refresh token | Add `offline_access` to the scopes of the Identity client |
| A service that is not found | The service is missing from Business Manager | Import `services.xml` (see [Services](business-manager.md#services)) |
| `No state data` | The callback does not find the state of the request | Known issue, the callback then redirects to `Account-Show` |

## Deployment

| Symptom | Cause | Fix |
|---|---|---|
| `make deploy`: `copy failed: HTTP 401` | The API client has no WebDAV permission on `/cartridges` | See [Prerequisites](deployment.md#prerequisites) |
| `make versions`: `Cannot read code versions` | The API client has no OCAPI Data permission on `/code_versions`, or the token expired | Add the permission, or run `make auth` |
| `make auth`: `Authentication failed` | Wrong client ID or password in `.env` | Run `make env` again |
| A change is not on the storefront | It is not committed: `make deploy` packages `HEAD` | Commit, then deploy again |
