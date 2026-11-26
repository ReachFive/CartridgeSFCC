# Business Manager

Select the site in the top left menu before opening a **Merchant Tools** page.

## Site preferences

**Merchant Tools > Site Preferences > Custom Preferences > ReachFive**. Business Manager shows the labels, and the code
reads the IDs ([`reachfiveSettings.js`](../cartridges/int_reachfive/cartridge/models/reachfiveSettings.js)).

| Label | ID | Value |
|---|---|---|
| Is ReachFive Enabled | `isReachFiveEnabled` | `Yes`, or the cartridges do nothing |
| ReachFive Login utilities | `isReachFiveLoginAllowed` | `Yes`: a login through the SFCC forms, the account link form included, also logs in on Purse Identity |
| ReachFive Domain | `reach5Domain` | `<account>.reach5.net` |
| ReachFive Identity API client ID | `reach5ApiKey` | ID of the Identity client |
| ReachFive Identity API client secret | `reach5ClientSecret` | secret of the Identity client |
| Define the API KEY for the Management API | `reach5ManagementApiKey` | ID of the Management client |
| Define the Client Secret for the Management API | `reach5ManagementClientSecret` | secret of the Management client |
| Reach Five Management scope | `reach5ManagementScope` | `read:users manage:users` |
| ReachFive Fast Register mode | `isReachFiveFastRegister` | `No` shows a form to complete the profile after a social login |

The clients are described in [Purse Identity console](purse-identity-console.md). The site preferences take effect on
the next request: no deployment is needed.

The attributes themselves come from [`Metadata/site_template/meta`](../Metadata/site_template/meta), imported with
**Administration > Site Development > Site Import & Export**. Import `meta` only: `sites` holds site preferences that
would overwrite the ones of the instance.

## Cartridge path

**Administration > Sites > Manage Sites > \<site\> > Settings > Cartridges**. The cartridges come before the storefront
cartridge they override, for example:

```
int_reachfive_sfra:int_reachfive:app_storefront_base
```

On SiteGenesis, `int_reachfive_sg` comes before `app_storefront_core` and `app_storefront_controllers`.

**Effective Cartridge Path** on the same page shows the result. A cartridge missing from the active code version is
skipped silently.

The page cache is cleared on the **Cache** tab of the same site.

## Services

Every HTTP call of the cartridges to Purse Identity goes through a service: **Administration > Operations > Services**.
The URLs hold `{reach5Domain}`, which the code replaces with the site preference, so they do not change between
accounts. A service missing from Business Manager fails at runtime.

| Service | Call | Client | Used for |
|---|---|---|---|
| `reachfive.rest.auth` | `POST /oauth/token` | both | tokens: code exchange, refresh, client credentials |
| `reachfive.signup.post` | `POST /identity/v1/signup` | Identity | signup from the SFCC forms |
| `reachfive.passwordlogin.post` | `POST /identity/v1/password/login` | Identity | password check: login in Transition mode, account link form |
| `reachfive.userinfo.get` | `GET /identity/v1/userinfo` | Identity | profile of the logged-in customer |
| `reachfive.update.profile.post` | `POST /identity/v1/update-profile` | Identity | profile update by the customer |
| `reachfive.updateemail.post` | `POST /identity/v1/update-email` | Identity | email update |
| `reachfive.updatephone.post` | `POST /identity/v1/update-phone-number` | Identity | phone update |
| `reachfive.updatepassword.post` | `POST /identity/v1/update-password` | Identity | password update |
| `reachfive.updateprofile.put` | `PUT /api/v2/users/{user_id}` | Management | profile synchronization |
| `reachfive.verifyemail.post` | `POST /api/v2/users/{user_id}/verify-email` | Management | verification email |
| `reachfive.verifyphone.post` | `POST /api/v2/users/{user_id}/verify-phone-number` | Management | verification SMS |
| `reachfive.getuser` | `GET /api/v2/users/{user_id}` | Management | account link form: read the social profile |
| `reachfive.deleteuser` | `DELETE /api/v2/users/{user_id}` | Management | user deletion, account link form |
| `reachfive.addidentity.post` | `POST /api/v2/users/{user_id}/providers/identity` | Management | account link form: add the social identity |

The services are defined in [`Metadata/site_template/services.xml`](../Metadata/site_template/services.xml). To import
them:

1. **Administration > Operations > Import & Export**: **Upload** the file first, in the upload section at the top. The
   import only lists uploaded files.
2. **Services > Import**, select the file, **Next** to validate it.
3. Choose **Merge**: the services of the file are added or updated, and the others are kept.
4. **Refresh** the status until the import is in **Success**.
5. **Administration > Operations > Services**: each service of the file is **Live**, with its credential.

The services are configured per instance: deploying a code version does not change them.

A merge also rewrites the existing services of the file, such as a URL or a timeout changed by hand on the instance.
To add a few services only, import a file that holds just those services, their credentials and the
`reachfive.profile` service profile.

`services.xml` does not hold every service the code calls:

- `reachfive.verifyphone.post`: its credential is defined, not the service.
- `reachfive.ocapiOauth` and `reachfive.ocapiDeleteCustomer`, which the `DeleteUser` webhook uses to delete the SFCC
  customer through OCAPI: create them by hand. `reachfive.ocapiOauth` gets a token with `client_credentials`, with the
  API client of the `ocapiTokenClientId` and `ocapiTokenClientPassword` site preferences. `reachfive.ocapiDeleteCustomer` calls its credential URL
  followed by `<customer list ID>/customers/<customer number>`.

## Logs

Search the logs in the **Log Center**, opened from Business Manager, by the text of the message: for example
`Social profile`, or `service=reachfive.rest.auth` for a failed call to Purse Identity.

The cartridges log in the `loginReachFive` and `reachfive` categories. Whether the warnings are written depends on the
level set in **Administration > Operations > Custom Log Settings**.

## Customers

**Merchant Tools > Customers > Customers**. The **External Profiles** of a customer show the external ID, which is the
ID of the Purse Identity profile the customer is linked to.

A customer created by Purse Identity in Full CIAM mode has a random SFCC password.

## Code versions

**Administration > Site Development > Code Deployment** lists, activates and deletes the code versions. See
[Deploying to a sandbox](deployment.md) to create one.
