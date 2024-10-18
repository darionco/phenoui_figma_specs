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
 deno run -A ./_tools/uploadSpecs.js --url=http://localhost:1337 --user=<your_admin_user_name> --password=<your_admin_password>
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

## Data Format
Each spec is a JSON encoded object with that adheres to the following type:
```ts
type FigmaWidgetSpec = {
    type: String;
    mappings: MappingSpec;
    userData: UserData;
}
```

Here's an example of a spec object using the data type above:
```json
{
  "type": "Form",
  "mappings": {
    "type": "!figma-form",
    "child": "@Frame"
  },
  "userData": {
    "data": {
      "type": "group",
      "default": null,
      "description": "Data to forward to the form flutter script"
    },
    "form": {
      "type": "string",
      "default": null,
      "description": "The name of the flutter script that will handle this form"
    }
  }
}
```

### Type
The `type` field is a string that represents the type of the widget. While this string can be any arbitrary
string, it must be unique for each widget type. It is also recommended to use
[CamelCase](https://en.wikipedia.org/wiki/Camel_case) for the type string.

### Mappings
The `mappings` field defines how the data from figma will be mapped to the output data by the plugin,
it is defined as the recursive type `MappingSpec` which is defined as follows:
```ts
enum MappingAction {
    literal = '!',
    valuePath = '#',
    nodePath = '$',
    inherit = '@',
    execute = '%',
    source = '*',
};

type MappingString = `${MappingAction}${string}`;
type MappingEntry = MappingString | MappingSpec | MappingString[] | MappingSpec[] | number | boolean | null;
type MappingSpecArr = MappingEntry[];
type MappingSpecObj = {
    [key: string]: MappingEntry;
}

type MappingSpec = MappingSpecObj | MappingSpecArr;
```

#### Literal `!`
When the mapping action `!` is used, the value is used as is. For example, the mapping `!figma-form` will
result in the string `figma-form` in the output data.

#### Value Path `#`
When the mapping action `#` is used, the value is used as a path to the value in the figma node data.
For example, the mapping `#name` will result in the value of the `name` field in the figma node data.

#### Node Path `$`
When the mapping action `$` is used, the value is used as a path to the node in the figma document.
For example, the mapping `$children[0]` will result in the first child of the node in the figma document
being processed through the mapping process and its output being used as the output of the mapping.

#### Inherit `@`
When the mapping action `@` is used, the value is used to inherit the mapping from another widget type.
For example, the mapping `@Frame` will result in the mapping of the `Frame` widget type being used as the
output of the mapping. Inheritance is recursive, so if the inherited mapping contains an `@` action, the mapping of the widget type
referenced by the `@` action will be used as the output of the mapping.

Inheritance can be fine tuned by passing an array of values to the `mappings` field of the widget spec. The
values in the array will be used to override the inherited values. For example, the following spec will
inherit the mapping of the `Frame` widget type and override the `child` field with the value `$children[0]`:
```json
{
  "type": "Form",
  "mappings": [
    "@Frame",
    {
      "child": "$children[0]"
    }
  ],
  "userData": null
}
```

#### Execute `%`
When the mapping action `%` is used, the value is used to execute a function that will be used to generate
the output of the mapping. The function must be defined either in the `builtInMethods` object defined in the
[`execute.ts`](https://github.com/PhenoML/PhenoUI-figma/blob/main/src/plugin/execute.ts) file in the
PhenoUI figma plugin repository, or in the [Figma Node](https://www.figma.com/plugin-docs/api/nodes/)
being exported.

#### Source `*`
The mapping action `*` is for internal use only and should not be used in the specs.

#### Keeping up to date
For an up-to-date version of the typings above, check the `MappingSpec` type in the
[`export.ts`](https://github.com/PhenoML/PhenoUI-figma/blob/main/src/plugin/tools/export/export.ts#L7-L23)
file in the PhenoUI figma plugin repository.

### UserData
The `userData` field is an object that contains any additional data that is required by the plugin to
render the widget. This data is not used by the plugin during the figma workflow, but it is used by the
plugin when exporting the data back to the server to render the widget using the PhenoUI flutter library.
`userData` is defined as follows:
```ts
export type PropertyBinding = {
    type: 'binding',
    id: string,
    value?: string | boolean,
}

export type UserDataGroup = {
    type: 'group',
    properties: UserType[],
}

export type UserType = {
    description: string,
    linkedTo?: string,
} & ({
    type: 'string',
    default?: string,
    value?: string | PropertyBinding,
    properties?: string[],
} | {
    type: 'boolean',
    default?: boolean,
    value?: boolean | PropertyBinding,
    properties?: string[],
} | {
    type: 'number',
    default?: number,
    value?: number,
} | {
    type: 'select',
    default?: string,
    value?: string,
    options: Array<{
        value: string,
        label: string,
    }>,
} | {
    type: 'componentProperty',
    valueType?: ComponentPropertyType,
    default?: never,
    value?: string | number | boolean,
    key: string,
    propertyId: string,
    options?: Array<{
        value: string,
        label: string,
    }>,
} | {
    type: 'group',
    default?: UserType[],
    value?: UserDataGroup,
} | {
    type: 'lottie',
    default: string | null,
    value: string | null,
} | {
    type: 'union',
    handler: UserType['type'],
    fields: UserDataSpec,
    value: never,
    default: never,
});

export type UserDataValue = Exclude<UserType['value'], undefined>;

export type UserDataSpec = {
    [key: string]: UserType,
}
```

The type above translates to an object for which its keys define the names of the configurable properties
that the plugin will preset to the user in its panel. The values of the object are objects that define the
type of the property, its default value, and any additional information that is required to render the property
in the plugin's panel.

The special key `__layout__` can be used to define the layout of the properties in the plugin's panel. The value
of the `__layout__` key is an array of strings that define the order of the properties in the panel. The strings
in the array are the keys of the properties in the `userData` object. For example, the following `userData`
object will render the `name` property first, followed by the `age` property in the plugin's panel:
```json
{
  "__layout__": [
    "name", 
    "age"
  ],
  "name": {
    "type": "string",
    "default": "John Doe",
    "description": "The name of the user"
  },
  "age": {
    "type": "number",
    "default": 30,
    "description": "The age of the user"
  }
}
```
each entry in the `__layout__` array represents a row in the plugin's panel, nested properties can be used to
define the layout of the properties in the same row. For example, the following `userData` object will render
the `name` and `age` properties in the same row in the plugin's panel:
```json
{
  "__layout__": [
    ["name", "age"]
  ],
  "name": {
    "type": "string",
    "default": "John Doe",
    "description": "The name of the user"
  },
  "age": {
    "type": "number",
    "default": 30,
    "description": "The age of the user"
  }
}
```

#### Keeping up to date
For an up to date version of the typings above, check the `UserDataSpec` type in the
[`Strapi.ts`](https://github.com/PhenoML/PhenoUI-figma/blob/main/src/plugin/Strapi.ts)
file in the PhenoUI figma plugin repository.


