import Meta, { IMeta } from '../models/meta';

const defaultMeta = {
	name: 'twista',
	maintainer: {},
	langs: [] as string[],
	cacheRemoteFiles: true,
	localDriveCapacityMb: 256,
	remoteDriveCapacityMb: 8,
	hidedTags: [] as string[],
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
	externalUserRecommendationTimeout: 3e5,
	mascotImageUrl: '#',
	errorImageUrl: '#',
	enableServiceWorker: false
};

export default async function(): Promise<IMeta> {
	const meta = await Meta.findOne({});

	return Object.assign({}, defaultMeta, meta);
}
