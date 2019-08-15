import * as deepcopy from 'deepcopy';
import * as request from 'request';

import es from '../../db/elasticsearch';
import Note, { pack, INote, IChoice } from '../../models/note';
import User, { isLocalUser, IUser, isRemoteUser, IRemoteUser, ILocalUser } from '../../models/user';
import {
	publishMainStream,
	publishHomeTimelineStream,
	publishLocalTimelineStream,
	publishHybridTimelineStream,
	publishImasTimelineStream,
	publishImasHybridTimelineStream,
	publishGlobalTimelineStream,
	publishUserListStream,
	publishHashtagStream,
	publishNoteStream,
	publishSharedEmergencyStream
} from '../stream';
import Following from '../../models/following';
import { deliver } from '../../queue';
import renderNote from '../../remote/activitypub/renderer/note';
import renderCreate from '../../remote/activitypub/renderer/create';
import renderAnnounce from '../../remote/activitypub/renderer/announce';
import { renderActivity } from '../../remote/activitypub/renderer';
import DriveFile, { IDriveFile } from '../../models/drive-file';
import notify from '../../services/create-notification';
import NoteWatching from '../../models/note-watching';
import watch from './watch';
import Mute from '../../models/mute';
import { parse } from '../../mfm/parse';
import { IApp } from '../../models/app';
import UserList from '../../models/user-list';
import resolveUser from '../../remote/resolve-user';
import Meta from '../../models/meta';
import config from '../../config';
import { updateHashtag } from '../update-hashtag';
import isQuote from '../../misc/is-quote';
import notesChart from '../../services/chart/notes';
import perUserNotesChart from '../../services/chart/per-user-notes';
import activeUsersChart from '../../services/chart/active-users';
import instanceChart from '../../services/chart/instance';
import { erase, concat, unique } from '../../prelude/array';
import insertNoteUnread from './unread';
import { registerOrFetchInstanceDoc } from '../register-or-fetch-instance-doc';
import Instance from '../../models/instance';
import { toASCII } from 'punycode';
import extractMentions from '../../misc/extract-mentions';
import extractEmojis from '../../misc/extract-emojis';
import extractHashtags from '../../misc/extract-hashtags';
import { genId } from '../../misc/gen-id';
import { resolveNote } from '../../remote/activitypub/models/note';
import Resolver from '../../remote/activitypub/resolver';
import Blocking from '../../models/blocking';
import { packActivity } from '../../server/activitypub/outbox';
import { getIndexer, mecabIndexVersion } from '../../misc/mecab';
import uuid = require('uuid');

type NotificationType = 'reply' | 'renote' | 'quote' | 'mention' | 'highlight';

class NotificationManager {
	private notifier: IUser;
	private note: INote;
	private queue: {
		target: ILocalUser['_id'];
		reason: NotificationType;
	}[];

	constructor(notifier: IUser, note: INote) {
		this.notifier = notifier;
		this.note = note;
		this.queue = [];
	}

	public push(notifiee: ILocalUser['_id'], reason: NotificationType) {
		// 自分自身へは通知しない
		if (this.notifier._id.equals(notifiee)) return;

		const exist = this.queue.find(x => x.target.equals(notifiee) && x.reason == 'mention');

		if (exist) {
			// 「メンションされているかつ返信されている」場合は、メンションとしての通知ではなく返信としての通知にする
			if (reason == 'reply') {
				exist.reason = reason;
			}
		} else {
			this.queue.push({
				reason: reason,
				target: notifiee
			});
		}
	}

	public async deliver() {
		for (const x of this.queue) {
			// ミュート情報を取得
			const mute = await Mute.find({
				muterId: x.target
			});
			const blocking = await Blocking.find({
				blockerId: x.target
			});
			const ignoredUserIds = [
				...mute.map(x => x.muteeId.toHexString()),
				...blocking.map(x => x.blockeeId.toHexString())
			];

			// 通知される側のユーザーが通知する側のユーザーをミュートしていない限りは通知する
			if (!ignoredUserIds.includes(this.notifier._id.toHexString())) {
				notify(x.target, this.notifier._id, x.reason, {
					noteId: this.note._id
				});
			}
		}
	}
}

