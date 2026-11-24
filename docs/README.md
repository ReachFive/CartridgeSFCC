# Developer documentation

These pages are for the developers of the cartridges. The integration guide for merchants is the
[Salesforce integration documentation](https://developer.reachfive.com/docs/integration/salesforce.html).

| Page | Covers |
|---|---|
| [Deploying to a sandbox](deployment.md) | the `Makefile`, and the Account Manager API client it needs |
| [Purse Identity console](purse-identity-console.md) | the Identity and Management clients, the allowed URLs, the social providers |
| [Business Manager](business-manager.md) | the site preferences, the cartridge path, the services, the logs, the customers |
| [Troubleshooting](troubleshooting.md) | common errors, their cause and their fix |

Set up a sandbox in this order:

1. Create the Identity and Management clients in the Purse Identity console.
2. Fill in the site preferences, import the services and set the cartridge path in Business Manager.
3. Deploy the cartridges with `make deploy` and `make activate`.

When a change adds a site preference, a service, a console setting or a log message, update these pages in the same
pull request.
