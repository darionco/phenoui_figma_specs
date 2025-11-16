# Appwrite Database Schema for Figma Widget Specs

## Overview

This document describes the unified database schema for storing Figma Widget Specs in Appwrite. All widget specs follow a consistent structure regardless of their type.

## Database Structure

### Database
- **Name**: `agui`
- **ID**: Auto-generated or provided via `--database` parameter

### Collection
- **Name**: `figma_widget_specs` (default, configurable)
- **Description**: Stores Figma widget specification definitions

## Schema Definition

### Document Structure

Each document in the collection represents a single widget spec and contains the following fields:

```typescript
interface FigmaWidgetSpec {
  // Unique identifier for the widget type (e.g., "Button", "Form", "TextField")
  type: string;
  
  // Lowercase version for case-insensitive lookups
  lowercaseType: string;
  
  // Mapping specification - defines how Figma data maps to output
  // Can be: object, array, string (with special prefixes), number, boolean, or null
  mappings: string; // Stored as JSON string
  
  // User data specification - configuration properties for the plugin
  // Can be: object with property definitions or null
  userData: string | null; // Stored as JSON string, nullable
}
```

### Attributes

| Attribute Name | Type | Required | Array | Description |
|---------------|------|----------|-------|-------------|
| `type` | String | Yes | No | Widget type identifier (e.g., "Button", "Form") |
| `lowercaseType` | String | Yes | No | Lowercase version for case-insensitive searches |
| `mappings` | String | Yes | No | JSON-encoded mapping specification |
| `userData` | String | No | No | JSON-encoded user data specification (nullable) |

### Indexes

1. **idx_type** (Key Index)
   - Fields: `type`
   - Order: ASC
   - Purpose: Fast lookups by widget type

2. **idx_lowercase_type** (Key Index)
   - Fields: `lowercaseType`
   - Order: ASC
   - Purpose: Case-insensitive type searches

## Mapping Specification Structure

The `mappings` field contains a JSON-encoded `MappingSpec` which can be:

- **Object**: `{ "key": "value" | MappingSpec }`
- **Array**: `[MappingSpec, ...]` (used for inheritance patterns)
- **String with special prefixes**:
  - `!literal` - Literal value
  - `#valuePath` - Path to value in Figma node data
  - `$nodePath` - Path to node in Figma document
  - `@inherit` - Inherit mapping from another widget type
  - `%execute` - Execute a function
- **Primitives**: `number | boolean | null`

### Example Mappings

```json
// Simple object mapping
{
  "type": "!figma-button"
}

// Inheritance pattern (common)
[
  "@Frame",
  {
    "type": "!figma-button"
  }
]

// Complex nested mapping
{
  "type": "!figma-text-field",
  "segments": "%getStyledTextSegments(...)",
  "textAutoResize": "#textAutoResize"
}
```

## UserData Specification Structure

The `userData` field contains a JSON-encoded `UserDataSpec` which is an object where:

- **Keys** are property names
- **Values** define property types:
  - `string` - Text input
  - `boolean` - Checkbox
  - `number` - Numeric input
  - `select` - Dropdown with options
  - `group` - Nested group of properties
  - `componentProperty` - Figma component property
  - `lottie` - Lottie animation data
  - `union` - Union type with multiple fields
- **Special key** `@@layout@@` defines the order of properties in the UI

### Example UserData

```json
{
  "@@layout@@": ["id", "keyboardType", ["isPasswordField", "isMultiline"]],
  "id": {
    "type": "string",
    "default": null,
    "description": "id to use in forms"
  },
  "keyboardType": {
    "type": "select",
    "default": "text",
    "options": [
      { "label": "Text", "value": "text" },
      { "label": "Number", "value": "number" }
    ]
  }
}
```

## Usage

### Migration

Run the migration script to create the database, collection, and attributes:

```bash
deno run -A ./_tools/migrateToAppwrite.js \
  --endpoint=https://cloud.appwrite.io/v1 \
  --project=YOUR_PROJECT_ID \
  --key=YOUR_API_KEY \
  --database=YOUR_DATABASE_ID
```

### Upload Specs

Upload all specs from the `hip_ui_widget_spec` directory:

```bash
deno run -A ./_tools/uploadSpecsToAppwrite.js \
  --endpoint=https://cloud.appwrite.io/v1 \
  --project=YOUR_PROJECT_ID \
  --key=YOUR_API_KEY \
  --database=YOUR_DATABASE_ID \
  --collection=figma_widget_specs
```

### Download Specs

Download all specs from Appwrite:

```bash
deno run -A ./_tools/downloadSpecsFromAppwrite.js \
  --endpoint=https://cloud.appwrite.io/v1 \
  --project=YOUR_PROJECT_ID \
  --key=YOUR_API_KEY \
  --database=YOUR_DATABASE_ID \
  --collection=figma_widget_specs
```

## Query Examples

### Get a specific widget spec by type

```javascript
const databases = new Databases(client);
const docs = await databases.listDocuments(
  databaseId,
  collectionId,
  [Query.equal('type', 'Button')]
);
const spec = docs.documents[0];
```

### Case-insensitive type lookup

```javascript
const docs = await databases.listDocuments(
  databaseId,
  collectionId,
  [Query.equal('lowercaseType', 'button')]
);
```

### Get all specs

```javascript
const docs = await databases.listDocuments(
  databaseId,
  collectionId,
  [Query.orderAsc('type')]
);
```

## Notes

- The `mappings` and `userData` fields are stored as JSON strings in Appwrite (since Appwrite doesn't have a native JSON type)
- When reading documents, you'll need to parse these fields: `JSON.parse(doc.mappings)`
- The `lowercaseType` field is automatically generated from `type` for efficient case-insensitive searches
- All widget types must have unique `type` values

