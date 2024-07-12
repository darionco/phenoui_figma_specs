import * as jmespath from 'https://deno.land/x/jmespath@v0.2.2/index.ts';
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import { Runtime } from 'https://deno.land/x/jmespath@v0.2.2/Runtime.ts';
import {TreeInterpreter} from 'https://deno.land/x/jmespath@v0.2.2/index.ts';
import {loadSpecFile} from './loadSpec.ts';

function registerInherit(directory: string) {
    function _inherit(this: Runtime, args: [jmespath.JSONObject, string, object?]): any {
        const [root, inherit, extend] = args;

        const components = inherit.split('.');

        const exp = Deno.readTextFileSync(path.join(directory, `${components[0]}.jpath`));
        let base = jmespath.search(root, exp);

        if (components.length > 1) {
            for (let i = 1; i < components.length; i++) {
                base = (base as jmespath.JSONObject)[components[i] as string];
            }
        }

        if (typeof base === 'object') {
            return Object.assign({}, base, extend);
        }
        return base;
    }

    jmespath.registerFunction('inherit', _inherit,
        [{ types: [jmespath.TYPE_OBJECT] }, { types: [jmespath.TYPE_STRING] }, { types: [jmespath.TYPE_OBJECT], optional: true }]
    );
}

function _if(this: Runtime, args: [boolean, jmespath.JSONValue, jmespath.JSONValue?]): any {
    return args[0] ? args[1] : args[2] ?? null;
}

async function main(args: string[]) {
    // get the url and key args
    let filePath: string;

    for (const arg of args) {
        const parts = arg.split('=');
        switch (parts[0]) {
            case '--path':
                filePath = parts[1];
                break;

            default:
                console.error(`Unknown argument: ${parts[0]}`);
                return;
        }
    }

    if (!filePath!) {
        console.error('Missing path argument');
        return;
    }

    const result = await loadSpecFile(filePath!);

    registerInherit(path.dirname(filePath!));
    jmespath.registerFunction(
        'if',
        _if,
        [
            { types: [jmespath.TYPE_BOOLEAN] },
            { types: [jmespath.TYPE_ANY] },
            { types: [jmespath.TYPE_ANY], optional: true }
        ]
    );

    console.log(result.class);
    console.log(result.description);
    console.log(TreeInterpreter.search(result.mappings!, {}));
    console.log(TreeInterpreter.search(result.layout!, {}));

}

main(Deno.args);
