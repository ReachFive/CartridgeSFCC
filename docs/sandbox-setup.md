# Setting up a sandbox

The steps to run the cartridges on an SFCC sandbox with a Purse Identity account, in order. Each step links to the
page that details it.

## 1. API client for the deployment

1. In Account Manager, create an API client (**API Client > Add API Client**): *Confidential*, token endpoint auth
   method `client_secret_post`, a password. Keep the password: Account Manager never shows it again.
2. In the Business Manager of the sandbox, give it:
   - **Administration > Organization > WebDAV Client Permissions**: `/cartridges`, `read_write`;
   - **Administration > Site Development > Open Commerce API Settings**, *Data*, *Global*: `/code_versions` (`get`)
     and `/code_versions/*` (`get`, `patch`).

   Add the client to the existing list, without removing the other clients.
3. Run `make env`, then `make auth` and `make versions`: the code versions of the sandbox show up.

Details: [Deploying to a sandbox](deployment.md#prerequisites).

## 2. Purse Identity account

1. Create the **Identity client** and the **Management client**.
2. Allow the logout URL in **Settings > Security > SSO**.
3. Add the social providers to test, and register `https://<account>.reach5.net/login/callback` on the provider side.

Details: [Purse Identity console](purse-identity-console.md).

## 3. Business Manager

1. Fill in the ReachFive site preferences: domain, Identity client, Management client.
2. Import the services:
   1. **Administration > Operations > Import & Export**: **Upload** the file first.
   2. **Services > Import**: select the file, **Next** to validate it, choose **Merge**, then import.
   3. **Refresh** until the import is in **Success**.
   4. **Administration > Operations > Services**: each service is **Live**, with its credential.
3. Set the cartridge path of the site.

Details: [Business Manager](business-manager.md).

## 4. Deployment

```sh
make deploy
make activate
```

Details: [Deploying to a sandbox](deployment.md#usage).

## 5. Checks

1. The configuration of the Identity client answers `200` from the storefront origin (`curl` in
   [Purse Identity console](purse-identity-console.md#checking-the-configuration)).
2. The login page of the storefront shows the widget, with the social providers of the account.
3. A signup from the storefront creates the profile in the console, and the customer in Business Manager.

On failure, see [Troubleshooting](troubleshooting.md).
