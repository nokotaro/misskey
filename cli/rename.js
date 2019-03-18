const { default: DriveFile } = require('../built/models/drive-file');
const { default: config } = require('../built/config');

const getExt = file => {
	const [x] = (file.filename.match(/\.([a-zA-Z0-9_-]+)$/) || []);

	if (x)
		return x;

	if (file.contentType === 'image/jpeg')
		return '.jpg';

	if (file.contentType === 'image/png')
		return '.png';

	if (file.contentType === 'image/webp')
		return '.webp';

	return '';
};

async function main() {
	const files = await DriveFile.find();
	const localFiles = files.filter(x => !x.metadata.deletedAt && !x.metadata.isRemote);
	if (config.drive.storage !== 'minio') {
		console.error('ERROR: Set drive storage to minio.');
		process.exit(1);
	}

	for (const file of localFiles) {
		// const ext = getExt(file, file.contentType);
		console.log(file);
	}

	process.exit(0);
}

main();