type Option = {
	createdAt?: Date;
	author?: IUser;
	name?: string;
	text?: string;
	reply?: INote;
	renote?: INote;
	files?: IDriveFile[];
	geo?: any;
	poll?: any;
	viaMobile?: boolean;
	viaTwitter?: string;
	qa?: string;
	localOnly?: boolean;
	cw?: string;
	visibility?: string;
	visibleUsers?: IUser[];
	rating?: string;
	apMentions?: IUser[];
	apHashtags?: string[];
	apEmojis?: string[];
	uri?: string;
	app?: IApp;
	preview?: boolean;
	emergencyKey?: string;
};

export const imasHosts = [
	'imastodon.blue',
	'imastodon.net',
	'imastodon.org',
	// 'mstdn.imastags.com', (inbox disabled)
	'twista.nokotaro.work',
	'twista.283.cloud'
].filter(x => x !== config.hostname);

const nyaizable = (text: string) => {
	if (typeof text !== 'string')
		return false;

	const trim = text.trim();
	const match = trim.match(/<\/?!?nya>/ig) || [];
	const stack: string[] = [];
	for (const tag of [...match]
		.map(x => x.toLocaleLowerCase()))
			if (tag.includes('/')) {
				if (stack.pop() !== tag.replace('/', ''))
					return false;
			} else
				stack.push(tag);
	return !!stack.length;
};

const kahoizable = (text: string) => {
	if (typeof text !== 'string')
		return false;

	const trim = text.trim();
	const match = trim.match(/<\/?!?kaho>/ig) || [];
	const stack: string[] = [];
	for (const tag of [...match]
		.map(x => x.toLocaleLowerCase()))
			if (tag.includes('/')) {
				if (stack.pop() !== tag.replace('/', ''))
					return false;
			} else
				stack.push(tag);
	return !!stack.length;
};

