# Business Manager

Select the site in the top left menu before opening a **Merchant Tools** page.

## Site preferences

**Merchant Tools > Site Preferences > Custom Preferences > ReachFive**. Business Manager shows the labels, and the code
reads the IDs ([`reachfiveSettings.js`](../cartridges/int_reachfive/cartridge/models/reachfiveSettings.js)).

| Label | ID | Value |
|---|---|---|
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
**Administration > Site Development > Site Import & Export**.

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

The services are defined in [`Metadata/site_template/services.xml`](../Metadata/site_template/services.xml). To import
them:

1. **Administration > Operations > Import & Export**, then **Upload** the file in the upload section at the top.
2. **Services > Import**, select the file, **Next** to validate it.
3. Choose **Merge**: the services of the file are added or updated, and the others are kept.

The services are configured per instance: deploying a code version does not change them.

## Logs

The cartridges log with `Logger.getLogger('loginReachFive')` and `Logger.getLogger('reachfive')`. These are categories,
not file names: the messages go to the common custom log files.

| Messages | Where |
|---|---|
| errors | `customerror-*.log` |
| warnings | `customwarn-*.log`, only when **Administration > Operations > Custom Log Settings** enables `WARN` for the category |
| service calls (`comm-log-enabled`) | `service-reachfive-*.log` |

To read them:

- **Log Center**, from Business Manager, searches the messages of every log file: search for a message text, such as
  `Social profile` or `service=reachfive`.
- **Administration > Site Development > Development Setup > Log Files** lists the files of the day.

## Customers

**Merchant Tools > Customers > Customers**. The **External Profiles** of a customer show the external ID, which is the
ID of the Purse Identity profile the customer is linked to.

A customer created by Purse Identity in Full CIAM mode has a random SFCC password.

## Code versions

**Administration > Site Development > Code Deployment** lists, activates and deletes the code versions. See
[Deploying to a sandbox](deployment.md) to create one.
