import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User, { pack } from '../../../../models/user';
import define from '../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		currentPassword: {
			validator: $.str
		},

		newPassword: {
			validator: $.str
		}
	}
};

export default define(meta, async (ps, user) => {
	// Compare password
	const same = await bcrypt.compare(ps.currentPassword, user.password);

	if (!same) {
		throw new Error('incorrect password');
	}

	// Generate hash of password
	const salt = await bcrypt.genSalt(8);
	const hash = await bcrypt.hash(ps.newPassword, salt);

	return await pack(await User.findOneAndUpdate({ _id: user._id }, {
		$set: {
			'password': hash
		}
	}, { returnNewDocument: true }), user);
});
