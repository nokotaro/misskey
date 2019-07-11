import config from '../../../config';
import { INote } from '../../../models/note';

export default (object: any, note: INote) => {
	let type = 'Announce';

	const attributedTo = `${config.url}/users/${note.userId}`;

	const published = note.createdAt.toISOString();

	let to: string[] = [];
	let cc: string[] = [];

	if (note.visibility == 'public') {
		to = ['https://www.w3.org/ns/activitystreams#Public'];
		cc = [`${attributedTo}/followers`];
	} else if (note.visibility == 'home') {
		to = [`${attributedTo}/followers`];
		cc = ['https://www.w3.org/ns/activitystreams#Public'];
	} else if (note.visibility == 'followers') {
		to = [`${attributedTo}/followers`];
	} else {
		return null;
	}

	if (typeof object === 'string' && object.startsWith('https://twitter.com/i/web/status/')) {
		type = 'View';

		object = {
			type: 'Page',
			url: object
		};
	}

	return {
		id: `${config.url}/notes/${note._id}/activity${(note as unknown as Record<string, boolean>).isEveryone ? '/everyone' : ''}`,
		actor: `${config.url}/users/${note.userId}`,
		type,
		published,
		to,
		cc,
		object
	};
};
