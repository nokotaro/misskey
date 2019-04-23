import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import User, { pack } from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーを公式プロデューサーにします。',
		'en-US': 'Mark a user as verified.'
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
				'en-US': 'The user ID which you want to verify'
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
			isVerified: true
		}
	}), me);
});
