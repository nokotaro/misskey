import * as mongo from 'mongodb';
import * as deepcopy from 'deepcopy';
import rap from '@prezzemolo/rap';
import db from '../db/mongodb';
import isObjectId from '../misc/is-objectid';
import { packMany as packNoteMany } from './note';
import Following from './following';
import Blocking from './blocking';
import Mute from './mute';
import { getFriendIds } from '../server/api/common/get-friends';
import config from '../config';
import FollowRequest from './follow-request';
import fetchMeta from '../misc/fetch-meta';
import { dbLogger } from '../db/logger';
import { validActor } from '../remote/activitypub/type';
import packEmojis from '../misc/pack-emojis';

const User = db.get<IUser>('users');

User.createIndex('createdAt');
User.createIndex('updatedAt');
User.createIndex('followersCount');
User.createIndex('tags');
User.createIndex('isSuspended');
User.createIndex('username');
User.createIndex('usernameLower');
User.createIndex('host');
User.createIndex(['username', 'host'], { unique: true });
User.createIndex(['usernameLower', 'host'], { unique: true });
User.createIndex('token', { sparse: true, unique: true });
User.createIndex('uri', { sparse: true, unique: true });
User.createIndex('twitterId', { sparse: true, unique: true });
User.createIndex('twitter.userId');

export default User;

type IUserBase = {
	_id: mongo.ObjectID;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
	followersCount: number;
	followingCount: number;
	name?: string;
	notesCount: number;
	username: string;
	usernameLower: string;
	avatarId: mongo.ObjectID;
	bannerId: mongo.ObjectID;
	avatarUrl?: string;
	bannerUrl?: string;
	avatarColor?: any;
	bannerColor?: any;
	wallpaperId: mongo.ObjectID;
	wallpaperUrl?: string;
	data: any;
	description: string;
	pinnedNoteIds: mongo.ObjectID[];
	emojis?: string[];
	tags?: string[];

	isDeleted: boolean;

	/**
	 * 凍結されているか否か
	 */
	isSuspended: boolean;

	/**
	 * サイレンスされているか否か
	 */
	isSilenced: boolean;

	/**
	 * 鍵プロデューサーか否か
	 */
	isLocked: boolean;

	/**
	 * Botか否か
	 */
	isBot: boolean;

	/**
	 * Botからのフォローを承認制にするか
	 */
	carefulBot: boolean;

	/**
	 * フォローしているユーザーからのフォローリクエストを自動承認するか
	 */
	autoAcceptFollowed: boolean;

	/**
	 * このプロデューサーに届いているフォローリクエストの数
	 */
	pendingReceivedFollowRequestsCount: number;

	host: string;
};

export interface ILocalUser extends IUserBase {
	host: null;
	keypair: string;
	email: string;
	emailVerified?: boolean;
	emailVerifyCode?: string;
	password: string;
	token: string;
	twitter: {
		accessToken: string;
		accessTokenSecret: string;
		userId: string;
		screenName: string;
	};
	github: {
		accessToken: string;
		id: string;
		login: string;
	};
	discord: {
		accessToken: string;
		refreshToken: string;
		expiresDate: number;
		id: string;
		username: string;
		discriminator: string;
	};
	mastodon: {
		hostname: string;
		accessToken: string;
		id: string;
		username: string;
		preferBoost: boolean;
	};
	profile: {
		location: string;
		birthday: string; // 'YYYY-MM-DD'
		tags: string[];
	};
	fields?: {
		name: string;
		value: string;
	}[];
	isKaho: boolean;
	isCat: boolean;
	isAdmin?: boolean;
	isModerator?: boolean;
	isVerified?: boolean;
	avatarAngle?: string;
	twoFactorSecret: string;
	twoFactorEnabled: boolean;
	twoFactorTempSecret?: string;
	clientSettings: any;
	settings: {
		autoWatch: boolean;
		alwaysMarkNsfw?: boolean;
	};
	hasUnreadNotification: boolean;
	hasUnreadMessagingMessage: boolean;
}

interface INotLocalUser extends IUserBase {
	uri: string;
	isKaho: false;
	isCat: false;
	isAdmin: false;
	isModerator: false;
	lastFetchedAt: Date;
}

export interface ITwitterUser extends INotLocalUser {
	host: 'twitter.com';
	twitterId: string;
	originalFollowersCount: number;
	friendsCount: number;
	profile: {
		location: string;
	};
}

