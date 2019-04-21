import User, { pack } from '../../../../models/user';
import define from '../../define';

export const meta = {
	tags: ['account', 'following'],

	requireCredential: true,

	kind: 'account-write',

	params: {
	}
};

export default define(meta, async (ps, user) => {
	return await pack(await User.findOneAndUpdate({ _id: user._id }, {
		$set: {
			pendingReceivedFollowRequestsCount: 0
		}
	}, { returnNewDocument: true }), user);
});
