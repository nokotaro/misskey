import $ from 'cafy';
import define from '../../define';
import Hashtag from '../../../../models/hashtag';
import fetchMeta from '../../../../misc/fetch-meta';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		attachedToUserOnly: {
			validator: $.optional.bool,
			default: false
		},

		attachedToLocalUserOnly: {
			validator: $.optional.bool,
			default: false
		},

		attachedToRemoteUserOnly: {
			validator: $.optional.bool,
			default: false
		},

		applyHiddenRules: {
			validator: $.optional.bool,
			default: false
		},

		sort: {
			validator: $.str.or([
				'+mentionedUsers',
				'-mentionedUsers',
				'+mentionedLocalUsers',
				'-mentionedLocalUsers',
				'+mentionedRemoteUsers',
				'-mentionedRemoteUsers',
				'+attachedUsers',
				'-attachedUsers',
				'+attachedLocalUsers',
				'-attachedLocalUsers',
				'+attachedRemoteUsers',
				'-attachedRemoteUsers',
			]),
		},
	},

	res: {
		type: 'array',
		items: {
			type: 'Hashtag'
		}
	},
};

const sort: any = {
	'+mentionedUsers': { mentionedUsersCount: -1 },
	'-mentionedUsers': { mentionedUsersCount: 1 },
	'+mentionedLocalUsers': { mentionedLocalUsersCount: -1 },
	'-mentionedLocalUsers': { mentionedLocalUsersCount: 1 },
	'+mentionedRemoteUsers': { mentionedRemoteUsersCount: -1 },
	'-mentionedRemoteUsers': { mentionedRemoteUsersCount: 1 },
	'+attachedUsers': { attachedUsersCount: -1 },
	'-attachedUsers': { attachedUsersCount: 1 },
	'+attachedLocalUsers': { attachedLocalUsersCount: -1 },
	'-attachedLocalUsers': { attachedLocalUsersCount: 1 },
	'+attachedRemoteUsers': { attachedRemoteUsersCount: -1 },
	'-attachedRemoteUsers': { attachedRemoteUsersCount: 1 },
};

export default define(meta, async (ps, me) => {
	const instance = await fetchMeta();
	const hidedTags = instance.hidedTags.map(t => t.toLowerCase());
	const q = {} as any;
	if (ps.attachedToUserOnly) q.attachedUsersCount = { $ne: 0 };
	if (ps.attachedToLocalUserOnly) q.attachedLocalUsersCount = { $ne: 0 };
	if (ps.attachedToRemoteUserOnly) q.attachedRemoteUsersCount = { $ne: 0 };
	const tags = await Hashtag
		.find(q, {
			limit: ps.limit,
			sort: sort[ps.sort],
			fields: {
				tag: true,
				mentionedUsersCount: true,
				mentionedLocalUsersCount: true,
				mentionedRemoteUsersCount: true,
				attachedUsersCount: true,
				attachedLocalUsersCount: true,
				attachedRemoteUsersCount: true
			}
		});

	return ps.applyHiddenRules ? tags.filter(x => !hidedTags.includes(x.tag.toLowerCase())) : tags;
});
