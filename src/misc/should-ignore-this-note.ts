import isObjectId from './is-objectid';
import Blocking from '../models/blocking';

function toString(id: any) {
	return isObjectId(id) ? id.toHexString() : id;
}

export default (note: any, ignoredUserIds: string[]) => Promise.resolve(
	ignoredUserIds.includes(toString(note.userId)) ||
	note.reply && ignoredUserIds.includes(toString(note.reply.userId)) ||
	note.renote && ignoredUserIds.includes(toString(note.renote.userId)) ||
	Blocking.find({ blocker: note.userId })
		.then(x => x.map(x => x.blockeeId.toHexString()))
		.then(x =>
			x.includes(toString(note.userId)) ||
			note.reply && x.includes(toString(note.reply.userId)) ||
			note.renote && x.includes(toString(note.renote.userId))));
