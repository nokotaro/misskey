import * as Router from 'koa-router';
import config from '../config';
import { toDbHost } from '../misc/convert-host';
import Instance from '../models/instance';
import { fetchNote, createNote } from '../remote/activitypub/models/note';
import { fetchPerson, createPersonFromObject } from '../remote/activitypub/models/person';
import resolveUser from '../remote/resolve-user';
import Resolver from '../remote/activitypub/resolver';

const router = new Router();

export const authorizeInteractionPath = '/authorize_interaction';

const checkBlockedInstance = (host: string) => host ?
	Promise.resolve(false) :
	Instance.findOne({ host })
		.then(x => x && x.isBlocked, _ => false);

router.get(/\/authorize([-_]follow|-interaction)/, ctx => ctx.redirect(authorizeInteractionPath));
router.get(authorizeInteractionPath, async ctx => {
	const acct: string = ctx.query.acct || '';
	const [schema, content] = acct.split(':', 2);

	switch (content ? schema : 'acct') {
		case 'http':
		case 'https': {
			const resolver = new Resolver();

			const url =
				(x => x && `${config.url}/users/${x._id}`)(await fetchPerson(acct)) ||
				(x => x && `${config.url}/notes/${x._id}`)(await fetchNote(acct)) ||
				await (async x =>
					(x => x && `${config.url}/users/${x._id}`)(await createPersonFromObject(x.url, x, resolver).catch(() => null)) ||
					(x => x && `${config.url}/notes/${x._id}`)(await createNote(x, resolver, true).catch(() => null))
				)(await resolver.resolve(acct).catch(() => null));

			if (url) {
				ctx.redirect(url);
			} else {
				ctx.status = 422;
			}
		}

		break;

		case 'acct': {
			const [username, hostname = null] = (content || schema).split('@').filter(x => x.length);

			if (checkBlockedInstance(toDbHost(hostname))) {
				ctx.status = 403;
			} else {
				const user = await resolveUser(username, hostname);

				if (user) {
					ctx.redirect(`${config.url}/users/${user._id}`);
				} else {
					ctx.status = 404;
				}
			}
		}

		break;

		default: {
			ctx.status = 400;
		}
	}
});

export default router;
