import { spawn } from 'child_process';
import { parse as parseMfm } from '../mfm/parse';
import toText from '../mfm/toText';

const dummy = {
	includes(_) {
		return true;
	},

	push(_) {
		return 0;
	}
} as string[];

export const containerMap = {
	'フィラー': 'filler' as const,
	'感動詞': 'interjection' as const,
	'形容詞': 'adjective' as const,
	'動詞': 'verb' as const,
	'名詞': 'noun' as const,
};

export const mecabIndexVersion = 3;

export const droppedndexVersion = -1;

export type ContainerMap = typeof containerMap;

export type MeCabResult = Record<ContainerMap[keyof ContainerMap], string[]>;

function parse(stdout: string) {
	const containers: MeCabResult = {
		filler: [],
		interjection: [],
		adjective: [],
		verb: [],
		noun: [],
	};

	for (const row of stdout.split('\n')) {
		if (row === 'EOS') {
			break;
		}

		const [k, v = ''] = row.split('\t');
		const value = v.split(',');
		const six = value[6] || '*';
		const key = six.length && six !== '*' ? six : k;
		const [type] = value;
		const container = containers[containerMap[type as keyof ContainerMap]] || dummy;

		if (!container.includes(key)) {
			container.push(key);
		}
	}

	return containers;
}

function mecab(source: string) {
	const mecab = spawn('mecab', ['-d', '/usr/local/lib/mecab/dic/mecab-ipadic-neologd']);
	const buffer: Buffer[] = [];
	const result = new Promise<MeCabResult>((s, j) => mecab.on('close', x => x ? j() : s(parse(Buffer.concat(buffer).toString()))));

	mecab.stdout.on('data', x => buffer.push(Buffer.from(x)));

	mecab.stdin.write(`${source.replace(/[\n\s\t\u3000]/g, ' ')}\n`);

	mecab.stdin.end();

	return result;
}

export async function getIndexer(note: Partial<Record<'text' | 'cw', string>>) {
	const { text, cw } = note;

	const containers: MeCabResult = {
		filler: [],
		interjection: [],
		adjective: [],
		verb: [],
		noun: [],
	};

	for (const source of [text, cw]) {
		const result = await mecab(toText(parseMfm(source))).catch(_ => containers);

		for (const [key, container] of Object.entries(containers) as [keyof MeCabResult, MeCabResult[keyof MeCabResult]][]) {
			for (const value of result[key]) {
				if (!container.includes(value)) {
					container.push(value);
				}
			}
		}
	}

	return containers;
}

export default mecab;
