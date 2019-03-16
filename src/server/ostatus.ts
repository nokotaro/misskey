import * as Router from 'koa-router';
import { fetchNote, createNote } from '../remote/activitypub/models/note';
import { fetchPerson, createPersonFromObject } from '../remote/activitypub/models/person';
import Resolver from '../remote/activitypub/resolver';
import config from '../config';

const router = new Router();

export const authorizeInteractionPath = '/authorize_interaction';

router.get(/\/authorize([-_]follow|-interaction)/, ctx => ctx.redirect(authorizeInteractionPath));
router.get(authorizeInteractionPath, async ctx => {
	const acct: string = ctx.query.acct;
	const resolver = new Resolver();

	const url =
		(x => x && `${config.url}/users/${x._id}`)(await fetchPerson(acct)) ||
		(x => x && `${config.url}/notes/${x._id}`)(await fetchNote(acct)) ||
		await (async x =>
			(x => x && `${config.url}/users/${x._id}`)(await createPersonFromObject(x, resolver).catch(() => null)) ||
			(x => x && `${config.url}/notes/${x._id}`)(await createNote(x, resolver, true).catch(() => null))
		)(await resolver.resolve(acct));

	if (url)
		ctx.redirect(url);
	else
		ctx.status = 422;
});

export default router;
