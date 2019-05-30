import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as request from 'request';
import { OAuth2 } from 'oauth';
import User, { pack } from '../../../models/user';
import config from '../../../config';
import { publishMainStream } from '../../../services/stream';
import redis from '../../../db/redis';
import MirroringMastodonApp, { IMirroringMastodonApp } from '../../../models/mirroring-mastodon-app';

function getUserToken(ctx: Koa.BaseContext) {
	return ((ctx.headers['cookie'] || '').match(/i=(!\w+)/) || [null, null])[1];
}

// Init router
const router = new Router();

router.get('/disconnect/mastodon', async ctx => {
	const userToken = getUserToken(ctx);
	if (!userToken) {
		ctx.throw(400, 'signin required');
		return;
	}

	const user = await User.findOneAndUpdate({
		host: null,
		'token': userToken
	}, {
		$set: {
			'mastodon': null
		}
	});

	ctx.body = 'See you again, MASTODONMirror';

	// Publish i updated event
	publishMainStream(user._id, 'meUpdated', await pack(user, user, {
		detail: true,
		includeSecrets: true
	}));
});

async function getOAuth2(hostname: string) {
	const { clientId, clientSecret } =
		await MirroringMastodonApp.findOne({ hostname }) ||
		await new Promise<IMirroringMastodonApp>((res, rej) =>
			request({
				method: 'POST',
				url: `https://${hostname}/api/v1/apps`,
				headers: {
					'User-Agent': config.userAgent
				},
				body: {
					client_name: 'twista mirror',
					redirect_uris: `${config.url}/api/mt/cb/${hostname}`,
					scopes: 'read:accounts write:media write:statuses',
					website: config.url
				},
				json: true
			}, (err, response, body) => {
				if (err) {
					rej(err);
				} else {
					// const { hostname } = new URL(response.url);

					const clientId = body.client_id;

					const clientSecret = body.client_secret;

					if ([hostname, clientId, clientSecret].some(x => typeof x !== 'string')) {
						rej();
					} else {
						res(MirroringMastodonApp.insert({
							hostname,
							clientId,
							clientSecret
						}));
					}
				}
			}));

	return new OAuth2(
		clientId,
		clientSecret,
		`https://${hostname}/`,
		'oauth/authorize',
		'oauth/token');
}

router.get('/connect/mastodon/:hostname', async ctx => {
	const { hostname } = new URL(`https://${ctx.params.hostname}`);

	const userToken = getUserToken(ctx);
	if (!userToken) {
		ctx.throw(400, 'signin required');
		return;
	}

	const params = {
		redirect_uri: `${config.url}/api/mt/cb/${hostname}`,
		scope: ['read:accounts', 'write:media', 'write:statuses'],
		response_type: 'code'
	};

	const oauth2 = await getOAuth2(hostname);

	ctx.redirect(oauth2.getAuthorizeUrl(params));
});

router.get('/mt/cb/:hostname', async ctx => {
	const userToken = getUserToken(ctx);

	const { hostname } = new URL(`https://${ctx.params.hostname}`);

	const oauth2 = await getOAuth2(hostname);

	const code = ctx.query.code;

	if (!code) {
		ctx.throw(400, 'invalid session');
		return;
	}

	const { redirect_uri } = await new Promise<any>((res, rej) => {
		redis.get(userToken, async (_, state) => {
			res(JSON.parse(state));
		});
	});

	const accessToken = await new Promise<string>((res, rej) =>
		oauth2.getOAuthAccessToken(
			code,
			{
				grant_type: 'authorization_code',
				redirect_uri
			},
			(err, accessToken, _, result) => {
				if (err)
					rej(err);
				else if (result.error)
					rej(result.error);
				else
					res(accessToken);
			}));

	const { id, username } = await new Promise<Record<string, string>>((res, rej) =>
		request({
			url: `https://${hostname}/api/v1/accounts/verify_credentials`,
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'User-Agent': config.userAgent
			},
			json: true
		}, (err, response, body) => {
			if (err)
				rej(err);
			else
				res(body);
		}));

	if (!id || !username) {
		ctx.throw(400, 'invalid session');
		return;
	}

	const user = await User.findOneAndUpdate({
		host: null,
		token: userToken
	}, {
		$set: {
			mastodon: {
				hostname,
				accessToken,
				id,
				username
			}
		}
	});

	ctx.body = 'Good Evening, MASTODONMirror';

	// Publish i updated event
	publishMainStream(user._id, 'meUpdated', await pack(user, user, {
		detail: true,
		includeSecrets: true
	}));
});

export default router;
