import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as request from 'request';
import { OAuth2 } from 'oauth';
import User, { pack, ILocalUser } from '../../../models/user';
import config from '../../../config';
import { publishMainStream } from '../../../services/stream';
import redis from '../../../db/redis';
import * as uuid from 'uuid';
import signin from '../common/signin';
import fetchMeta from '../../../misc/fetch-meta';

function getUserToken(ctx: Koa.BaseContext) {
	return ((ctx.headers['cookie'] || '').match(/i=(!\w+)/) || [null, null])[1];
}

// Init router
const router = new Router();

router.get('/disconnect/discord', async ctx => {
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
			'discord': null
		}
	});

	ctx.body = `Discordの連携を解除しました :v:`;

	// Publish i updated event
	publishMainStream(user._id, 'meUpdated', await pack(user, user, {
		detail: true,
		includeSecrets: true
	}));
});

async function getOAuth2() {
	const meta = await fetchMeta();

	if (meta.enableDiscordIntegration) {
		return new OAuth2(
			meta.discordClientId,
			meta.discordClientSecret,
			'https://discordapp.com/',
			'api/oauth2/authorize',
			'api/oauth2/token');
	} else {
		return null;
	}
}

router.get('/connect/discord', async ctx => {
	if (!compareOrigin(ctx)) {
		ctx.throw(400, 'invalid origin');
		return;
	}

	const userToken = getUserToken(ctx);
	if (!userToken) {
		ctx.throw(400, 'signin required');
		return;
	}

	const params = {
		redirect_uri: `${config.url}/api/dc/cb`,
		scope: ['identify'],
		state: uuid(),
		response_type: 'code'
	};

	redis.set(userToken, JSON.stringify(params));

	const oauth2 = await getOAuth2();
	ctx.redirect(oauth2.getAuthorizeUrl(params));
});

router.get('/signin/discord', async ctx => {
	const sessid = uuid();

	const params = {
		redirect_uri: `${config.url}/api/dc/cb`,
		scope: ['identify'],
		state: uuid(),
		response_type: 'code'
	};

	const expires = 1000 * 60 * 60; // 1h
	ctx.cookies.set('signin_with_discord_session_id', sessid, {
		path: '/',
		domain: config.host,
		secure: config.url.startsWith('https'),
		httpOnly: true,
		expires: new Date(Date.now() + expires),
		maxAge: expires
	});

	redis.set(sessid, JSON.stringify(params));

	const oauth2 = await getOAuth2();
	ctx.redirect(oauth2.getAuthorizeUrl(params));
});

router.get('/dc/cb', async ctx => {
	const userToken = getUserToken(ctx);

	const oauth2 = await getOAuth2();

	if (!userToken) {
		const sessid = ctx.cookies.get('signin_with_discord_session_id');

		if (!sessid) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const code = ctx.query.code;

		if (!code) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const { redirect_uri, state } = await new Promise<any>((res, rej) => {
			redis.get(sessid, async (_, state) => {
				res(JSON.parse(state));
			});
		});

		if (ctx.query.state !== state) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const { accessToken, refreshToken, expiresDate } = await new Promise<any>((res, rej) =>
			oauth2.getOAuthAccessToken(
				code,
				{
					grant_type: 'authorization_code',
					redirect_uri
				},
				(err, accessToken, refreshToken, result) => {
					if (err)
						rej(err);
					else if (result.error)
						rej(result.error);
					else
					res({
						accessToken,
						refreshToken,
						expiresDate: Date.now() + Number(result.expires_in) * 1000
					});
				}));

		const { id, username, discriminator } = await new Promise<any>((res, rej) =>
			request({
				url: 'https://discordapp.com/api/users/@me',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'User-Agent': config.userAgent
				}
			}, (err, response, body) => {
				if (err)
					rej(err);
				else
					res(JSON.parse(body));
			}));

		if (!id || !username || !discriminator) {
			ctx.throw(400, 'invalid session');
			return;
		}

		let user = await User.findOne({
			host: null,
			'discord.id': id
		}) as ILocalUser;

		if (!user) {
			ctx.throw(404, `@${username}#${discriminator}と連携しているtwistaプロデューサーはありませんでした...`);
			return;
		}

		user = await User.findOneAndUpdate({
			host: null,
			'discord.id': id
		}, {
			$set: {
				discord: {
					accessToken,
					refreshToken,
					expiresDate,
					username,
					discriminator
				}
			}
		}) as ILocalUser;

		signin(ctx, user, true);
	} else {
		const code = ctx.query.code;

		if (!code) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const { redirect_uri, state } = await new Promise<any>((res, rej) => {
			redis.get(userToken, async (_, state) => {
				res(JSON.parse(state));
			});
		});

		if (ctx.query.state !== state) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const { accessToken, refreshToken, expiresDate } = await new Promise<any>((res, rej) =>
			oauth2.getOAuthAccessToken(
				code,
				{
					grant_type: 'authorization_code',
					redirect_uri
				},
				(err, accessToken, refreshToken, result) => {
					if (err)
						rej(err);
					else if (result.error)
						rej(result.error);
					else
						res({
							accessToken,
							refreshToken,
							expiresDate: Date.now() + Number(result.expires_in) * 1000
						});
				}));

		const { id, username, discriminator } = await new Promise<any>((res, rej) =>
			request({
				url: 'https://discordapp.com/api/users/@me',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'User-Agent': config.userAgent
				}
			}, (err, response, body) => {
				if (err)
					rej(err);
				else
					res(JSON.parse(body));
			}));

		if (!id || !username || !discriminator) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const user = await User.findOneAndUpdate({
			host: null,
			token: userToken
		}, {
			$set: {
				discord: {
					accessToken,
					refreshToken,
					expiresDate,
					id,
					username,
					discriminator
				}
			}
		});

		ctx.body = `Discord: @${username}#${discriminator} を、twista: @${user.username} に接続しました！`;

		// Publish i updated event
		publishMainStream(user._id, 'meUpdated', await pack(user, user, {
			detail: true,
			includeSecrets: true
		}));
	}
});

export default router;
