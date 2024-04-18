import deepEql from "https://deno.land/x/deep_eql@v5.0.1/index.js";
async function main(args) {
    // get the url and key args
    let url;
    let key;

    for (const arg of args) {
        const parts = arg.split('=');
        switch (parts[0]) {
            case '--url':
                url = parts[1];
                break;

            case '--key':
                key = parts[1];
                break;

            default:
                console.error(`unknown argument: ${parts[0]}`);
                return;
        }
    }

    if (!url || !key) {
        console.error('Missing required argument, usage: --url=<atrapi_url> --key=<api_key>');
        return;
    }

    const entries = await Deno.readDir(Deno.cwd());
    for await (let entry of entries) {
        if (entry.isDirectory) {
            if (entry.name.startsWith('.') || entry.name.startsWith('_')) {
                continue;
            }
            // test for the existence of the api endpoint
            const endpoint = `/api/${entry.name}`;
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
                    const query = `filters[type][$eq]=${json.type}`;
                    const existing = await fetch(`${url}${endpoint}?${query}`, {
                        headers: {
                            Authorization: `Bearer ${key}`
                        }
                    });

                    console.log(`checking for pre-existing ${json.type}...`);
                    const existingJson = await existing.json();
                    const existingData = existingJson.data || [];
                    if (existingData.length > 0) {
                        console.log(`found ${json.type}, checking for changes in content...`);
                        const existingSpec =  {
                            type: existingData[0].attributes.type,
                            mappings: existingData[0].attributes.mappings,
                            userData: existingData[0].attributes.userData,
                        }

                        if (deepEql(existingSpec, json)) {
                            console.log(`content in server matches local version, skipping ${json.type}...`);
                            continue;
                        }
                    }

                    console.log(`uploading ${json.type}...`);
                    const method = existingData.length > 0 ? 'PUT' : 'POST';
                    const uploadEndpoint = existingData.length > 0 ? `${endpoint}/${existingData[0].id}` : endpoint;
                    const uploadUri = new URL(uploadEndpoint, url);
                    const response = await fetch(uploadUri, {
                        method,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${key}`
                        },
                        body: JSON.stringify({ data: json }),
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