const { default: DriveFile } = require('../built/models/drive-file');
const { default: config } = require('../built/config');

async function main() {
	const files = await DriveFile.find();
	const localFiles = files.filter(x => !x.metadata.deletedAt && !x.metadata.isRemote);
	if (config.drive.storage !== 'minio') {
		console.error('ERROR: Set drive storage to minio.');
		process.exit(1);
	}

	for (const file of localFiles) {
		// const ext = getExt(file, file.contentType);
		await DriveFile.findOneAndUpdate({ _id: file._id }, {
			$set: {
				deletedAt: new Date(),
				isExpired: false
			}
		})
	}

	process.exit(0);
}

main();
