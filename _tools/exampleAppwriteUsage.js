import { Client, Databases, Query } from 'npm:node-appwrite@latest';

/**
 * Example: Querying Figma Widget Specs from Appwrite
 * 
 * This example demonstrates how to query widget specs from Appwrite
 * using the Node.js SDK.
 */

// Initialize Appwrite client
const client = new Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite endpoint
    .setProject('YOUR_PROJECT_ID') // Your project ID
    .setKey('YOUR_API_KEY'); // Your API key

const databases = new Databases(client);
const databaseId = 'YOUR_DATABASE_ID';
const collectionId = 'figma_widget_specs';

// Example 1: Get a specific widget spec by type
async function getWidgetSpecByType(type) {
    const response = await databases.listDocuments({
        databaseId: databaseId,
        collectionId: collectionId,
        queries: [Query.equal('type', type)]
    });
    
    if (response.documents.length === 0) {
        console.log(`No spec found for type: ${type}`);
        return null;
    }
    
    const doc = response.documents[0];
    return {
        type: doc.type,
        mappings: JSON.parse(doc.mappings),
        userData: doc.userData ? JSON.parse(doc.userData) : null,
    };
}

// Example 2: Case-insensitive type lookup
async function getWidgetSpecCaseInsensitive(type) {
    const response = await databases.listDocuments({
        databaseId: databaseId,
        collectionId: collectionId,
        queries: [Query.equal('lowercaseType', type.toLowerCase())]
    });
    
    if (response.documents.length === 0) {
        return null;
    }
    
    const doc = response.documents[0];
    return {
        type: doc.type,
        mappings: JSON.parse(doc.mappings),
        userData: doc.userData ? JSON.parse(doc.userData) : null,
    };
}

// Example 3: Get all widget specs
async function getAllWidgetSpecs() {
    const specs = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
        const response = await databases.listDocuments({
            databaseId: databaseId,
            collectionId: collectionId,
            queries: [
                Query.limit(limit),
                Query.offset(offset),
                Query.orderAsc('type')
            ]
        });
        
        for (const doc of response.documents) {
            specs.push({
                type: doc.type,
                mappings: JSON.parse(doc.mappings),
                userData: doc.userData ? JSON.parse(doc.userData) : null,
            });
        }
        
        if (response.documents.length < limit) {
            break;
        }
        
        offset += limit;
    }
    
    return specs;
}

// Example 4: Create a new widget spec
async function createWidgetSpec(spec) {
    const { Client, Databases, ID } = await import('npm:node-appwrite@latest');
    const databases = new Databases(client);
    
    return await databases.createDocument({
        databaseId: databaseId,
        collectionId: collectionId,
        documentId: ID.unique(),
        data: {
            type: spec.type,
            lowercaseType: spec.type.toLowerCase(),
            mappings: JSON.stringify(spec.mappings),
            userData: spec.userData ? JSON.stringify(spec.userData) : null,
        }
    });
}

// Example 5: Update an existing widget spec
async function updateWidgetSpec(documentId, spec) {
    return await databases.updateDocument({
        databaseId: databaseId,
        collectionId: collectionId,
        documentId: documentId,
        data: {
            type: spec.type,
            lowercaseType: spec.type.toLowerCase(),
            mappings: JSON.stringify(spec.mappings),
            userData: spec.userData ? JSON.stringify(spec.userData) : null,
        }
    });
}

// Example usage
async function main() {
    try {
        // Get Button spec
        const buttonSpec = await getWidgetSpecByType('Button');
        console.log('Button spec:', buttonSpec);
        
        // Get all specs
        const allSpecs = await getAllWidgetSpecs();
        console.log(`Total specs: ${allSpecs.length}`);
        
        // Case-insensitive lookup
        const formSpec = await getWidgetSpecCaseInsensitive('FORM');
        console.log('Form spec:', formSpec);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Uncomment to run examples:
// main();


