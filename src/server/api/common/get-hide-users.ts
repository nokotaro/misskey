import * as mongo from 'mongodb';
import Mute, { IMute } from '../../../models/mute';
import User, { IUser } from '../../../models/user';
import { unique } from '../../../prelude/array';
import Blocking, { IBlocking } from '../../../models/blocking';

export async function getHideUserIds(me?: IUser) {
	return await getHideUserIdsById(me && me._id);
}

export async function getHideUserIdsById(meId?: mongo.ObjectID) {
	const [suspended, muted, blocking, blocked] = await Promise.all([
		User.find({
			isSuspended: true
		}, {
			fields: {
				_id: true
			}
		}),
		meId ? Mute.find({
			muterId: meId
		}) : Promise.resolve<IMute[]>([]),
		meId ? Blocking.find({
			blockerId: meId
		}) : Promise.resolve<IBlocking[]>([]),
		meId ? Blocking.find({
			blockeeId: meId
		}) : Promise.resolve<IBlocking[]>([])
	]);

	return unique([
		...suspended.map(x => x._id),
		...muted.map(x => x.muteeId),
		...blocking.map(x => x.blockeeId),
		...blocked.map(x => x.blockerId)
	]);
}
