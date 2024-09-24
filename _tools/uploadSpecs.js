import deepEql from "https://deno.land/x/deep_eql@v5.0.1/index.js";
async function main(args) {
    // get the url and key args
    let url;
    let user;
    let pass;
    let collection = 'pheno_ui_widget_specs';

    for (const arg of args) {
        const parts = arg.split('=');
        switch (parts[0]) {
            case '--url':
                url = parts[1];
                break;

            case '--user':
                user = parts[1];
                break;

            case '--password':
                pass = parts[1];
                break;

            case '--collection':
                collection = parts[1];
                break;

            default:
                console.error(`unknown argument: ${parts[0]}`);
                return;
        }
    }

    if (!url || !user || !pass) {
        console.error('Missing required argument, usage: --url=<pheno_ui_url> --user=<user> --password=<password> [--collection=<collection>]');
        return;
    }

    // login to pocketbase
    const loginUri = new URL('/api/admins/auth-with-password', url);
    const loginResponse = await fetch(loginUri, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identity: user, password: pass }),
    });
    const loginJson = await loginResponse.json();

    if (loginResponse.status !== 200 || !loginJson.token) {
        console.error(`failed to login to ${url} [${loginResponse.status} - ${loginResponse.statusText}]: ${(await loginResponse.json()).message}`);
        return;
    }

    const key = loginJson.token;

    const entries = await Deno.readDir(Deno.cwd());
    for await (let entry of entries) {
        if (entry.isDirectory) {
            if (entry.name.startsWith('.') || entry.name.startsWith('_')) {
                continue;
            }

            // test for the existence of the api endpoint
            const endpoint = `/api/collections/${entry.name}`;
            const uri = new URL(endpoint, url);
            console.log(`testing ${uri}...`);
            const response = await fetch(uri, {
                headers: {
                    Authorization: `Bearer ${key}`
                }
            });

            if (response.status !== 200) {
                console.error(`failed to reach ${uri}`);
                continue;
            }

            // read the files in the current folder
            const files = await Deno.readDir(`${Deno.cwd()}/${entry.name}`);
            for await (let file of files) {
                if (file.isFile) {
                    console.log(`reading ${file.name}...`);
                    const data = await Deno.readTextFile(`${Deno.cwd()}/${entry.name}/${file.name}`);
                    const json = JSON.parse(data);
                    // json.type += '-dario';
                    const query = `filter=(type='${json.type}')`;
                    const existing = await fetch(`${url}${endpoint}/records?${query}`, {
                        headers: {
                            Authorization: `Bearer ${key}`
                        }
                    });

                    console.log(`checking for pre-existing ${json.type}...`);
                    const existingJson = await existing.json();
                    const existingData = existingJson.items || [];
                    if (existingData.length > 0) {
                        console.log(`found ${json.type}, checking for changes in content...`);
                        const existingSpec =  {
                            type: existingData[0].type,
                            mappings: existingData[0].mappings,
                            userData: existingData[0].userData,
                        }

                        if (deepEql(existingSpec, json)) {
                            console.log(`content in server matches local version, skipping ${json.type}...`);
                            continue;
                        }
                    }

                    console.log(`uploading ${json.type}...`);
                    const method = existingData.length > 0 ? 'PATCH' : 'POST';
                    const uploadEndpoint = existingData.length > 0 ? `${endpoint}/records/${existingData[0].id}` : `${endpoint}/records`;
                    const uploadUri = new URL(uploadEndpoint, url);
                    const response = await fetch(uploadUri, {
                        method,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${key}`
                        },
                        body: JSON.stringify(json),
                    });

                    if (response.status !== 200) {
                        throw `failed to upload ${json.type} [${response.status}]: ${response.statusText}`;
                    }
                }
            }
        }
    }
}

main(Deno.args);