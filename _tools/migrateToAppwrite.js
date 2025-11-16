import { Client, Databases, ID, Query } from 'npm:node-appwrite@latest';

/**
 * Unified Figma Widget Spec Schema
 * 
 * All widget specs follow this structure:
 * {
 *   type: string (required, unique) - Widget type identifier (e.g., "Button", "Form")
 *   mappings: MappingSpec (required) - Defines how Figma data maps to output
 *   userData: UserDataSpec | null (optional) - Configuration properties for the plugin
 * }
 * 
 * MappingSpec can be:
 * - An object: { "key": "value" | MappingSpec }
 * - An array: [MappingSpec, ...] (for inheritance patterns)
 * - A string with special prefixes: !literal, #valuePath, $nodePath, @inherit, %execute
 * - Primitive: number | boolean | null
 * 
 * UserDataSpec is an object where:
 * - Keys are property names
 * - Values define property types (string, boolean, number, select, group, etc.)
 * - Special key "@@layout@@" defines UI layout order
 */

async function main(args) {
    // Parse command line arguments
    let endpoint;
    let projectId;
    let apiKey;
    let databaseId;
    let collectionId = 'figma_widget_specs'; // default collection name

    for (const arg of args) {
        const parts = arg.split('=');
        switch (parts[0]) {
            case '--endpoint':
                endpoint = parts[1];
                break;
            case '--project':
                projectId = parts[1];
                break;
            case '--key':
                apiKey = parts[1];
                break;
            case '--database':
                databaseId = parts[1];
                break;
            case '--collection':
                collectionId = parts[1];
                break;
            default:
                console.error(`Unknown argument: ${parts[0]}`);
                return;
        }
    }

    // Get from environment if not provided
    endpoint = endpoint || Deno.env.get('APPWRITE_ENDPOINT');
    projectId = projectId || Deno.env.get('APPWRITE_PROJECT_ID');
    apiKey = apiKey || Deno.env.get('APPWRITE_API_KEY');
    databaseId = databaseId || Deno.env.get('APPWRITE_DATABASE_ID');

    if (!endpoint || !projectId || !apiKey) {
        console.error('Missing required arguments. Usage:');
        console.error('  --endpoint=<appwrite_endpoint>');
        console.error('  --project=<project_id>');
        console.error('  --key=<api_key>');
        console.error('  --database=<database_id> (optional, will create if not exists)');
        console.error('  --collection=<collection_id> (optional, defaults to "figma_widget_specs")');
        return;
    }

    // Initialize Appwrite client
    const client = new Client();
    client
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);

    const databases = new Databases(client);

    try {
        // Step 1: Check if database exists, create if it doesn't
        // In Appwrite, ID and name are the same - use the same value for both
        const defaultDbName = 'phenoui_figma_specs';
        const dbIdOrName = databaseId || defaultDbName;
        
        console.log(`Checking if database "${dbIdOrName}" exists...`);
        let dbId;
        try {
            const db = await databases.get({
                databaseId: dbIdOrName
            });
            dbId = db.$id;
            console.log(`✓ Database "${db.name}" already exists with ID: ${dbId}`);
        } catch (error) {
            // Database doesn't exist, create it using the same value for both ID and name
            console.log(`Database "${dbIdOrName}" not found, creating it...`);
            const db = await databases.create({
                databaseId: dbIdOrName, // Use same value for ID
                name: dbIdOrName, // Use same value for name
                enabled: false // not enabled (we'll enable it after setup)
            });
            dbId = db.$id;
            console.log(`✓ Database created with ID: ${dbId}`);
        }

        // Step 2: Check if collection exists, create if it doesn't
        // In Appwrite, ID and name are the same - use the same value for both
        const defaultCollectionName = 'figma_widget_specs';
        const collectionIdOrName = collectionId || defaultCollectionName;
        
        console.log(`Checking if collection "${collectionIdOrName}" exists...`);
        let collection;
        try {
            collection = await databases.getCollection({
                databaseId: dbId,
                collectionId: collectionIdOrName
            });
            console.log(`✓ Collection "${collection.name}" already exists with ID: ${collection.$id}`);
        } catch (error) {
            // Collection doesn't exist, create it using the same value for both ID and name
            console.log(`Collection "${collectionIdOrName}" not found, creating it...`);
            collection = await databases.createCollection({
                databaseId: dbId,
                collectionId: collectionIdOrName, // Use same value for ID
                name: collectionIdOrName, // Use same value for name (ID and name are the same in Appwrite)
                permissions: [
                    // Permissions: allow read for all authenticated users
                    // You may want to adjust these based on your security requirements
                    'read("any")',
                    'create("users")',
                    'update("users")',
                    'delete("users")'
                ],
                enabled: false // not enabled yet
            });
            console.log(`✓ Collection created with ID: ${collection.$id}`);
        }

        const collectionIdFinal = collection.$id;

        // Step 3: Create attributes
        console.log('Creating attributes...');

        // Type attribute (string, required)
        try {
            await databases.getAttribute({
                databaseId: dbId,
                collectionId: collectionIdFinal,
                key: 'type'
            });
            console.log('  ✓ Attribute "type" already exists');
        } catch (error) {
            await databases.createStringAttribute({
                databaseId: dbId,
                collectionId: collectionIdFinal,
                key: 'type',
                size: 255,
                required: true,
                array: false
            });
            console.log('  ✓ Created attribute "type"');
        }

        // Lowercase type for case-insensitive lookups
        try {
            await databases.getAttribute({
                databaseId: dbId,
                collectionId: collectionIdFinal,
                key: 'lowercaseType'
            });
            console.log('  ✓ Attribute "lowercaseType" already exists');
        } catch (error) {
            await databases.createStringAttribute({
                databaseId: dbId,
                collectionId: collectionIdFinal,
                key: 'lowercaseType',
                size: 255,
                required: true,
                array: false
            });
            console.log('  ✓ Created attribute "lowercaseType"');
        }

        // Mappings attribute (JSON) - 10MB max size for JSON strings
        try {
            await databases.getAttribute({
                databaseId: dbId,
                collectionId: collectionIdFinal,
                key: 'mappings'
            });
            console.log('  ✓ Attribute "mappings" already exists');
        } catch (error) {
            await databases.createStringAttribute({
                databaseId: dbId,
                collectionId: collectionIdFinal,
                key: 'mappings',
                size: 10485760, // 10MB (10 * 1024 * 1024 bytes)
                required: true,
                array: false
            });
            console.log('  ✓ Created attribute "mappings"');
        }

        // UserData attribute (JSON, nullable) - 10MB max size for JSON strings
        try {
            await databases.getAttribute({
                databaseId: dbId,
                collectionId: collectionIdFinal,
                key: 'userData'
            });
            console.log('  ✓ Attribute "userData" already exists');
        } catch (error) {
            await databases.createStringAttribute({
                databaseId: dbId,
                collectionId: collectionIdFinal,
                key: 'userData',
                size: 10485760, // 10MB (10 * 1024 * 1024 bytes)
                required: false, // not required (can be null)
                array: false
            });
            console.log('  ✓ Created attribute "userData"');
        }

        // Wait for attributes to be ready
        console.log('Waiting for attributes to be ready...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 4: Create indexes
        console.log('Creating indexes...');

        // Get list of existing indexes to check
        let existingIndexes = [];
        try {
            const indexList = await databases.listIndexes({
                databaseId: dbId,
                collectionId: collectionIdFinal
            });
            existingIndexes = indexList.indexes.map(idx => idx.key);
        } catch (error) {
            console.log('  ⚠ Could not list existing indexes, will attempt to create...');
        }

        // Index on type for fast lookups
        const idxTypeName = 'idx_type';
        if (existingIndexes.includes(idxTypeName)) {
            console.log(`  ✓ Index "${idxTypeName}" already exists`);
        } else {
            try {
                await databases.createIndex({
                    databaseId: dbId,
                    collectionId: collectionIdFinal,
                    key: idxTypeName,
                    type: 'key',
                    attributes: ['type'],
                    orders: ['ASC']
                });
                console.log(`  ✓ Created index "${idxTypeName}"`);
            } catch (error) {
                console.log(`  ⚠ Error creating index "${idxTypeName}":`, error.message);
            }
        }

        // Index on lowercase type for case-insensitive searches
        const idxLowercaseTypeName = 'idx_lowercase_type';
        if (existingIndexes.includes(idxLowercaseTypeName)) {
            console.log(`  ✓ Index "${idxLowercaseTypeName}" already exists`);
        } else {
            try {
                await databases.createIndex({
                    databaseId: dbId,
                    collectionId: collectionIdFinal,
                    key: idxLowercaseTypeName,
                    type: 'key',
                    attributes: ['lowercaseType'],
                    orders: ['ASC']
                });
                console.log(`  ✓ Created index "${idxLowercaseTypeName}"`);
            } catch (error) {
                console.log(`  ⚠ Error creating index "${idxLowercaseTypeName}":`, error.message);
            }
        }

        // Step 5: Enable collection
        try {
            await databases.updateCollection({
                databaseId: dbId,
                collectionId: collectionIdFinal,
                name: 'Figma Widget Specs',
                permissions: [
                    'read("any")',
                    'create("users")',
                    'update("users")',
                    'delete("users")'
                ],
                enabled: true // enabled
            });
            console.log('✓ Collection enabled');
        } catch (error) {
            console.log('⚠ Error enabling collection:', error.message);
        }

        console.log('\n✅ Migration completed successfully!');
        console.log(`\nDatabase ID: ${dbId}`);
        console.log(`Collection ID: ${collectionIdFinal}`);
        console.log('\nYou can now upload specs using the uploadSpecs.js script.');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        Deno.exit(1);
    }
}

main(Deno.args);

