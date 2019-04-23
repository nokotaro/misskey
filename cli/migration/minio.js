const { default: DriveFile } = require('../../built/models/drive-file');
const { default: config } = require('../../built/config');
const request = require('request-promise-native');
const contentDisposition = require('content-disposition');
const minio = new (require('minio').Client)(config.drive.config);

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

const getBuf = url => request(url).then(x => Buffer.from([...x])).catch(_ => null);

const putBuf = (key, buf, type, name) => minio.putObject(config.drive.bucket, key, buf, null, {
	'Content-Type': type,
	'Cache-Control': 'max-age=31536000, immutable',
	...(name ? {
		'Content-Disposition': contentDisposition(name, {
			type: 'inline',
			fallback: name.replace(/[^\w.-]/g, '_')
		})
	} : {})
});

async function main() {
	const files = await DriveFile.find();
	const localFiles = files.filter(x => !x.metadata.deletedAt && !x.metadata.isRemote);
	if (config.drive.storage !== 'minio') {
		console.error('ERROR: Set drive storage to minio.');
		process.exit(1);
	}

	for (const file of localFiles) {
		const ext = getExt(file, file.contentType);

		const baseUrl = config.drive.baseUrl ||
			`${config.drive.config.useSSL ? 'https' : 'http'}://${config.drive.config.endPoint}${config.drive.config.port ? `:${config.drive.config.port}` : ''}/${config.drive.bucket}`;

		const key = `${config.drive.prefix}/${file.filename.replace(new RegExp(`${ext}$`), '')}${ext}`;
		const url = `${baseUrl}/${key}`;

		let webpublicKey = null;
		let webpublicUrl = null;

		let thumbnailKey = null;
		let thumbnailUrl = null;

		const origin = `http://localhost:${config.port}/files/${file._id}`;

		const original = await getBuf(`${origin}?original=${file.metadata.accessKey}`);
		const webpublic = await getBuf(`${origin}?web`);
		const thumbnail = await getBuf(`${origin}?thumbnail`);

		if (original)
			await putBuf(key, original, file.contentType, file.filename);

		if (webpublic)
			await putBuf(key, webpublic, file.contentType, file.filename);

		if (thumbnail)
			await putBuf(key, thumbnail, file.contentType);

		await DriveFile.update({ _id: file._id }, {
			metadata: {
				...file.metadata,
				withoutChunks: true,
				storage: 'minio',
				storageProps: {
					key,
					webpublicKey,
					thumbnailKey,
				},
				url,
				webpublicUrl,
				thumbnailUrl
			}
		});
	}

	process.exit(0);
}

main();
