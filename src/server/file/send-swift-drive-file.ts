import * as Koa from 'koa';
import { storage } from 'pkgcloud';
import config from '../../config';
import DriveFile from '../../models/drive-file';
import { contentDisposition } from '../../misc/content-disposition';

export default async function(ctx: Koa.BaseContext) {
	const url = `${config.driveUrl}/swift/${ctx.params.container}/${ctx.params.id}`;

	const file = await DriveFile.findOne({
		$or: [
			{ 'metadata.url': url },
			{ 'metadata.webpublicUrl': url },
			{ 'metadata.thumbnailUrl': url }
		]
	});

	if (!file) {
		ctx.status = 404;
		return;
	}

	ctx.set('Content-Type', file.contentType);
	ctx.set('Content-Disposition', contentDisposition('inline', `${file.filename}"`));

	const swift = storage.createClient(config.drive.config);

	ctx.body = swift.download({
		container: ctx.params.container,
		remote: ctx.params.id
	});
}
