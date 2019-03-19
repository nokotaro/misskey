const { default: DriveFile } = require('../built/models/drive-file');
const { default: config } = require('../built/config');
const { default: deleteFile } = require('../built/services/drive/delete-file');

async function main() {
	const files = await DriveFile.find();
	const localFiles = files.filter(x => !x.metadata.isRemote);
	if (config.drive.storage !== 'minio') {
		console.error('ERROR: Set drive storage to minio.');
		process.exit(1);
	}

	for (const file of localFiles) {
		await deleteFile(file);
	}

	process.exit(0);
}

main();
