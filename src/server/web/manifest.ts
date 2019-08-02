import * as Koa from 'koa';
import * as manifest from '../../client/assets/manifest.json';
import * as deepcopy from 'deepcopy';
import fetchMeta from '../../misc/fetch-meta';

module.exports = async (ctx: Koa.BaseContext) => {
	const json = deepcopy(manifest);

	const instance = await fetchMeta();

	json.short_name = instance.name || 'twista';
	json.name = instance.name || 'twista';

	ctx.set({
		'Cache-Control': 'max-age=300',
		'Content-Type': 'application/manifest+json'
	});
	ctx.body = json;
};