const create = async (user: IUser, data: Option, silent = false) => new Promise<INote>(async (res, rej) => {
	const emergency = config.emergencyDelivers[`acct:${user.usernameLower}@${user.host || 'localhost'}`];

	let emergencyKey: string | null = null;

	if (emergency && data.text && (!data.visibility || data.visibility === 'public')) {
		try {
			const error = (e?: string | Error) => {
				throw e;
			};

			const trigger =
				emergency.trigger instanceof RegExp ? emergency.trigger :
				typeof emergency.trigger === 'string' ? new RegExp(emergency.trigger) : error(emergency.trigger);

			if (data.text.match(trigger) && !(Date.now() - (data.createdAt = data.createdAt || new Date()).valueOf() >> 16)) {
				const head =
					emergency.head instanceof RegExp ? emergency.head :
					typeof emergency.head === 'string' ? new RegExp(emergency.head) : error(emergency.head);
				const body =
					emergency.body instanceof RegExp ? emergency.body :
					typeof emergency.body === 'string' ? new RegExp(emergency.body) : error(emergency.body);

				publishSharedEmergencyStream('created', {
					ekey: emergencyKey = uuid(),
					acct: `${user.username}@${user.host || 'localhost'}`,
					name: user.name || null,
					date: data.createdAt.toISOString(),
					head: data.text.match(head)[1],
					body: data.text.match(body)[1]
				});
			}
		} catch {
		}
	}

	const isFirstNote = user.notesCount === 0;

	if (data.author == null) data.author = null;
	if (data.createdAt == null) data.createdAt = new Date();
	if (data.visibility == null) data.visibility = 'public';
	if (data.rating == null) data.rating = null;
	if (data.qa == null) data.qa = null;
	if (data.viaMobile == null) data.viaMobile = false;
	if (data.viaTwitter == null) data.viaTwitter = null;
	if (data.localOnly == null) data.localOnly = false;

	data.emergencyKey = emergencyKey;

	//#region Auto Quote
	const split = data.text && data.text.trim().split(/[\n\r\s：]/ig);
	const uri = split && split[split.length - 1];

	if (uri && uri.startsWith('http')) {
		const note = await resolveNote(uri, new Resolver({ twitter: (user as ILocalUser).twitter }), true).catch(() => null);

		if (note) {
			data.renote = note;

			const sep = '[\\n\\r\\s]';
			const url = encodeURI(uri)
				.replace('\\', '\\\\')
				.replace('$', '\\$')
				.replace('.', '\\.')
				.replace('?', '\\?')
				.replace('+', '\\+')
				.replace('*', '\\*')
				.replace('(', '\\(')
				.replace(')', '\\)');
			const match = data.text.match(new RegExp(`^(.*?(${sep}+[QR][ENT]:)?${sep}+)?${url}${sep}*$`));

			if (match)
				data.text = match[1];
		}
	}
	//#endregion

	// サイレンス
	if (user.isSilenced && data.visibility == 'public') {
		data.visibility = 'home';
	}

	if (data.visibleUsers) {
		data.visibleUsers = erase(null, data.visibleUsers);
	}

	// リプライ対象が削除された投稿だったらreject
	if (data.reply && data.reply.deletedAt != null) {
		return rej('Reply target has been deleted');
	}

	// Renote対象が削除された投稿だったらreject
	if (data.renote && data.renote.deletedAt != null) {
		return rej('Renote target has been deleted');
	}

	// Renote対象が「public/home/followers」以外の公開範囲ならreject
	if (data.renote && data.renote.visibility != 'public' && data.renote.visibility != 'home' && data.renote.visibility != 'followers') {
		return rej('Renote target is not public, home or followers');
	}

	// Renote/Quoteの公開範囲を絞る
	if (data.renote) {
		if (data.visibility == 'public' && !['public'].includes(data.renote.visibility)) {
			data.visibility = data.renote.visibility;
		} else if (data.visibility == 'home' && !['public', 'home'].includes(data.renote.visibility)) {
			data.visibility = data.renote.visibility;
		} else if (data.visibility == 'followers' && !['public', 'home', 'followers'].includes(data.renote.visibility)) {
			data.visibility = data.renote.visibility;
		}
	}

	// 返信対象がpublicではないならhomeにする
	if (data.reply && data.reply.visibility != 'public' && data.visibility == 'public') {
		data.visibility = 'home';
	}

	// ローカルのみをRenoteしたらローカルのみにする
	if (data.renote && data.renote.localOnly) {
		data.localOnly = true;
	}

	// ローカルのみにリプライしたらローカルのみにする
	if (data.reply && data.reply.localOnly) {
		data.localOnly = true;
	}

	// 電気通信事業の届出をするまで public 以外禁止
	if (!['public', 'home'].includes(data.visibility) && isLocalUser(user)) {
		return rej('電気通信事業法に基づき、運営者による電気通信事業の届出が受理されるまで公開範囲を限定した投稿を作成することはできません。');
	}

	const nyaize = nyaizable(data.text);
	const kahoize = kahoizable(data.text);
	const kahosafe = kahoize ? data.text && data.text.replace(/^<\/?!?kaho>/ig, '') : data.text;
	const text = nyaize ? kahosafe && kahosafe.replace(/^<\/?!?nya>/ig, '') : kahosafe;

	let tags = data.apHashtags;
	let emojis = data.apEmojis;
	let mentionedUsers = data.apMentions;

	const parseEmojisInToken = true;

	// Parse MFM if needed
	if (parseEmojisInToken || !tags || !emojis || !mentionedUsers) {
		const text = data.text && data.text.replace(/^<\/?!?(nya|kaho)>/ig, '');
		const tokens = text ? parse(text) : [];
		const cwTokens = data.cw ? parse(data.cw) : [];
		const choiceTokens = data.poll && data.poll.choices
			? concat((data.poll.choices as IChoice[]).map(choice => parse(choice.text && choice.text.replace(/^<\/?!?(nya|kaho)>/ig, ''))))
			: [];

		const combinedTokens = tokens.concat(cwTokens).concat(choiceTokens);

		tags = data.apHashtags || extractHashtags(combinedTokens);

		emojis = unique(concat([data.apEmojis || [], extractEmojis(combinedTokens)]));

		mentionedUsers = data.apMentions || await extractMentionedUsers(user, combinedTokens);
	}

	tags = tags.filter(tag => tag.length <= 127).splice(0, 255);

	const normalizeAsciiHost = (host: string) => {
		if (host == null) return null;
		return toASCII(host.toLowerCase());
	};

	const mentionEmojis = mentionedUsers.map(user => `@${user.usernameLower}` + (user.host != null ? `@${normalizeAsciiHost(user.host)}` : ''));
	emojis = emojis.concat(mentionEmojis);

	if (data.reply && !user._id.equals(data.reply.userId) && !mentionedUsers.some(u => u._id.equals(data.reply.userId))) {
		mentionedUsers.push(await User.findOne({ _id: data.reply.userId }));
	}

	if (data.visibility == 'specified') {
		for (const u of data.visibleUsers) {
			if (!mentionedUsers.some(x => x._id.equals(u._id))) {
				mentionedUsers.push(u);
			}
		}

		for (const u of mentionedUsers) {
			if (!data.visibleUsers.some(x => x._id.equals(u._id))) {
				data.visibleUsers.push(u);
			}
		}
	}

	const answerable = data.reply && data.reply.qa === 'question';

	const bestAnswerable = answerable && data.reply.userId === user._id;

	data.qa =
		['bestAnswer'].includes(data.qa) && bestAnswerable ? 'bestAnswer' :
		['bestAnswer', 'answer'].includes(data.qa) && answerable ? 'answer' :
		['question'].includes(data.qa) ? 'question' : null;

	const note = await insertNote(user, data, tags, emojis, mentionedUsers);

	res(note);

	if (data.preview) return;

	if (isLocalUser(user) && user.mastodon && ['public', 'home'].includes(data.visibility) && !data.localOnly && !(data.text && data.text.includes('#twista_mirror'))) {
		if (user.mastodon.preferBoost) {
			const id = await new Promise<string>((s, j) => request({
				url: `https://${user.mastodon.hostname}/authorize_interaction?acct=${encodeURIComponent(note.uri)}`,
				headers: {
					'Authorization': `Bearer ${user.mastodon.accessToken}`,
					'User-Agent': config.userAgent
				},
				followAllRedirects: true
			}, (err, response) => err ? j(err) : ((m => m && m[1] ? s(m[1]) : j())(new URL(response.url).pathname.match(/^\/web\/statuses\/([^\/]+)\/?$/))))).catch(_ => {});

			if (id) {
				request({
					method: 'POST',
					url: `https://${user.mastodon.hostname}/api/v1/statuses/${id}/reblog`,
					headers: {
						'Authorization': `Bearer ${user.mastodon.accessToken}`,
						'User-Agent': config.userAgent
					}
				}, (err, response, body) => {
					if (!err) {
						const { hostname } = user.mastodon;

						const { id, uri } = body as Record<string, string>;

						if ([id, uri].every(x => typeof x === 'string')) {
							Note.update({ _id: note._id }, {
								$set: {
									_mastodonMirror: { hostname, id, uri }
								}
							});
						}
					}
				});
			}
		} else {
			const status = [data.text, '#twista_mirror', `${config.url}/notes/${note._id}`].join(' ');

			const in_reply_to_id = await (data.reply && data.reply._mastodonMirror ? new Promise<string>((s, j) => request({
				url: `https://${user.mastodon.hostname}/authorize_interaction?acct=${encodeURIComponent(data.reply._mastodonMirror.uri)}`,
				headers: {
					'Authorization': `Bearer ${user.mastodon.accessToken}`,
					'User-Agent': config.userAgent
				},
				followAllRedirects: true
			}, (err, response) => err ? j(err) : ((m => m && m[1] ? s(m[1]) : j())(new URL(response.url).pathname.match(/^\/web\/statuses\/([^\/]+)\/?$/))))).catch(_ => {}) : Promise.resolve(null));

			const media_ids = data.files && ((x => x.length ? x : null)(data.files.filter(x => x.metadata.mastodon && x.metadata.mastodon.hostname === user.mastodon.hostname).map(x => x.metadata.mastodon.id)));

			const poll = data.poll && {
				options: data.poll.choices,
				expires_in: Math.min(data.poll.expiresAt instanceof Date ? (data.poll.expiresAt as Date).valueOf() - Date.now() : 604800, 604800),
				multiple: data.poll.multiple
			};

			const sensitive = data.files && data.files.some(x => x.metadata.isSensitive) || data.cw;

			const spoiler_text = data.cw && (data.cw.length ? data.cw : '\u200b');

			const visibility = data.visibility === 'home' ? 'unlisted' : 'public';

			request({
				method: 'POST',
				url: `https://${user.mastodon.hostname}/api/v1/statuses`,
				headers: {
					'Authorization': `Bearer ${user.mastodon.accessToken}`,
					'User-Agent': config.userAgent
				},
				form: {
					status,
					in_reply_to_id,
					media_ids,
					poll,
					sensitive,
					spoiler_text,
					visibility
				},
				qsStringifyOptions: {
					arrayFormat: 'brackets'
				}
			}, (err, response, body) => {
				if (!err) {
					const { hostname } = user.mastodon;

					const { id, uri } = body as Record<string, string>;

					if ([id, uri].every(x => typeof x === 'string')) {
						Note.update({ _id: note._id }, {
							$set: {
								_mastodonMirror: { hostname, id, uri }
							}
						});
					}
				}
			});
		}
	}

	if (note == null) {
		return;
	}

	if (note.qa === 'bestAnswer') {
		await Note.update({
			_id: note.replyId
		}, {
			$set: {
				updatedAt: note.createdAt,
				qa: 'resolvedQuestion'
			}
		});
	}

	// 統計を更新
	notesChart.update(note, true);
	perUserNotesChart.update(user, note, true);
	// ローカルユーザーのチャートはタイムライン取得時に更新しているのでリモートユーザーの場合だけでよい
	if (isRemoteUser(user)) activeUsersChart.update(user);

	// Register host
	if (isRemoteUser(user)) {
		registerOrFetchInstanceDoc(user.host).then(i => {
			Instance.update({ _id: i._id }, {
				$inc: {
					notesCount: 1
				}
			});

			instanceChart.updateNote(i.host, true);
		});
	}

	// ハッシュタグ更新
	for (const tag of tags) updateHashtag(user, tag);

	// ファイルが添付されていた場合ドライブのファイルの「このファイルが添付された投稿一覧」プロパティにこの投稿を追加
	if (data.files) {
		for (const file of data.files) {
			DriveFile.update({ _id: file._id }, {
				$push: {
					'metadata.attachedNoteIds': note._id
				}
			});
		}
	}

	// Increment notes count
	incNotesCount(user);

	// Increment notes count (user)
	incNotesCountOfUser(user);

	// 未読通知を作成
	if (data.visibility == 'specified') {
		for (const u of data.visibleUsers) {
			insertNoteUnread(u, note, true);
		}
	} else {
		for (const u of mentionedUsers) {
			insertNoteUnread(u, note, false);
		}
	}

	if (data.reply) {
		saveReply(data.reply, note);
	}

	if (data.renote) {
		incRenoteCount(data.renote);
	}

	if (isQuote(note)) {
		saveQuote(data.renote, note);
	}

	// Pack the note
	const noteObj = await pack(note);

	if (isFirstNote) {
		noteObj.isFirstNote = true;
	}

	if (tags.length > 0) {
		publishHashtagStream(noteObj);
	}

	const nm = new NotificationManager(user, note);
	const nmRelatedPromises = [];

	createMentionedEvents(mentionedUsers, note, nm);

	const noteActivity = await renderNoteOrRenoteActivity(data, note, text, user);

	if (isLocalUser(user)) {
		deliverNoteToMentionedRemoteUsers(mentionedUsers, user, noteActivity);
	}

	// Extended notification
	if (note.visibility === 'public' || note.visibility === 'home') {
		nmRelatedPromises.push(notifyExtended(note.text, nm));
	}

	// If has in reply to note
	if (data.reply) {
		// Fetch watchers
		nmRelatedPromises.push(notifyToWatchersOfReplyee(data.reply, user, nm));

		// この投稿をWatchする
		if (isLocalUser(user) && user.settings.autoWatch !== false) {
			watch(user._id, data.reply);
		}

		// 通知
		if (isLocalUser(data.reply._user)) {
			nm.push(data.reply.userId, 'reply');
			publishMainStream(data.reply.userId, 'reply', noteObj);
		}
	}

	// If it is renote
	if (data.renote) {
		const type = text ? 'quote' : 'renote';

		// Notify
		if (isLocalUser(data.renote._user)) {
			nm.push(data.renote.userId, type);
		}

		// Fetch watchers
		nmRelatedPromises.push(notifyToWatchersOfRenotee(data.renote, user, nm, type));

		// この投稿をWatchする
		if (isLocalUser(user) && user.settings.autoWatch !== false) {
			watch(user._id, data.renote);
		}

		// Publish event
		if (!user._id.equals(data.renote.userId) && isLocalUser(data.renote._user)) {
			publishMainStream(data.renote.userId, 'renote', noteObj);
		}

		// renote対象noteに対してrenotedイベント
		if (!isQuote(note)) {
			publishNoteStream(data.renote._id, 'renoted', {
				renoteeId: user._id,	// renoteした人
				noteId: note._id,	// renote扱いのNoteId
				renoteCount: (data.renote.renoteCount || 0) + 1,
			});
		}
	}

	if (!silent) {
		publish(user, note, noteObj, data.reply, data.renote, data.visibleUsers, noteActivity);
	}

	Promise.all(nmRelatedPromises).then(() => {
		nm.deliver();
	});

	// Register to search database
	index(note, text);
});