export interface IRemoteUser extends INotLocalUser {
	inbox: string;
	sharedInbox?: string;
	outbox?: string;
	featured?: string;
	endpoints: string[];
	url?: string;
	publicKey: {
		id: string;
		publicKeyPem: string;
	};
	// isApplication?: boolean;
	// isGroup?: boolean;
	isOrganization?: boolean;
	isPerson?: boolean;
	isService?: boolean;
}

export type IUser = ILocalUser | ITwitterUser | IRemoteUser;

export const isLocalUser = (user: any): user is ILocalUser =>
	user.host === null;

export const isTwitterUser = (user: any): user is ITwitterUser =>
	user.host === 'twitter.com';

export const isRemoteUser = (user: any): user is IRemoteUser =>
	![null, 'twitter.com'].includes(user.host);

//#region Validators
export function validateUsername(username: string, remote = false): boolean {
	return typeof username == 'string' && (remote ? /^\w([\w-]*\w)?$/ : /^\w{1,20}$/).test(username);
}

export function validatePassword(password: string): boolean {
	return typeof password == 'string' && password != '';
}

export function isValidName(name?: string): boolean {
	return name === null || (typeof name == 'string' && name.length < 50 && name.trim() != '');
}

export function isValidDescription(description: string): boolean {
	return typeof description == 'string' && description.length < 500 && description.trim() != '';
}

export function isValidLocation(location: string): boolean {
	return typeof location == 'string' && location.length < 50 && location.trim() != '';
}

export function isValidBirthday(birthday: string): boolean {
	return typeof birthday == 'string' && /^([0-9]{4})\-([0-9]{2})-([0-9]{2})$/.test(birthday);
}

export function isValidAngle(angle: string): boolean {
	return typeof angle == 'string' && /^([+-]?(\d*\.)?\d+(deg|g?rad|turn)|0|initial|inherit|unset|revert)$/.test(angle);
}
//#endregion

export async function getRelation(me: mongo.ObjectId, target: mongo.ObjectId) {
	const [following1, following2, followReq1, followReq2, toBlocking, fromBlocked, mute] = await Promise.all([
		Following.findOne({
			followerId: me,
			followeeId: target
		}),
		Following.findOne({
			followerId: target,
			followeeId: me
		}),
		FollowRequest.findOne({
			followerId: me,
			followeeId: target
		}),
		FollowRequest.findOne({
			followerId: target,
			followeeId: me
		}),
		Blocking.findOne({
			blockerId: me,
			blockeeId: target
		}),
		Blocking.findOne({
			blockerId: target,
			blockeeId: me
		}),
		Mute.findOne({
			muterId: me,
			muteeId: target
		})
	]);

	return {
		id: target,
		isFollowing: following1 !== null,
		hasPendingFollowRequestFromYou: followReq1 !== null,
		hasPendingFollowRequestToYou: followReq2 !== null,
		isFollowed: following2 !== null,
		isBlocking: toBlocking !== null,
		isBlocked: fromBlocked !== null,
		isMuted: mute !== null
	};
}

/**
 * Pack a user for API response
 *
 * @param user target
 * @param me? serializee
 * @param options? serialize options
 * @return Packed user
 */
