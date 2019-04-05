import * as mongo from 'mongodb';
import * as promiseLimit from 'promise-limit';
import { toUnicode } from 'punycode';

import config from '../../../config';
import User, { validateUsername, isValidName, IUser, IRemoteUser, isRemoteUser } from '../../../models/user';
import Resolver from '../resolver';
import { resolveImage } from './image';
import { isCollectionOrOrderedCollection, isCollection, IActor, IObject, validActor } from '../type';
import { IDriveFile } from '../../../models/drive-file';
import Meta from '../../../models/meta';
import { fromHtml } from '../../../mfm/fromHtml';
import usersChart from '../../../services/chart/users';
import instanceChart from '../../../services/chart/instance';
import { URL } from 'url';
import { resolveNote, extractEmojis } from './note';
import { registerOrFetchInstanceDoc } from '../../../services/register-or-fetch-instance-doc';
import Instance from '../../../models/instance';
import getDriveFileUrl from '../../../misc/get-drive-file-url';
import { IEmoji } from '../../../models/emoji';
import { ITag, extractHashtags } from './tag';
import Following from '../../../models/following';
import { IIdentifier } from './identifier';
import { apLogger } from '../logger';
import { INote } from '../../../models/note';
import { updateHashtag } from '../../../services/update-hashtag';
const logger = apLogger;

/**
 * Validate actor object
 * @param x Fetched person object
 * @param uri Fetch target URI
 */
function validatePerson(x: any, uri: string) {
	const expectHost = toUnicode(new URL(uri).hostname.toLowerCase());

	if (x == null) {
		return new Error('invalid person: object is null');
	}

	if (!validActor.includes(x.type)) {
		return new Error(`invalid actor: '${x.type}' is not a valid actor`);
	}

	if (typeof x.preferredUsername !== 'string') {
		return new Error('invalid person: preferredUsername is not a string');
	}

	if (typeof x.inbox !== 'string') {
		return new Error('invalid person: inbox is not a string');
	}

	if (!validateUsername(x.preferredUsername, true)) {
		return new Error('invalid person: invalid username');
	}

	if (!isValidName(x.name == '' ? null : x.name)) {
		return new Error('invalid person: invalid name');
	}

	if (typeof x.id !== 'string') {
		return new Error('invalid person: id is not a string');
	}

	const idHost = toUnicode(new URL(x.id).hostname.toLowerCase());
	if (idHost !== expectHost) {
		return new Error('invalid person: id has different host');
	}

	if (typeof x.publicKey.id !== 'string') {
		return new Error('invalid person: publicKey.id is not a string');
	}

	const publicKeyIdHost = toUnicode(new URL(x.publicKey.id).hostname.toLowerCase());
	if (publicKeyIdHost !== expectHost) {
		return new Error('invalid person: publicKey.id has different host');
	}

	return null;
}

/**
 * Personをフェッチします。
 *
 * twistaに対象のPersonが登録されていればそれを返します。
 */
export async function fetchPerson(uri: string, resolver?: Resolver): Promise<IUser> {
	if (typeof uri !== 'string') throw 'uri is not string';

	// URIがこのサーバーを指しているならデータベースからフェッチ
	if (uri.startsWith(config.url + '/')) {
		const id = new mongo.ObjectID(uri.split('/').pop());
		return await User.findOne({ _id: id });
	}

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await User.findOne({ uri });

	if (exist) {
		return exist;
	}
	//#endregion

	return null;
}

/**
 * Personを作成します。
 */
export async function createPerson(uri: string, resolver?: Resolver): Promise<IUser> {
	if (typeof uri !== 'string') throw 'uri is not string';

	if (!resolver) resolver = new Resolver();

	return await createPersonFromObject(uri, await resolver.resolve(uri), resolver);
}

