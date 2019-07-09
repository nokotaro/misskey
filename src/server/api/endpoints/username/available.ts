import $ from 'cafy';
import User from '../../../../models/user';
import { validateUsername } from '../../../../models/user';
import define from '../../define';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	params: {
		username: {
			validator: $.str.pipe(validateUsername)
		}
	}
};

export default define(meta, async (ps) => {
	const usernameLower = ps.username.toLowerCase();

	return {
		available: usernameLower !== 'everyone' && !(await User.count({
			host: null,
			usernameLower
		}, {
			limit: 1
		}))
	};
});
