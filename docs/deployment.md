# Deploying to a sandbox

Read [Business Manager](business-manager.md) for the pages this section refers to, and [Troubleshooting](troubleshooting.md) when a step fails.

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
  make deploy               copy SOURCE to a new version, with CARTRIDGES from BRANCH
  make activate             activate the last deployed version (or VERSION=...)

Other:
  make versions             list the code versions on INSTANCE
  make instances            list the instances the client can reach
  make clean                remove build/

Variables (make deploy SOURCE=<version> ...):
  INSTANCE=abcd-001.dx.commercecloud.salesforce.com
  BRANCH=main (the current branch, check out another one to deploy it)
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

`make deploy` creates the new code version, named `<date>-<time>_<branch>`, after a confirmation. It always deploys the
current branch, as committed: to deploy another branch, check it out first. Uncommitted changes are not deployed. Use
`SOURCE=<version>` to start from another version than the active one.

```
$ make deploy
reading the code versions of abcd-001.dx.commercecloud.salesforce.com...

Instance:    abcd-001.dx.commercecloud.salesforce.com
Source:      base_sfra (copied, not changed)
Cartridges:  int_reachfive int_reachfive_sfra
Branch:      main (1d5fd41 Release 20.11.0 (#59))
New version: 20261113-1708_main
Deploy? [y/N] y
packaging int_reachfive int_reachfive_sfra from main
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
