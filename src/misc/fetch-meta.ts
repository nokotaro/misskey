import Meta, { IMeta } from '../models/meta';

const defaultMeta: any = {
	name: 'twista',
	maintainer: {},
	langs: [],
	cacheRemoteFiles: true,
	localDriveCapacityMb: 256,
	remoteDriveCapacityMb: 8,
	hidedTags: [],
	stats: {
		originalNotesCount: 0,
		originalUsersCount: 0
	},
	maxNoteTextLength: 1000,
	enableEmojiReaction: true,
	enableTwitterIntegration: false,
	enableGithubIntegration: false,
	enableDiscordIntegration: false,
	enableExternalUserRecommendation: false,
	externalUserRecommendationEngine: '#',
	externalUserRecommendationTimeout: 300000,
	mascotImageUrl: '#',
	errorImageUrl: '#',
	enableServiceWorker: false
};

export default async function(): Promise<IMeta> {
	const meta = await Meta.findOne({});

	return Object.assign({}, defaultMeta, meta);
}
