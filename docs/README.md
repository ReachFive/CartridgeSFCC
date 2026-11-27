# Developer documentation

These pages are for the developers of the cartridges. The integration guide for merchants is the
[Salesforce integration documentation](https://docs.identity.purse.eu/docs/integration/salesforce.html).

| Page | Covers |
|---|---|
| [Setting up a sandbox](sandbox-setup.md) | every step, in order, from the API client to the first signup |
| [Deploying to a sandbox](deployment.md) | the `Makefile`, and the Account Manager API client it needs |
| [Purse Identity console](purse-identity-console.md) | the Identity and Management clients, the allowed URLs, the social providers |
| [Business Manager](business-manager.md) | the site preferences, the cartridge path, the services, the logs, the customers |
| [Troubleshooting](troubleshooting.md) | common errors, their cause and their fix |

To start from scratch, follow [Setting up a sandbox](sandbox-setup.md).

When a change adds a site preference, a service, a console setting or a log message, update these pages in the same
pull request.
