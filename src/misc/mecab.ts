import { spawn } from 'child_process';
import { parse as parseMfm } from '../mfm/parse';
import toText from '../mfm/toText';

interface IMeCabResult {
	noun: string[];
	verb: string[];
}

const dummy = {
	push(_: string) {
		return;
	}
};

function parse(stdout: string): IMeCabResult {
	const noun: string[] = [];
	const verb: string[] = [];

	for (const row of stdout.split('\n')) {
		if (row === 'EOS') {
			break;
		}

		const [k, v = ''] = row.split('\t');
		const value = v.split(',');
		const six = value[6] || '*';
		const key = six.length && six !== '*' ? six : k;
		const [type] = value;

		( // Ignore other types.
			type === '名詞' && !noun.includes(key) ? noun :
			type === '動詞' && !verb.includes(key) ? verb : dummy).push(key);
	}

	return { noun, verb };
}

function mecab(source: string) {
	const mecab = spawn('mecab', ['-d', '/usr/local/lib/mecab/dic/mecab-ipadic-neologd']);
	const buffer: Buffer[] = [];
	const result = new Promise<IMeCabResult>((s, j) => mecab.on('close', x => x ? j() : s(parse(Buffer.concat(buffer).toString()))));

	mecab.stdout.on('data', x => buffer.push(Buffer.from(x)));

	mecab.stdin.write(`${source.replace(/[\n\s\t\u3000]/g, ' ')}\n`);

	mecab.stdin.end();

	return result;
}

export async function getIndexer(note: Partial<Record<'text' | 'cw', string>>) {
	const { text, cw } = note;

	const noun: string[] = [];
	const verb: string[] = [];

	if (text && text.length) {
		const textMeCab = await mecab(toText(parseMfm(text))).catch(_ => ({ noun, verb }));

		for (const n of textMeCab.noun) {
			if (!noun.includes(n)) {
				noun.push(n);
			}
		}

		for (const v of textMeCab.verb) {
			if (!verb.includes(v)) {
				verb.push(v);
			}
		}
	}

	if (cw && cw.length) {
		const cwMeCab = await mecab(toText(parseMfm(cw))).catch(_ => ({ noun, verb }));

		for (const n of cwMeCab.noun) {
			if (!noun.includes(n)) {
				noun.push(n);
			}
		}

		for (const v of cwMeCab.verb) {
			if (!verb.includes(v)) {
				verb.push(v);
			}
		}
	}

	return { noun, verb };
}

export default mecab;