export async function createPersonFromObject(uri: string, object: IObject, resolver?: Resolver) {
	const err = validatePerson(object, uri);

	if (err) {
		throw err;
	}

	if (!resolver) resolver = new Resolver();

	const person = object as IActor;

	logger.info(`Creating the actor: ${person.id}`);

	const [followersCount = 0, followingCount = 0, notesCount = 0] = await Promise.all([
		resolver.resolve(person.followers).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		),
		resolver.resolve(person.following).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		),
		resolver.resolve(person.outbox).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		)
	]);

	const host = toUnicode(new URL(person.id).hostname.toLowerCase());

	const { fields, services } = analyzeAttachments(person.attachment);

	const tags = extractHashtags(person.tag).map(tag => tag.toLowerCase());

	const is = validActor.reduce<Record<string, boolean>>((a, c) => (a[`is${c}`] = person.type == c, a), {});

	// Create user
	let user: IRemoteUser;
	try {
		user = await User.insert({
			avatarId: null,
			bannerId: null,
			createdAt: Date.parse(person.published) || null,
			lastFetchedAt: new Date(),
			description: fromHtml(person.summary),
			followersCount,
			followingCount,
			notesCount,
			name: person.name,
			isLocked: person.manuallyApprovesFollowers,
			username: person.preferredUsername,
			usernameLower: person.preferredUsername.toLowerCase(),
			host,
			publicKey: {
				id: person.publicKey.id,
				publicKeyPem: person.publicKey.publicKeyPem
			},
			inbox: person.inbox,
			sharedInbox: person.sharedInbox || (person.endpoints ? person.endpoints.sharedInbox : undefined),
			featured: person.featured,
			endpoints: person.endpoints,
			uri: person.id,
			url: person.url,
			fields,
			...services,
			tags,
			...is,
			isBot: is.isService,
			isCat: (person as any).isCat === true,
			isKaho: (person as any).isKaho === true,
			avatarAngle: (person as any).avatarAngle
		}) as IRemoteUser;
	} catch (e) {
		// duplicate key error
		if (e.code === 11000) {
			throw new Error('already registered');
		}

		logger.error(e);
		throw e;
	}

	// Register host
	registerOrFetchInstanceDoc(host).then(i => {
		Instance.update({ _id: i._id }, {
			$inc: {
				usersCount: 1
			}
		});

		instanceChart.newUser(i.host);
	});

	//#region Increment users count
	Meta.update({}, {
		$inc: {
			'stats.usersCount': 1
		}
	}, { upsert: true });

	usersChart.update(user, true);
	//#endregion

	// ハッシュタグ更新
	for (const tag of tags) updateHashtag(user, tag, true, true);
	for (const tag of (user.tags || []).filter(x => !tags.includes(x))) updateHashtag(user, tag, true, false);

	//#region アイコンとヘッダー画像をフェッチ
	const [avatar, banner] = (await Promise.all<IDriveFile>([
		person.icon,
		person.image
	].map(img =>
		img == null
			? Promise.resolve(null)
			: resolveImage(user, img).catch(() => null)
	)));

	const avatarId = avatar ? avatar._id : null;
	const bannerId = banner ? banner._id : null;
	const avatarUrl = getDriveFileUrl(avatar, true);
	const bannerUrl = getDriveFileUrl(banner, false);
	const avatarColor = avatar && avatar.metadata.properties.avgColor ? avatar.metadata.properties.avgColor : null;
	const bannerColor = banner && avatar.metadata.properties.avgColor ? banner.metadata.properties.avgColor : null;

	await User.update({ _id: user._id }, {
		$set: {
			avatarId,
			bannerId,
			avatarUrl,
			bannerUrl,
			avatarColor,
			bannerColor
		}
	});

	user.avatarId = avatarId;
	user.bannerId = bannerId;
	user.avatarUrl = avatarUrl;
	user.bannerUrl = bannerUrl;
	user.avatarColor = avatarColor;
	user.bannerColor = bannerColor;
	//#endregion

	//#region カスタム絵文字取得
	const emojis = await extractEmojis(person.tag, host).catch(e => {
		logger.info(`extractEmojis: ${e}`);
		return [] as IEmoji[];
	});

	const emojiNames = emojis.map(emoji => emoji.name);

	await User.update({ _id: user._id }, {
		$set: {
			emojis: emojiNames
		}
	});
	//#endregion

	await updateFeatured(user._id).catch(err => logger.error(err));

	return user;
}

