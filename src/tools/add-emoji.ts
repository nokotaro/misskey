import Emoji from '../models/emoji';

async function main(name: string, url: string, alias?: string, contentType?: string): Promise<any> {
	const aliases = alias != null ? [ alias ] : [];
	contentType = contentType || 'image/png';

	await Emoji.insert({
		host: null,
		name,
		url,
		aliases,
		contentType,
		updatedAt: new Date()
	});
}

const args = process.argv.slice(2);
const name = args[0];
const url = args[1];

if (!name) throw 'require name';
if (!url) throw 'require url';

main(name, url).then(() => {
	console.log('success');
	process.exit(0);
}).catch(e => {
	console.warn(e);
	process.exit(1);
});
