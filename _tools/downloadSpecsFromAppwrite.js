import { Client, Databases, Query } from 'npm:node-appwrite@latest';

/**
 * Download Figma Widget Specs from Appwrite Database
 * 
 * This script downloads all specs from an Appwrite database collection
 * and saves them as JSON files in the hip_ui_widget_spec directory.
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

    // Ensure output directory exists
    const outputDir = `${Deno.cwd()}/hip_ui_widget_spec`;
    try {
        await Deno.mkdir(outputDir, { recursive: true });
    } catch (error) {
        // Directory might already exist, that's fine
    }

    // Fetch all documents
    let page = 1;
    const pageSize = 100;
    let total = 0;
    let response;

    do {
        console.log(`Fetching page ${page}...`);
        response = await databases.listDocuments({
            databaseId: databaseId,
            collectionId: collectionId,
            queries: [
                Query.limit(pageSize),
                Query.offset((page - 1) * pageSize),
                Query.orderAsc('type')
            ]
        });

        for (const doc of response.documents) {
            const spec = {
                type: doc.type,
                mappings: JSON.parse(doc.mappings),
                userData: doc.userData ? JSON.parse(doc.userData) : null,
            };

            const filename = `${outputDir}/${spec.type}.json`;
            console.log(`Saving ${filename}...`);
            await Deno.writeTextFile(filename, JSON.stringify(spec, null, 2));
            total++;
        }

        page++;
    } while (response.documents.length === pageSize);

    console.log(`\n✅ Downloaded ${total} specs successfully!`);
}

main(Deno.args);

