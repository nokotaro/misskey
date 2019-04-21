import $ from 'cafy';
import * as bcrypt from 'bcryptjs';
import User, { pack } from '../../../../../models/user';
import define from '../../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		password: {
			validator: $.str
		}
	}
};

export default define(meta, async (ps, user) => {
	// Compare password
	const same = await bcrypt.compare(ps.password, user.password);

	if (!same) {
		throw new Error('incorrect password');
	}

	return await pack(await User.findOneAndUpdate(user._id, {
		$set: {
			'twoFactorSecret': null,
			'twoFactorEnabled': false
		}
	}, { returnNewDocument: true }), user);
});
