import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import {JSONFigmaSpec, loadSpecExpression} from './loadSpec.ts';
import {ASTNode, FunctionNode, KeyValuePairNode, ValueNode} from 'https://deno.land/x/jmespath@v0.2.2/Lexer.ts';
import {TreeInterpreter} from 'https://deno.land/x/jmespath@v0.2.2/TreeInterpreter.ts';
import { JSONObject } from "https://deno.land/x/jmespath@v0.2.2/index.ts";

function getFunctionsFromNode(node: ASTNode, name: string | null = null, result: FunctionNode[] = []): FunctionNode[] {
    if (typeof node !== 'object' || node === null) {
        return result;
    }

    if (node.type === 'Function' && (name === null || node.name === name)) {
        result.push(node);
    }

    if ('children' in node) {
        for (const ch of node.children) {
            getFunctionsFromNode(ch as ASTNode, name, result);
        }
    }

    if ('value' in node) {
        getFunctionsFromNode((node as KeyValuePairNode).value, name, result);
    }

    return result;
}

function getInheritance(spec: ASTNode): { [key: string]: string[] } {
    const result: { [key: string]: string[] } = {};
    if (!('children' in spec)) {
        return result;
    }

    const anySpec = spec as any;
    const inherit = getFunctionsFromNode(anySpec, 'inherit');
    if (inherit.length) {
        for (const node of inherit) {
            const paramNode = node.children[1] as ValueNode;
            const param = paramNode.value as string;
            const parts = param.split('.');
            const parent = parts.shift() as string;
            const parentKey = `[${parent}](${parent}.md)`;
            if (!result[parentKey]) {
                result[parentKey] = [];
            }
            result[parentKey].push(parts.join('.'));
        }
    }

    return result;
}

function getInheritanceContent(spec: ASTNode | null): string {
    if (spec === null) {
        return '';
    }

    const inheritance = getInheritance(spec);
    if (Object.keys(inheritance).length === 0) {
        return '';
    }

    const list = Object.keys(inheritance).map(key => {
        return `<b>${key}</b>${inheritance[key].length ? `[${inheritance[key].join(',')}]` : ''}`;
    }).join(', ');

    return `<span style="color:#888888"><b>Inherits:</b> ${list}</span>`;
}

function getFigmaMappings(spec: ASTNode | null): string {
    if (spec === null) {
        return '';
    }

    const figmaDeps: Set<string> = new Set();

    const handler = {
        get(target: any, name: string) {
            const property = target[name];
            if (typeof property === 'function') {
                return property.bind(target);
            }

            if (typeof name === 'string') {
                const link = `[${name}](https://www.figma.com/plugin-docs/api/node-properties/#${name.toLowerCase()})`
                figmaDeps.add(link);
                return link;
            }

            return property;
        },
    };

    const proxy = new Proxy({}, handler);
    const ti = new TreeInterpreter();
    ti.runtime.callFunction = (name: string, args: any) => {
        let argArr = [];
        if (Array.isArray(args)) {
            argArr = args.map(a => a === proxy ? '@' : a);
        }
        return `${name}(${argArr.join(', ')})`;
    }

    ti.search(spec, proxy);

    const functionNodes = getFunctionsFromNode(spec);
    const functions: Set<string> = new Set();
    functionNodes.forEach(node => functions.add(`[${node.name}](functions/${node.name}.md)`));

    return `
${figmaDeps.size ? `**Figma Node Dependencies**  \n${Array.from(figmaDeps.values()).join('  \n')}` : ''}
    
${functions.size ? `**Functions Used**  \n${Array.from(functions.values()).join('  \n')}` : ''}
    `;
}

function getMappings(spec: JSONFigmaSpec): string {
    if (spec.mappings === null || !('children' in spec.mappings)) {
        return '';
    }

    return `## Mappings
${getInheritanceContent(spec.mappings)}
${getFigmaMappings(spec.mappings)}
`;
}