/**
 * Personの情報を更新します。
 * twistaに対象のPersonが登録されていなければ無視します。
 * @param uri URI of IActor
 * @param resolver Resolver
 * @param hint Hint of IActor object (この値が正当なPersonの場合、Remote resolveをせずに更新に利用します)
 */
export async function updatePerson(uri: string, resolver?: Resolver, hint?: object): Promise<void> {
	if (typeof uri !== 'string') throw 'uri is not string';

	// URIがこのサーバーを指しているならスキップ
	if (uri.startsWith(config.url + '/')) {
		return;
	}

	//#region このサーバーに既に登録されているか
	const exist = await User.findOne({ uri }) as IRemoteUser;

	if (exist == null) {
		return;
	}
	//#endregion

	// 繋がらないインスタンスに何回も試行するのを防ぐ, 後続の同様処理の連続試行を防ぐ ため 試行前にも更新する
	await User.update({ _id: exist._id }, {
		$set: {
			lastFetchedAt: new Date(),
		},
	});

	if (resolver == null) resolver = new Resolver();

	const object = hint || await resolver.resolve(uri) as any;

	const err = validatePerson(object, uri);

	if (err) {
		throw err;
	}

	const person: IActor = object;

	logger.info(`Updating the IActor: ${person.id}`);

	const [followersCount = 0, followingCount = 0, notesCount = 0] = await Promise.all([
		resolver.resolve(person.followers).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		),
		resolver.resolve(person.following).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		),
		resolver.resolve(person.outbox).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		)
	]);

	// アイコンとヘッダー画像をフェッチ
	const [avatar, banner] = (await Promise.all<IDriveFile>([
		person.icon,
		person.image
	].map(img =>
		img == null
			? Promise.resolve(null)
			: resolveImage(exist, img).catch(() => null)
	)));

	// カスタム絵文字取得
	const emojis = await extractEmojis(person.tag, exist.host).catch(e => {
		logger.info(`extractEmojis: ${e}`);
		return [] as IEmoji[];
	});

	const emojiNames = emojis.map(emoji => emoji.name);

	const { fields, services } = analyzeAttachments(person.attachment);

	const tags = extractHashtags(person.tag).map(tag => tag.toLowerCase());

	const updates = {
		lastFetchedAt: new Date(),
		inbox: person.inbox,
		sharedInbox: person.sharedInbox || (person.endpoints ? person.endpoints.sharedInbox : undefined),
		featured: person.featured,
		emojis: emojiNames,
		description: fromHtml(person.summary),
		followersCount,
		followingCount,
		notesCount,
		name: person.name,
		url: person.url,
		endpoints: person.endpoints,
		fields,
		...services,
		tags,
		isBot: object.type == 'Service',
		isCat: (person as any).isCat === true,
		isKaho: (person as any).isKaho === true,
		isLocked: person.manuallyApprovesFollowers,
		createdAt: Date.parse(person.published) || null,
		publicKey: {
			id: person.publicKey.id,
			publicKeyPem: person.publicKey.publicKeyPem
		},
	} as any;

	if (avatar) {
		updates.avatarId = avatar._id;
		updates.avatarUrl = getDriveFileUrl(avatar, true);
		updates.avatarColor = avatar.metadata.properties.avgColor ? avatar.metadata.properties.avgColor : null;
	}

	if (banner) {
		updates.bannerId = banner._id;
		updates.bannerUrl = getDriveFileUrl(banner, true);
		updates.bannerColor = banner.metadata.properties.avgColor ? banner.metadata.properties.avgColor : null;
	}

	// Update user
	await User.update({ _id: exist._id }, {
		$set: updates
	});

	// ハッシュタグ更新
	for (const tag of tags) updateHashtag(exist, tag, true, true);
	for (const tag of (exist.tags || []).filter(x => !tags.includes(x))) updateHashtag(exist, tag, true, false);

	// 該当ユーザーが既にフォロワーになっていた場合はFollowingもアップデートする
	await Following.update({
		followerId: exist._id
	}, {
		$set: {
			'_follower.sharedInbox': person.sharedInbox || (person.endpoints ? person.endpoints.sharedInbox : undefined)
		}
	}, {
		multi: true
	});

	await updateFeatured(exist._id).catch(err => logger.error(err));
}

