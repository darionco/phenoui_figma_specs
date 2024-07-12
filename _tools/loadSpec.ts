import {ASTNode, ExpressionNode, KeyValuePairNode, ValueNode} from 'https://deno.land/x/jmespath@v0.2.2/Lexer.ts';
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import {Runtime} from 'https://deno.land/x/jmespath@v0.2.2/Runtime.ts';
import {JSONObject, JSONValue, TYPE_ANY, TYPE_OBJECT, TYPE_STRING} from 'https://deno.land/x/jmespath@v0.2.2/index.ts';
import {TreeInterpreter} from 'https://deno.land/x/jmespath@v0.2.2/TreeInterpreter.ts';
import Parser from 'https://deno.land/x/jmespath@v0.2.2/Parser.ts';

export type JSONFigmaSpec = {
    class: string;
    description: string;
    mappings: ASTNode | null;
    properties: JSONObject | null;
    layout: ASTNode | null;
}

function registerInherit(directory: string, ti: TreeInterpreter) {
    function _inherit(this: Runtime, args: [JSONObject, string, object?]): JSONValue {
        const [_, inherit, extend] = args;

        const components = inherit.split('.');

        const exp = Deno.readTextFileSync(path.join(directory, `${components[0]}.jpath`));
        let base = loadSpecExpression(exp, directory) as JSONValue;

        if (components.length > 1) {
            for (let i = 1; i < components.length; i++) {
                base = (base as JSONObject)[components[i] as string];
            }
        }

        if (typeof base === 'object') {
            return Object.assign({}, base, extend);
        }
        return base;
    }

    ti.runtime.registerFunction('inherit', _inherit,
        [{ types: [TYPE_OBJECT] }, { types: [TYPE_STRING] }, { types: [TYPE_OBJECT], optional: true }]
    );
}

// function registerGenericFunction(name: string, ti: TreeInterpreter) {
//     ti.runtime.registerFunction(
//         name,
//         (args: any[]) => { console.log(args); return `${name}()`; },
//         [{types: [TYPE_ANY], variadic: true}]
//     );
// }

export function loadSpecExpression(expression: string, folder: string): JSONFigmaSpec {
    const ast = Parser.parse(expression) as ExpressionNode;
    const result: JSONFigmaSpec = {
        class: '',
        description: '',
        mappings: null,
        properties: null,
        layout: null,
    };

    const ti = new TreeInterpreter();
    registerInherit(folder, ti);

    for (const ch of ast.children as KeyValuePairNode[]) {
        switch (ch.name) {
            case 'class':
                result.class = (ch.value as ValueNode).value as string;
                break;

            case 'description':
                result.description = (ch.value as ValueNode).value as string;
                break;

            case 'mappings':
                result.mappings = ch.value;
                break;

            case 'properties':
                result.properties = ti.search(ch.value, {}) as JSONObject;
                break;

            case 'layout':
                result.layout = ch.value;
                break;

            default:
                throw `Unknown key: ${ch.name}`;
        }
    }

    return result;
}

export async function loadSpecFile(filePath: string): Promise<JSONFigmaSpec> {
    const expression = await Deno.readTextFile(filePath);
    return loadSpecExpression(expression, path.dirname(filePath));
}
