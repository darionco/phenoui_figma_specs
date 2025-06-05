import deepEql from "https://deno.land/x/deep_eql@v5.0.1/index.js";
async function main(args) {
    // get the url and key args
    let API_KEY = Deno.env.get("FIREBASE_API_KEY");
    let user = Deno.env.get("FIREBASE_USER");
    let pass = Deno.env.get("FIREBASE_PASSWORD");
    let projectId = Deno.env.get("FIREBASE_PROJECT_ID");

    for (const arg of args) {
        const parts = arg.split('=');
        switch (parts[0]) {
            case '--key':
                API_KEY = parts[1];
                break;

            case '--project':
                projectId = parts[1];
                break;

            case '--user':
                user = parts[1];
                break;

            case '--password':
                pass = parts[1];
                break;

            default:
                console.error(`unknown argument: ${parts[0]}`);
                return;
        }
    }

    if (!API_KEY || !projectId || !user || !pass) {
        console.error('Missing required argument, usage: --url=<pheno_ui_url> --user=<user> --password=<password>');
        return;
    }

    // login to firebase
    const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const loginUri = new URL(loginUrl);
    const credentials = JSON.stringify({
        'email': user,
        'password': pass,
        'returnSecureToken': true
    });
    const credentialsBinary = new TextEncoder().encode(credentials);
    const blobData = new Blob([credentialsBinary], { type: "application/json" });
    const loginResponse = await fetch(loginUri, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: blobData
    });
    const loginJson = await loginResponse.json();

    if (loginResponse.status !== 200 || !loginJson.idToken) {
        console.error(`failed to login to ${loginUrl} [${loginResponse.status} - ${loginResponse.statusText}]: ${loginJson.message}`);
        return;
    }

    const token = loginJson.idToken;
    const firebaseUrl = `https://firestore.googleapis.com`;
    const basePath = `/v1/projects/${projectId}/databases/(default)/documents`;

    const entries = await Deno.readDir(Deno.cwd());
    for await (let entry of entries) {
        if (entry.isDirectory) {
            if (entry.name.startsWith('.') || entry.name.startsWith('_')) {
                continue;
            }

            // test for the existence of the api endpoint
            // Future Dario: this is all wrong and should not be dependent on the folder name
            const collectionEndpoint = `${basePath}/${entry.name}`;
            const uri = new URL(collectionEndpoint, firebaseUrl);
            console.log(`testing ${uri}...`);
            const response = await fetch(uri, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status !== 200) {
                console.error(`failed to reach ${uri}`);
                console.error(`response: ${response.status} - ${response.statusText}`);
                continue;
            }

            const endpoint = `/v1/projects/${projectId}/databases/(default)/documents/${entry.name}`

            // read the files in the current folder
            const files = await Deno.readDir(`${Deno.cwd()}/${entry.name}`);
            for await (let file of files) {
                if (file.isFile) {
                    console.log(`reading ${file.name}...`);
                    const data = await Deno.readTextFile(`${Deno.cwd()}/${entry.name}/${file.name}`);
                    const json = JSON.parse(data);
                    // json.type += '-dario';
                    console.log(`checking for pre-existing ${json.type}...`);
                    const fileEndpoint = `${endpoint}/${json.type}`;
                    const fileUri = new URL(fileEndpoint, firebaseUrl);
                    const existing = await fetch(fileUri, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    const existingJson = await existing.json();
                    if (existing.ok) {
                        console.log(`found ${json.type}, checking for changes in content...`);
                        const decoded = decodeDocument(existingJson);
                        const existingSpec =  {
                            type: decoded.type,
                            mappings: decoded.mappings,
                            userData: decoded.userData,
                        }

                        const decodedJson = decodeValue(encodeValue(json));
                        const fileSpec =  {
                            type: decodedJson.type,
                            mappings: decodedJson.mappings,
                            userData: decodedJson.userData,
                        }

                        if (deepEql(existingSpec, fileSpec)) {
                            console.log(`content in server matches local version, skipping ${json.type}...`);
                            continue;
                        }
                    }

                    console.log(`uploading ${json.type}...`);
                    const method = 'PATCH';
                    const uploadEndpoint = `${collectionEndpoint}/${json.type}`;
                    const uploadUri = new URL(uploadEndpoint, firebaseUrl);
                    console.log(`uploading to ${uploadUri} with method ${method}...`);
                    const response = await fetch(uploadUri, {
                        method,
                        query: {
                            'mask.fieldPaths': ['__name__'],
                        },
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(encodeValue(json).mapValue),
                    });

                    if (response.status !== 200) {
                        console.log(await response.text());
                        throw `failed to upload ${json.type} [${response.status}]: ${response.statusText}`;
                    }
                }
            }
        }
    }
}

class DeleteField {}

function encodeValue(value) {
    if (value === undefined || value instanceof DeleteField) {
        return undefined
    }

    if (value === null) {
        return { nullValue: null }
    }

    if (typeof value === 'boolean') {
        return { booleanValue: value }
    }

    if (typeof value === 'number') {
        return Number.isInteger(value)
            ? { integerValue: value }
            : { doubleValue: value }
    }

    if (typeof value === 'string') {
        return { stringValue: value }
    }

    if (value instanceof Date) {
        return { timestampValue: value.toISOString() }
    }

    // if (value instanceof GeoPoint) {
    //     return { geoPointValue: value.toJSON() }
    // }

    if (Array.isArray(value)) {
        const values = value.map(encodeValue).filter(Boolean)
        return { arrayValue: { values } }
    }

    if (typeof value === 'object') {
        const entries = Object.entries(value)
            .map(([key, value]) => {
                if (key.startsWith('@@') && key.endsWith('@@')) {
                    value = JSON.stringify(value);
                }
                const encodedValue = encodeValue(value)
                return encodedValue ? [key, encodedValue] : undefined
            })
            .filter(Boolean)

        return { mapValue: { fields: Object.fromEntries(entries) } }
    }

    throw new Error('Failed to encode value')
}

function decodeValue(value) {
    if ('nullValue' in value) {
        return null
    }

    if ('booleanValue' in value) {
        return value.booleanValue
    }

    if ('integerValue' in value) {
        return Number(value.integerValue)
    }

    if ('doubleValue' in value) {
        return value.doubleValue
    }

    if ('stringValue' in value) {
        return value.stringValue
    }

    if ('timestampValue' in value) {
        return new Date(value.timestampValue)
    }

    if ('geoPointValue' in value) {
        return new GeoPoint(
            value.geoPointValue.latitude,
            value.geoPointValue.longitude,
        )
    }

    if ('arrayValue' in value) {
        return value.arrayValue.values?.map(decodeValue) ?? []
    }

    if ('mapValue' in value) {
        const entries = Object.entries(value.mapValue.fields ?? {}).map(
            ([key, value]) => [key, decodeValue(value)],
        )
        return Object.fromEntries(entries)
    }

    throw new Error(`Failed to decode value: ${JSON.stringify(value, null, 2)}`)
}

function decodeDocument(document) {
    return {
        id: document.name.split('/').slice(-1)[0],
        ...decodeValue({ mapValue: { fields: document.fields } }),
    }
}

main(Deno.args);