/**
 * Personを解決します。
 *
 * twistaに対象のPersonが登録されていればそれを返し、そうでなければ
 * リモートサーバーからフェッチしてtwistaに登録しそれを返します。
 */
export async function resolvePerson(uri: string, verifier?: string, resolver?: Resolver): Promise<IUser> {
	if (typeof uri !== 'string') throw 'uri is not string';

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await fetchPerson(uri);

	if (exist) {
		return exist;
	}
	//#endregion

	// リモートサーバーからフェッチしてきて登録
	if (resolver == null) resolver = new Resolver();
	return await createPerson(uri, resolver);
}

const isPropertyValue = (x: {
		type: string,
		name?: string,
		value?: string
	}) =>
		x &&
		x.type === 'PropertyValue' &&
		typeof x.name === 'string' &&
		typeof x.value === 'string';

const services: {
		[x: string]: (id: string, username: string) => any
	} = {
	'misskey:authentication:twitter': (userId, screenName) => ({ userId, screenName }),
	'misskey:authentication:github': (id, login) => ({ id, login }),
	'misskey:authentication:discord': (id, name) => $discord(id, name)
};

const $discord = (id: string, name: string) => {
	if (typeof name !== 'string')
		name = 'unknown#0000';
	const [username, discriminator] = name.split('#');
	return { id, username, discriminator };
};

function addService(target: { [x: string]: any }, source: IIdentifier) {
	const service = services[source.name];

	if (typeof source.value !== 'string')
		source.value = 'unknown';

	const [id, username] = source.value.split('@');

	if (service)
		target[source.name.split(':')[2]] = service(id, username);
}

export function analyzeAttachments(attachments: ITag[]) {
	const fields: {
		name: string,
		value: string
	}[] = [];
	const services: { [x: string]: any } = {};

	if (Array.isArray(attachments))
		for (const attachment of attachments.filter(isPropertyValue))
			if (isPropertyValue(attachment.identifier))
				addService(services, attachment.identifier);
			else
				fields.push({
					name: attachment.name,
					value: fromHtml(attachment.value)
				});

	return { fields, services };
}

export async function updateFeatured(userId: mongo.ObjectID) {
	const user = await User.findOne({ _id: userId });
	if (!isRemoteUser(user)) return;
	if (!user.featured) return;

	logger.info(`Updating the featured: ${user.uri}`);

	const resolver = new Resolver();

	// Resolve to (Ordered)Collection Object
	const collection = await resolver.resolveCollection(user.featured);
	if (!isCollectionOrOrderedCollection(collection)) throw new Error(`Object is not Collection or OrderedCollection`);

	// Resolve to Object(may be Note) arrays
	const unresolvedItems = isCollection(collection) ? collection.items : collection.orderedItems;
	const items = await resolver.resolve(unresolvedItems);
	if (!Array.isArray(items)) throw new Error(`Collection items is not an array`);

	// Resolve and regist Notes
	const limit = promiseLimit(2);
	const featuredNotes = await Promise.all(items
		.filter(item => item.type === 'Note')
		.slice(0, 5)
		.map(item => limit(() => resolveNote(item, resolver, true)) as Promise<INote>));

	await User.update({ _id: user._id }, {
		$set: {
			pinnedNoteIds: featuredNotes.filter(note => note != null).map(note => note._id)
		}
	});
}
