import $ from 'cafy';
import User, { pack } from '../../../../models/user';
import { publishMainStream } from '../../../../services/stream';
import define from '../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		home: {
			validator: $.arr($.obj({
				name: $.str,
				id: $.str,
				place: $.str,
				data: $.obj()
			}).strict())
		}
	}
};

export default define(meta, async (ps, user) => {
	const updated = await User.findOneAndUpdate({ _id: user._id }, {
		$set: {
			'clientSettings.home': ps.home
		}
	}, { returnNewDocument: true });

	publishMainStream(user._id, 'homeUpdated', ps.home);

	return await pack(updated, user);
});