export default create;

async function renderNoteOrRenoteActivity(data: Option, note: INote, text: string, user: IUser) {
	if (data.localOnly) return null;
	if (user.noFederation) return null;

	const content = data.renote && !text && !data.poll && (!data.files || !data.files.length)
		? renderAnnounce(data.renote.uri ? data.renote.uri : `${config.url}/notes/${data.renote._id}`, note)
		: renderCreate(await renderNote(note, false), note);

	return renderActivity(content);
}

function incRenoteCount(renote: INote) {
	Note.update({ _id: renote._id }, {
		$inc: {
			renoteCount: 1,
			score: 1
		}
	});
}

async function publish(user: IUser, note: INote, noteObj: any, reply: INote, renote: INote, visibleUsers: IUser[], noteActivity: any) {
	if (isLocalUser(user)) {
		// 投稿がリプライかつ投稿者がローカルユーザーかつリプライ先の投稿の投稿者がリモートユーザーなら配送
		if (reply && isRemoteUser(reply._user)) {
			deliver(user, noteActivity, reply._user.inbox);
		}

		// 投稿がRenoteかつ投稿者がローカルユーザーかつRenote元の投稿の投稿者がリモートユーザーなら配送
		if (renote && isRemoteUser(renote._user)) {
			deliver(user, noteActivity, renote._user.inbox);
		}

		if (note.visibility === 'public') {
			deliverNoteToImasHosts(user, noteObj);
		}

		if (['followers', 'specified'].includes(note.visibility)) {
			const detailPackedNote = await pack(note, user, {
				detail: true
			});
			// Publish event to myself's stream
			publishHomeTimelineStream(note.userId, detailPackedNote);
			publishHybridTimelineStream(note.userId, detailPackedNote);
			publishImasHybridTimelineStream(note.userId, detailPackedNote);

			if (note.visibility == 'specified') {
				for (const u of visibleUsers) {
					if (!u._id.equals(user._id)) {
						publishHomeTimelineStream(u._id, detailPackedNote);
						publishHybridTimelineStream(u._id, detailPackedNote);
						publishImasHybridTimelineStream(u._id, detailPackedNote);
					}
				}
			}
		} else {
			// Publish event to myself's stream
			publishHomeTimelineStream(note.userId, noteObj);

			// Publish note to local, imas, and hybrid timeline stream
			if (note.visibility != 'home') {
				publishLocalTimelineStream(noteObj);
			}

			if (note.visibility == 'public') {
				publishHybridTimelineStream(null, noteObj);
			} else {
				// Publish event to myself's stream
				publishHybridTimelineStream(note.userId, noteObj);
				publishImasHybridTimelineStream(note.userId, noteObj);
			}
		}
	}

	// Publish note to global timeline stream
	if (note.visibility == 'public' && note.replyId == null) {
		publishGlobalTimelineStream(noteObj);

		// Publish note to imas timeline stream
		if (!note._user.host || imasHosts.includes(note._user.host)) {
			publishImasTimelineStream(noteObj);
			publishImasHybridTimelineStream(null, noteObj);
		}
	}

	if (['public', 'home', 'followers'].includes(note.visibility)) {
		// フォロワーに配信
		publishToFollowers(note, user, noteActivity);
	}

	// リストに配信
	publishToUserLists(note, noteObj);
}

