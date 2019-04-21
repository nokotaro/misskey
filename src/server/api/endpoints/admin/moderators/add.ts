import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import define from '../../../define';
import User, { pack } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーをモデレーターにします。',
		'en-US': 'Mark a user as moderator.'
	},

	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーID',
				'en-US': 'The user ID'
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

	return await pack(await User.findOneAndUpdate({
		_id: user._id
	}, {
		$set: {
			isModerator: true
		}
	}, { returnNewDocument: true }), me);
});