function getPropertiesContent(properties: JSONObject|JSONObject[], indent: string = ''): string {
    const keys = Object.keys(properties);
    const result: string[] = [];
    for (const key of keys) {
        const prop = (properties as any)[key] as any;
        const label = prop.label ?? key;
        const type = prop.type ? ` <span style="color:#888888; font-size: smaller">[${prop.type}]</span>` : '';
        const title = `<span style="font-size: larger"><b>${label}</b></span>${type}  \n`
        const subKey = 'default' in prop ? 'default' : 'handler' in prop ? 'handler' : 'value' in prop ? 'value' : null;
        const subtitle = subKey ? `<span style="color:#888888; font-size: smaller"><b>${subKey}:</b> ${prop[subKey]}</span>  \n` : '';
        const description = prop.description ? `${prop.description}  \n` : '';

        let extra = '';
        switch (prop.type) {
            case 'select':
                extra = getPropertiesContent(prop.options, `${indent}  `);
                break;

            case 'union':
                extra = getPropertiesContent(prop.fields, `${indent}  `);
                break;
        }

        if (extra) {
            extra = `\n${extra}`;
        }

        result.push(`${indent}- ${title}${subtitle}${description}${extra}`);
    }
    return result.join('  \n');
}

function getProperties(spec: JSONFigmaSpec): string {
    if (spec.properties === null) {
        return '';
    }

    return `## Properties
${getPropertiesContent(spec.properties)}
`;
}


function createContent(spec: string, jsonSpec: JSONFigmaSpec) {
    return `
# ${jsonSpec.class}
${jsonSpec.description}  

<details>
  <summary>JMESPath Expression</summary>\n
\`\`\`jpath
${spec}
\`\`\`
\n</details>

${getProperties(jsonSpec)}
${getMappings(jsonSpec)}
    `;
}
async function main(args: string[]) {
    // get the url and key args
    let input;
    let out = 'docs';

    for (const arg of args) {
        const parts = arg.split('=');
        switch (parts[0]) {
            case '--in':
                input = path.resolve(parts[1]);
                break;

            case '--out':
                out = parts[1];
                break;

            default:
                console.error(`unknown argument: ${parts[0]}`);
                return;
        }
    }

    if (!input) {
        console.error('Missing required argument, usage: --folder=<spec_folder_path> [--out=<output_folder_path>]');
        return;
    }

    const abstract = [];
    const concrete = [];

    const entries = Deno.readDir(path.resolve(input));
    for await (const entry of entries) {
        // ignore all folders and files that start with `.` (hidden files)
        // future Dario: we might want to allow subfolders
        if (!entry.isFile || entry.name.startsWith('.')) {
            continue;
        }

        // only read files with the .jpath extension
        const extension = path.extname(entry.name);
        if (extension !== '.jpath') {
            continue;
        }

        const spec = await Deno.readTextFile(path.join(input, entry.name));
        const jsonSpec = loadSpecExpression(spec, input);

        const content = createContent(spec, jsonSpec);
        const outName = `${path.basename(entry.name, extension)}.md`;
        const outPath = path.join(out, outName);
        await Deno.writeTextFile(outPath, content);

        if (jsonSpec.class.startsWith('_')) {
            abstract.push(outName);
        } else {
            concrete.push(outName);
        }
    }

    const abstractContent = abstract.map(f => `  - [${f.slice(0, -3)}](${f})`).join('\n');
    const concreteContent = concrete.map(f => `  - [${f.slice(0, -3)}](${f})`).join('\n');
    const indexContent = `- **Classes**\n${concreteContent}\n- **Abstract Classes**\n${abstractContent}`;

    await Deno.writeTextFile(path.join(out, '_sidebar.md'), indexContent);
    await Deno.copyFile('./README.md', path.join(out, 'README.md'));
}

// noinspection JSIgnoredPromiseFromCall
main(Deno.args);