async function insertNote(user: IUser, data: Option, tags: string[], emojis: string[], mentionedUsers: IUser[]) {
	const insert: any = {
		_id: genId(data.createdAt),
		createdAt: data.createdAt,
		authorId: data.author ? data.author._id : null,
		fileIds: data.files ? data.files.map(file => file._id) : [],
		replyId: data.reply ? data.reply._id : null,
		renoteId: data.renote ? data.renote._id : null,
		name: data.name,
		text: data.text,
		poll: data.poll,
		cw: data.cw == null ? null : data.cw,
		tags,
		tagsLower: tags.map(tag => tag.toLowerCase()),
		emojis,
		userId: user._id,
		viaMobile: data.viaMobile,
		viaTwitter: data.viaTwitter,
		localOnly: data.localOnly,
		geo: data.geo || null,
		appId: data.app ? data.app._id : null,
		visibility: data.visibility,
		visibleUserIds: data.visibility == 'specified'
			? data.visibleUsers
				? data.visibleUsers.map(u => u._id)
				: []
			: [],
		rating: data.rating,
		emergencyKey: data.emergencyKey,

		// 以下非正規化データ
		_reply: data.reply ? {
			userId: data.reply.userId,
			user: {
				host: data.reply._user.host
			}
		} : null,
		_renote: data.renote ? {
			userId: data.renote.userId,
			user: {
				host: data.renote._user.host
			}
		} : null,
		_user: {
			host: user.host,
			inbox: isRemoteUser(user) ? user.inbox : undefined
		},
		_files: data.files ? data.files : []
	};

	if (data.uri != null) insert.uri = data.uri;

	// Append mentions data
	if (mentionedUsers.length > 0) {
		insert.mentions = mentionedUsers.map(u => u._id);
		insert.mentionedRemoteUsers = mentionedUsers.filter(u => isRemoteUser(u)).map(u => ({
			uri: (u as IRemoteUser).uri,
			username: u.username,
			host: u.host
		}));
	}

	if (data.preview) {
		return Object.assign({
			preview: true
		}, insert) as INote;
	}

	// 投稿を作成
	try {
		return await Note.insert(insert);
	} catch (e) {
		// duplicate key error
		if (e.code === 11000) {
			return null;
		}

		throw 'something happened';
	}
}

