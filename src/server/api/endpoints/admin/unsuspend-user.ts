import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User, { pack } from '../../../../models/user';
import { doPostUnsuspend } from '../../../../services/unsuspend-user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーの凍結を解除します。',
		'en-US': 'Unsuspend a user.'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID which you want to unsuspend'
			}
		},
	}
};

export default define(meta, async (ps, me) => {
	const user = await User.findOne({
		_id: ps.userId
	});

	if (user == null) {
		throw new Error('user not found');
	}

	doPostUnsuspend(user);

	return await pack(await User.findOneAndUpdate({
		_id: user._id
	}, {
		$set: {
			isSuspended: false
		}
	}, { returnNewDocument: true }), me);
});