export const pack = (
	user: string | mongo.ObjectID | IUser,
	me?: string | mongo.ObjectID | IUser,
	options?: {
		detail?: boolean,
		includeSecrets?: boolean,
		includeHasUnreadNotes?: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = Object.assign({
		detail: false,
		includeSecrets: false
	}, options);

	let _user: any;

	const fields = opts.detail ? {} : {
		name: true,
		username: true,
		host: true,
		avatarColor: true,
		avatarUrl: true,
		emojis: true,
		avatarAngle: true,
		...(validActor.reduce<Record<string, boolean>>((a, c) => (a[`is${c}`] = true, a), {})),
		isKaho: true,
		isCat: true,
		isBot: true,
		isAdmin: true,
		isVerified: true
	};

	// Populate the user if 'user' is ID
	if (isObjectId(user)) {
		_user = await User.findOne({
			_id: user
		}, { fields });
	} else if (typeof user === 'string') {
		_user = await User.findOne({
			_id: new mongo.ObjectID(user)
		}, { fields });
	} else {
		_user = deepcopy(user);
	}

	// (データベースの欠損などで)ユーザーがデータベース上に見つからなかったとき
	if (_user == null) {
		dbLogger.warn(`user not found on database: ${user}`);
		return resolve(null);
	}

	// Me
	const meId: mongo.ObjectID = me
		? isObjectId(me)
			? me as mongo.ObjectID
			: typeof me === 'string'
				? new mongo.ObjectID(me)
				: (me as IUser)._id
		: null;

	// Rename _id to id
	_user.id = _user._id;
	delete _user._id;

	delete _user.usernameLower;
	delete _user.emailVerifyCode;

	delete _user.lang;	// 廃止のため

	if (_user.host == null) {
		// Remove private properties
		delete _user.keypair;
		delete _user.password;
		delete _user.token;
		delete _user.twoFactorTempSecret;
		delete _user.two_factor_temp_secret; // 後方互換性のため
		delete _user.twoFactorSecret;
		if (_user.twitter) {
			delete _user.twitter.accessToken;
			delete _user.twitter.accessTokenSecret;
		}
		if (_user.github) {
			delete _user.github.accessToken;
		}
		if (_user.discord) {
			delete _user.discord.accessToken;
			delete _user.discord.refreshToken;
			delete _user.discord.expiresDate;
		}
		if (_user.mastodon) {
			delete _user.mastodon.accessToken;
		}

		// Visible via only the official client
		if (!opts.includeSecrets) {
			delete _user.email;
			delete _user.emailVerified;
			delete _user.settings;
			delete _user.clientSettings;
		}

		if (!opts.detail) {
			delete _user.twoFactorEnabled;
		}
	} else if (_user.host === 'twitter.com') {
		_user.followersCount = (_user.followersCount || 0) + (_user.originalFollowersCount || 0);
		_user.followingCount = (_user.followingCount || 0) + (_user.friendsCount || 0);

		delete _user.originalFollowersCount;
		delete _user.friendsCount;
	} else {
		delete _user.publicKey;
	}

	if (_user.avatarUrl == null) {
		_user.avatarUrl = `${config.driveUrl}/default-avatar.jpg`;
	}

	if (!meId || !meId.equals(_user.id) || !opts.detail) {
		delete _user.avatarId;
		delete _user.bannerId;
		delete _user.hasUnreadMessagingMessage;
		delete _user.hasUnreadNotification;
	}

	if (meId && !meId.equals(_user.id) && opts.detail) {
		const relation = await getRelation(meId, _user.id);

		_user.isFollowing = relation.isFollowing;
		_user.isFollowed = relation.isFollowed;
		_user.hasPendingFollowRequestFromYou = relation.hasPendingFollowRequestFromYou;
		_user.hasPendingFollowRequestToYou = relation.hasPendingFollowRequestToYou;
		_user.isBlocking = relation.isBlocking;
		_user.isBlocked = relation.isBlocked;
		_user.isMuted = relation.isMuted;
	}

	if (opts.detail) {
		if (_user.pinnedNoteIds) {
			// Populate pinned notes
			_user.pinnedNotes = packNoteMany(_user.pinnedNoteIds, meId, {
				detail: true
			});
		}

		if (meId && !meId.equals(_user.id)) {
			const myFollowingIds = await getFriendIds(meId);

			// Get following you know count
			_user.followingYouKnowCount = Following.count({
				followeeId: { $in: myFollowingIds },
				followerId: _user.id
			});

			// Get followers you know count
			_user.followersYouKnowCount = Following.count({
				followeeId: _user.id,
				followerId: { $in: myFollowingIds }
			});
		}
	}

	if (!opts.includeHasUnreadNotes) {
		delete _user.hasUnreadSpecifiedNotes;
		delete _user.hasUnreadMentions;
	}

	// カスタム絵文字添付
	if (_user.emojis) {
		_user.emojis = packEmojis(_user.emojis, _user.host, {
			custom: true,
			avatar: true,
			foreign: true
		}).catch(e => {
			console.warn(e);
			return [];
		});
	}

	// resolve promises in _user object
	_user = await rap(_user);

	resolve(_user);
});

/*
function img(url) {
	return {
		thumbnail: {
			large: `${url}`,
			medium: '',
			small: ''
		}
	};
}
*/

export async function fetchProxyAccount(): Promise<ILocalUser> {
	const meta = await fetchMeta();
	return await User.findOne({ username: meta.proxyAccount, host: null }) as ILocalUser;
}