function index(note: INote, text: string) {
	const { _id } = note;

	getIndexer(note).then(mecabIndex => Note.findOneAndUpdate({ _id }, {
		$set: { mecabIndex, mecabIndexVersion }
	}));

	if (!text || !config.elasticsearch) return;

	es.index({
		index: 'twista',
		type: 'note',
		id: note._id.toString(),
		body: { text }
	});
}

async function notifyToWatchersOfRenotee(renote: INote, user: IUser, nm: NotificationManager, type: NotificationType) {
	const watchers = await NoteWatching.find({
		noteId: renote._id,
		userId: { $ne: user._id }
	}, {
			fields: {
				userId: true
			}
		});

	for (const watcher of watchers) {
		nm.push(watcher.userId, type);
	}
}

async function notifyToWatchersOfReplyee(reply: INote, user: IUser, nm: NotificationManager) {
	const watchers = await NoteWatching.find({
		noteId: reply._id,
		userId: { $ne: user._id }
	}, {
			fields: {
				userId: true
			}
		});

	for (const watcher of watchers) {
		nm.push(watcher.userId, 'reply');
	}
}

async function notifyExtended(text: string, nm: NotificationManager) {
	if (!text) return;

	const us = await User.find({
		host: null,
		'clientSettings.highlightedWords': { $exists: true }
	});

	for (const u of us) {
		if (!isLocalUser(u)) continue;

		try {
			const words: string[] = u.clientSettings.highlightedWords.filter((q: string) => q != null && q.length > 0);

			const match = words.some(word => text.toLowerCase().includes(word.toLowerCase()));

			if (match) {
				nm.push(u._id, 'highlight');
			}
		} catch (e) {
			console.error(e);
		}
	}
}

