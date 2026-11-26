# Testing

## Unit tests

The tests run on Node.js 20: the mocha version of the repository fails on later versions.

```sh
npm install
npx -y node@20 node_modules/.bin/_mocha "test/unit/**/*.js"
```

They mock the SFCC APIs and the Purse Identity calls: they check the logic, not the integration. Check the
integration on a sandbox.

## On a sandbox

- Open a new private window for each run. The browser keeps three sessions: SFCC, Purse Identity (SSO cookie) and the
  social provider. A leftover session logs you in without going through the flow under test.
- A social login creates a Purse Identity profile in the account before the storefront sees it. Delete it in the
  console to run the flow again.
- An existing SFCC customer with the same email as the social account is linked to it by the callback, without a
  password. Use an email that no customer has, or delete the customer first.

## Social providers

- A KakaoTalk app that has not passed the Kakao review only accepts its team members. Adding a member needs the owner
  or an administrator of the app, not an editor.
- When the provider shares the email, the profile form shows it read-only, so the account link form cannot be reached
  by typing another email. Open the link form directly, in the same session, right after the social login:

  ```
  https://<storefront>/on/demandware.store/Sites-<site>-Site/<locale>/ReachFiveController-InitLinkAccount?ReachFivesocialName=kakaotalk&email=<email of an existing customer>
  ```

  It is the URL the profile form redirects to when the email belongs to a customer.
- Unlinking a social account, or deleting the profile that holds it, unlinks it on the provider side too. With a
  shared provider app, the next login of that account asks for consent again.
