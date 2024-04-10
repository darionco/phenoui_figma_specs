# phenoui_figma_specs
This repository contains the Figma design specs for the PhenoUI project. The CI/CD in this repository
automatically updates the data in the configured strapi server when a new version of the spec is pushed
to the `mian`, `staging` and `develop` branches. The server URL and API token configurations live in
this repository's GitHub variables and secrets respectively.

## Usage
It is strongly recommended to test the changes in a local environment before pushing to the remote repository.
To do so, you can use the strapi version provided in the
[mindora_strapi](https://github.com/PhenoML/mindora_strapi)
repository. Instructions on how to run the strapi server can be found in the repository's README file.

[Deno](https://deno.land/) is required to run the script that updates the strapi server. You can install it
by following the instructions on their website.

By default, strapi runs on http://localhost:1337, so you can use this URL to test the changes locally by running
the following command in the root of the repository:

```bash
 deno run -A ./_tools/uploadSpecs.js --url=http://localhost:1337 --key=<your_strapi_api_token>
```

You need to replace `<your_strapi_api_token>` with the actual API token of your strapi server. You can
generate an api token by following the instructions in the
[strapi documentation](https://docs.strapi.io/user-docs/settings/API-tokens).

The script will upload the data to the configured server (localhost in the example above) and will print the
result of the operation. If the operation fails, the script will print the error message and exit.

With the changes are uploaded to your local strapi server, they can be tested by logging into your local strapi
server in the PhenoUI figma plugin, the tester app and any other app that consumes the data. Make sure to
configure public access to relevant APIs in your local strapi server if an application that does not require
strapi authentication is going to consume the data (for example, the mindora app). To do so, you can follow the
instructions in the
[strapi documentation](https://docs.strapi.io/user-docs/users-roles-permissions/configuring-end-users-roles)

Once the changes are tested and confirmed to be working as expected, you can push the changes to the remote
repository and submit a PR to the `develop` branch. The CI/CD will automatically update the data in the
branch to the correct server once the PR is merged.

