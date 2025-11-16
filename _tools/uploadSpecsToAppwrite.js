import { Client, Databases, ID, Query } from 'npm:node-appwrite@latest';
import deepEql from "https://deno.land/x/deep_eql@v5.0.1/index.js";

/**
 * Upload Figma Widget Specs to Appwrite Database
 * 
 * This script reads all JSON spec files from the hip_ui_widget_spec directory
 * and uploads them to an Appwrite database collection.
 */

async function main(args) {
    // Parse command line arguments
    let endpoint;
    let projectId;
    let apiKey;
    let databaseId;
    let collectionId = 'figma_widget_specs';

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

    if (!endpoint || !projectId || !apiKey || !databaseId) {
        console.error('Missing required arguments. Usage:');
        console.error('  --endpoint=<appwrite_endpoint>');
        console.error('  --project=<project_id>');
        console.error('  --key=<api_key>');
        console.error('  --database=<database_id>');
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

    // Read specs from hip_ui_widget_spec directory
    const specsDir = `${Deno.cwd()}/hip_ui_widget_spec`;
    const entries = await Deno.readDir(specsDir);

    for await (const entry of entries) {
        if (!entry.isFile || !entry.name.endsWith('.json')) {
            continue;
        }

        console.log(`Reading ${entry.name}...`);
        const data = await Deno.readTextFile(`${specsDir}/${entry.name}`);
        const json = JSON.parse(data);

        // Validate required fields
        if (!json.type) {
            console.warn(`⚠ Skipping ${entry.name}: missing "type" field`);
            continue;
        }

        const spec = {
            type: json.type,
            lowercaseType: json.type.toLowerCase(),
            mappings: json.mappings,
            userData: json.userData,
        };

        // Check if document already exists
        console.log(`Checking for existing spec: ${json.type}...`);
        let existingDoc = null;
        try {
            const existingDocs = await databases.listDocuments({
                databaseId: databaseId,
                collectionId: collectionId,
                queries: [Query.equal('type', json.type)]
            });
            
            if (existingDocs.documents.length > 0) {
                existingDoc = existingDocs.documents[0];
            }
        } catch (error) {
            // Document doesn't exist yet, that's fine
        }

        if (existingDoc) {
            console.log(`Found existing ${json.type}, comparing content...`);
            const existingSpec = {
                type: existingDoc.type,
                lowercaseType: existingDoc.lowercaseType,
                mappings: JSON.parse(existingDoc.mappings),
                userData: existingDoc.userData ? JSON.parse(existingDoc.userData) : null,
            };

            if (deepEql(existingSpec, spec)) {
                console.log(`✓ Content matches, skipping ${json.type}...`);
                continue;
            }

            // Update existing document
            console.log(`Updating ${json.type}...`);
            await databases.updateDocument({
                databaseId: databaseId,
                collectionId: collectionId,
                documentId: existingDoc.$id,
                data: {
                    type: spec.type,
                    lowercaseType: spec.lowercaseType,
                    mappings: JSON.stringify(spec.mappings),
                    userData: spec.userData ? JSON.stringify(spec.userData) : null,
                }
            });
            console.log(`✓ Updated ${json.type}`);
        } else {
            // Create new document
            console.log(`Creating ${json.type}...`);
            await databases.createDocument({
                databaseId: databaseId,
                collectionId: collectionId,
                documentId: ID.unique(),
                data: {
                    type: spec.type,
                    lowercaseType: spec.lowercaseType,
                    mappings: JSON.stringify(spec.mappings),
                    userData: spec.userData ? JSON.stringify(spec.userData) : null,
                }
            });
            console.log(`✓ Created ${json.type}`);
        }
    }

    console.log('\n✅ Upload completed successfully!');
}

main(Deno.args);

