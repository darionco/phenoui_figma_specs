async function getSpecs(url, key, page = 1, pageSize = 100) {
    const query = `pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    const uri = new URL(`/api/figma-widget-specs?${query}`, url);
    const response = await fetch(uri, {
        headers: {
            Authorization: `Bearer ${key}`
        }
    });

    return await response.json();
}

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
                console.error(`Unknown argument: ${parts[0]}`);
                return;
        }
    }

    if (!url || !key) {
        console.error('Missing required argument, usage: --url=<atrapi_url> --key=<api_key>');
        return;
    }

    let pageCount;
    let page = 1;
    do {
        const { data, meta } = await getSpecs(url, key, page, 10);
        pageCount = meta.pagination.pageCount;
        console.log(`Page ${page} of ${pageCount}`);
        for (const spec of data) {
            console.log(`Saving figma-widget-specs/${spec.attributes.type}.json...`);
            const data = {
                type: spec.attributes.type,
                mappings: spec.attributes.mappings,
                userData: spec.attributes.userData,
            }
            const file = `figma-widget-specs/${spec.attributes.type}.json`;
            await Deno.writeTextFile(file, JSON.stringify(data, null, 2));
        }
        page++;
    } while (page <= pageCount);
}

main(Deno.args);