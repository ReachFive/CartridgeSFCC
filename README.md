# Reachfive Cartridge for Salesforce B2C Commerce

Repository contains the needed cartridges for both SFRA and SGJC based storefronts.

ReachFive is a CIAM (Customer Idendity and Access Management), providing social media and full authentication features. 
With ReachFive, customers can simplify their authentication process and improve their customer identity management. 
Currently, more than 30 social networks authentications are managed by ReachFive but the number of social networks supported is continuously growing.

As described in the ReachFive website (https://www.reach5.co/), ReachFive provide the following functionalities:
* Single Sign On: sets of API and widget to allow the user to signup, login, manage social account profiles
* Social Login:  allows merchants to integrate OAuth providers registering and login functionalities, manage social account profiles


# The latest version
The latest compatible version of SFRA is 6.3.0
The latest compatible version of SiteGenesis is 18.3 

# Getting Started
For detailed instructions on integration and configuration, please refer to our documentation available at [https://developer.reachfive.com/docs/integration/salesforce.html](https://developer.reachfive.com/docs/integration/salesforce.html). This documentation provides all the necessary information for integrating and configuring the ReachFive Cartridge for Salesforce B2C Commerce, tailored to your site version, whether it's SFRA or SiteGenesis.

# Deploying to a sandbox

The `Makefile` deploys the cartridges, as committed on a git ref, to an SFCC sandbox as a new code version. It never
changes an existing code version: `make deploy` copies the active version on the server (WebDAV `COPY`, nothing is
downloaded), replaces `int_reachfive` and `int_reachfive_sfra` in the copy, and `make activate` activates it.

## Prerequisites

- Node.js: the `Makefile` runs [sfcc-ci](https://github.com/SalesforceCommerceCloud/sfcc-ci) through `npx`.
- An API client in Account Manager (**API Client > Add API Client**): authentication type *Confidential*, token
  endpoint auth method `client_secret_post`, a password, and the organization of the sandbox. The password is the
  client secret, and Account Manager never shows it again.
- In the Business Manager of the sandbox, the API client needs:
  - **Administration > Organization > WebDAV Client Permissions**, to copy and upload code versions:
    ```json
    { "client_id": "<API client ID>", "permissions": [{ "path": "/cartridges", "operations": ["read_write"] }] }
    ```
  - **Administration > Site Development > Open Commerce API Settings**, type *Data*, context *Global*, to list and
    activate code versions:
    ```json
    {
      "client_id": "<API client ID>",
      "resources": [
        { "resource_id": "/code_versions", "methods": ["get"], "read_attributes": "(**)", "write_attributes": "(**)" },
        { "resource_id": "/code_versions/*", "methods": ["get", "patch"], "read_attributes": "(**)", "write_attributes": "(**)" }
      ]
    }
    ```
  Add the client to the existing `clients` list, without removing the other ones.
- The cartridge path of the site lists the cartridges before `app_storefront_base`, for example
  `int_reachfive_sfra:int_reachfive:app_storefront_base` (**Administration > Sites > Manage Sites > Settings**).

## Usage

`make` alone prints the help:

```
$ make
Deploy the ReachFive cartridges to an SFCC sandbox as a new code version.

First time:
  make env                  write .env: instance and Account Manager API client

Deploy:
  make auth                 get an sfcc-ci token (lasts about 30 min)
  make deploy               copy SOURCE to a new version, with CARTRIDGES from REF
  make activate             activate the last deployed version (or VERSION=...)

Other:
  make versions             list the code versions on INSTANCE
  make instances            list the instances the client can reach
  make clean                remove build/

Variables (make deploy REF=my-branch ...):
  INSTANCE=abcd-001.dx.commercecloud.salesforce.com
  REF=main
  CARTRIDGES=int_reachfive int_reachfive_sfra
  SOURCE=<the active version>
  last deployed version: 20261113-1708_main
```

`make env` writes the instance and the API client to `.env`, which git ignores. Run it again to change a value:
pressing Enter keeps the current one.

```
$ make env
Instance hostname: abcd-001.dx.commercecloud.salesforce.com
API Client ID (Account Manager): 11111111-2222-3333-4444-555555555555
API Client password (hidden):
.env written, next: make auth
```

`make auth` gets a token, which lasts about 30 minutes:

```
$ make auth
npx --yes sfcc-ci client:auth
Authentication succeeded
```

`make versions` lists the code versions of the instance:

```
$ make versions
npx --yes sfcc-ci code:list -i abcd-001.dx.commercecloud.salesforce.com
Number of code versions: 2
╔════════════════════╤══════════════════════╤════════╤════════════════════╤════════════════════════╤════════════╗
║ ID                 │ Activation Time      │ Active │ Compatibility Mode │ Last Modification Time │ Total Size ║
╟────────────────────┼──────────────────────┼────────┼────────────────────┼────────────────────────┼────────────╢
║ 20261113-1708_main │ undefined            │ false  │ 22.7               │ 2026-11-13T13:09:01Z   │ undefined  ║
╟────────────────────┼──────────────────────┼────────┼────────────────────┼────────────────────────┼────────────╢
║ base_sfra          │ 2025-10-28T13:13:50Z │ true   │ 22.7               │ 2025-10-28T13:14:01Z   │ undefined  ║
╚════════════════════╧══════════════════════╧════════╧════════════════════╧════════════════════════╧════════════╝
```

`make deploy` creates the new code version, named `<date>-<time>_<ref>`. Use `REF=<branch>` to deploy another
branch, and `SOURCE=<version>` to start from another version than the active one:

```
$ make deploy
packaging int_reachfive int_reachfive_sfra from main (1d5fd41)
copying base_sfra to 20261113-1708_main on abcd-001.dx.commercecloud.salesforce.com
uploading int_reachfive int_reachfive_sfra
Code archive build/20261113-1708_main.zip successfully deployed to abcd-001.dx.commercecloud.salesforce.com. You may activate the code by running `sfcc-ci code:activate 20261113-1708_main -i abcd-001.dx.commercecloud.salesforce.com`.

20261113-1708_main created from base_sfra. Next: make activate
Rollback: make activate VERSION=base_sfra
```

`make activate` activates the last deployed version:

```
$ make activate
npx --yes sfcc-ci code:activate 20261113-1708_main -i abcd-001.dx.commercecloud.salesforce.com
Code version 20261113-1708_main activated on abcd-001.dx.commercecloud.salesforce.com
```

To roll back, activate the previous version again: `make activate VERSION=base_sfra`. Code versions are deleted in
Business Manager (**Administration > Site Development > Code Deployment**).

# Git Branching Strategy
This GitFlow strategy is composed of the following branches:

- Main branch: Serves as the official release history.
- Development branch: Used as the integration branch for features.
- Feature branches: Used to develop new features derived from the development branch.
- Release branches: Help in preparing a new production release. Typically branched off from the development branch and must be merged back into both development and main branches upon completion.
- Hotfix branches: Facilitate quick fixes for production issues found in the main branch, allowing developers to address bugs without halting ongoing work in the development branch.
