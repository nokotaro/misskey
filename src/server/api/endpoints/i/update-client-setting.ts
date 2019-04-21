import $ from 'cafy';
import User, { pack } from '../../../../models/user';
import { publishMainStream } from '../../../../services/stream';
import define from '../../define';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		name: {
			validator: $.str
		},

		value: {
			validator: $.nullable.any
		}
	}
};

export default define(meta, async (ps, user) => {
	const x: any = {};
	x[`clientSettings.${ps.name}`] = ps.value;

	const updated = await User.findOneAndUpdate(user._id, {
		$set: x
	}, { returnNewDocument: true });

	// Publish event
	publishMainStream(user._id, 'clientSettingUpdated', {
		key: ps.name,
		value: ps.value
	});

	return await pack(updated, user);
});