async function publishToUserLists(note: INote, noteObj: any) {
	const lists = await UserList.find({
		userIds: note.userId
	});

	for (const list of lists) {
		if (note.visibility == 'specified') {
			if (note.visibleUserIds.some(id => id.equals(list.userId))) {
				publishUserListStream(list._id, 'note', noteObj);
			}
		} else {
			publishUserListStream(list._id, 'note', noteObj);
		}
	}
}

async function publishToFollowers(note: INote, user: IUser, noteActivity: any) {
	const detailPackedNote = await pack(note, null, {
		detail: true,
		skipHide: true
	});

	const followers = await Following.find({
		followeeId: note.userId,
		followerId: { $ne: note.userId }	// バグでフォロワーに自分がいることがあるため
	});

	const queue: string[] = [];

	for (const following of followers) {
		const follower = following._follower;

		if (isLocalUser(follower)) {
			// この投稿が返信ならスキップ
			if (note.replyId && !note._reply.userId.equals(following.followerId) && !note._reply.userId.equals(note.userId))
				continue;

			// Publish event to followers stream
			publishHomeTimelineStream(following.followerId, detailPackedNote);

			if (isRemoteUser(user) || note.visibility != 'public') {
				publishHybridTimelineStream(following.followerId, detailPackedNote);
			}
		} else {
			// フォロワーがリモートユーザーかつ投稿者がローカルユーザーなら投稿を配信
			if (isLocalUser(user)) {
				const inbox = follower.sharedInbox || follower.inbox;
				if (!queue.includes(inbox)) queue.push(inbox);
			}
		}
	}

	for (const inbox of queue) {
		deliver(user as any, noteActivity, inbox);
	}

	if (isLocalUser(user)) {
		const queue: string[] = [];

		const everyone: ILocalUser = await User.findOne({
			usernameLower: 'everyone',
			host: null
		});

		if (everyone) {
			const everyoneActivity = renderActivity(await packActivity(note, everyone));

			for (const inbox of followers.map(({ _follower }) => _follower).filter(isRemoteUser).map(({ sharedInbox, inbox }) => sharedInbox || inbox)) {
				if (!queue.includes(inbox)) {
					queue.push(inbox);
				}
			}

			for (const inbox of queue) {
				deliver(everyone, everyoneActivity, inbox);
			}
		}
	}

	// 後方互換製のため、Questionは時間差でNoteでも送る
	// Questionに対応してないインスタンスは、2つめのNoteだけを採用する
	// Questionに対応しているインスタンスは、同IDで採番されている2つめのNoteを無視する
	setTimeout(() => {
		if (noteActivity.object.type === 'Question') {
			const asNote = deepcopy(noteActivity);

			asNote.object.type = 'Note';
			asNote.object.content = asNote.object._twista_fallback_content;

			for (const inbox of queue) {
				deliver(user as any, asNote, inbox);
			}
		}
	}, 10 * 1000);
}

