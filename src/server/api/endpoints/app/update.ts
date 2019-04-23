import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import App, { pack } from '../../../../models/app';
import define from '../../define';
import { ApiError } from '../../error';

export const meta = {
	tags: ['app'],

	params: {
		appId: {
			validator: $.type(ID),
			transform: transform
		},

		name: {
			validator: $.optional.nullable.str,
			default: null as string
		},

		description: {
			validator: $.optional.nullable.str,
			default: null as string
		},

		permission: {
			validator: $.optional.nullable.arr($.str).unique(),
			default: null as string[]
		},

		callbackUrl: {
			validator: $.optional.nullable.str,
			default: null as string
		}
	},

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: 'dce83913-2dc6-4093-8a7b-71dbb11718a3'
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '127d9599-b547-4798-9df6-f319001585c9'
		}
	}
};

export default define(meta, async (ps, user, app) => {
	const ap = await App.findOne({ _id: ps.appId });

	if (!app && user && ap.userId.equals(user._id)) {
		// Lookup app
		const ap = await App.findOneAndUpdate({ _id: ps.appId }, {
			...(ps.name ? { name: ps.name } : {}),
			...(ps.description ? { description: ps.description } : {}),
			...(ps.permission ? { permission: ps.permission } : {}),
			...(ps.callbackUrl ? { callbackUrl: ps.callbackUrl } : {})
		});

		if (ap === null) {
			throw new ApiError(meta.errors.noSuchApp);
		}

		return await pack(ap, user, {
			detail: true,
			includeSecret: true
		});
	} else {
		throw new ApiError(meta.errors.accessDenied);
	}
});