function deliverNoteToMentionedRemoteUsers(mentionedUsers: IUser[], user: ILocalUser, noteActivity: any) {
	for (const u of mentionedUsers.filter(u => isRemoteUser(u))) {
		deliver(user, noteActivity, (u as IRemoteUser).inbox);
	}
}

function deliverNoteToImasHosts(user: ILocalUser, noteActivity: any) {
	for (const x of imasHosts.map(x => `https://${x}/inbox`)) {
		deliver(user, noteActivity, x);
	}
}

async function createMentionedEvents(mentionedUsers: IUser[], note: INote, nm: NotificationManager) {
	for (const u of mentionedUsers.filter(u => isLocalUser(u))) {
		const detailPackedNote = await pack(note, u, {
			detail: true
		});

		publishMainStream(u._id, 'mention', detailPackedNote);

		// Create notification
		nm.push(u._id, 'mention');
	}
}

function saveQuote(renote: INote, note: INote) {
	Note.update({ _id: renote._id }, {
		$push: {
			_quoteIds: note._id
		}
	});
}

function saveReply(reply: INote, note: INote) {
	Note.update({ _id: reply._id }, {
		$inc: {
			repliesCount: 1
		}
	});
}

function incNotesCountOfUser(user: IUser) {
	User.update({ _id: user._id }, {
		$set: {
			updatedAt: new Date()
		},
		$inc: {
			notesCount: 1
		}
	});
}

function incNotesCount(user: IUser) {
	if (isLocalUser(user)) {
		Meta.update({}, {
			$inc: {
				'stats.notesCount': 1,
				'stats.originalNotesCount': 1
			}
		}, { upsert: true });
	} else {
		Meta.update({}, {
			$inc: {
				'stats.notesCount': 1
			}
		}, { upsert: true });
	}
}

async function extractMentionedUsers(user: IUser, tokens: ReturnType<typeof parse>): Promise<IUser[]> {
	if (tokens == null) return [];

	const mentions = extractMentions(tokens);

	let mentionedUsers =
		erase(null, await Promise.all(mentions.map(async m => {
			try {
				return await resolveUser(m.username, m.host ? m.host : user.host);
			} catch (e) {
				return null;
			}
		})));

	// Drop duplicate users
	mentionedUsers = mentionedUsers.filter((u, i, self) =>
		i === self.findIndex(u2 => u._id.equals(u2._id))
	);

	return mentionedUsers;
}
