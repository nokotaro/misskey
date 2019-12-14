import { toArray, toSingle } from '../../prelude/array';

export type AnyObject = Record<string, any>;
export type Item = IObject | string | (IObject | string)[];

export interface IObject {
	'@context': string | AnyObject | AnyObject[];
	type: string;
	id?: string;
	summary?: string;
	published?: string;
	cc?: Item;
	to?: Item;
	attributedTo: Item;
	attachment?: Item;
	inReplyTo?: Item;
	replies?: ICollection;
	content: string;
	name?: string;
	startTime?: Date;
	endTime?: Date;
	icon?: IApImage | IApImage[];
	image?: IApImage | IApImage[];
	url?: string;
	tag?: IObject | IObject[];
	sensitive?: boolean;
}

/**
 * Get array of ActivityStreams Objects id
 */
export function getApIds(value: Item): string[] {
	if (value == null) return [];
	const array = toArray(value);
	return array.map(x => getApId(x));
}

/**
 * Get first ActivityStreams Object id
 */
export function getOneApId(value: Item): string {
	const firstOne = toSingle(value);
	return getApId(firstOne);
}

/**
 * Get ActivityStreams Object id
 */
export function getApId(value: string | IObject): string {
	if (typeof value === 'string') return value;
	if (typeof value.id === 'string') return value.id;
	throw new Error(`cannot detemine id`);
}

export interface IActivity extends IObject {
	//type: 'Activity';
	actor: IObject | string;
	object: IObject | string;
	target?: IObject | string;
	signature?: {};
}

export interface ICollection extends IObject {
	type: 'Collection';
	totalItems: number;
	items?: Item;
	current?: ICollectionPage;
	first?: ICollectionPage;
	last?: ICollectionPage;
}

export interface ICollectionPage extends IObject {
	type: 'CollectionPage';
	totalItems: number;
	items?: Item;
	current?: ICollectionPage;
	first?: ICollectionPage;
	last?: ICollectionPage;	partOf: string;
	next?: ICollectionPage;
	prev?: ICollectionPage;
}

export interface IOrderedCollection extends IObject {
	type: 'OrderedCollection';
	totalItems: number;
	orderedItems?: Item;
	current?: IOrderedCollectionPage;
	first?: IOrderedCollectionPage;
	last?: IOrderedCollectionPage;
}

export interface IOrderedCollectionPage extends IObject {
	type: 'OrderedCollectionPage';
	totalItems: number;
	orderedItems?: Item;
	current?: IOrderedCollectionPage;
	first?: IOrderedCollectionPage;
	last?: IOrderedCollectionPage;
	partOf: string;
	next?: IOrderedCollectionPage;
	prev?: IOrderedCollectionPage;
	startIndex?: number;
}

export interface IApNote extends IObject {
	type: 'Note' | 'Question' | 'Article' | 'Audio' | 'Document' | 'Image' | 'Page' | 'Video';
	_misskey_content?: string;
	_misskey_quote?: string;
	_misskey_rating?: string;
	_misskey_qa?: string;
	quoteUrl?: string;
	_misskey_talk: boolean;
}

export const isNote = (object: IObject): object is IApNote =>
	['Note', 'Question', 'Article', 'Audio', 'Document', 'Image', 'Page', 'Video'].includes(object.type);

export interface IQuestion extends IObject {
	type: 'Note' | 'Question';
	_misskey_content?: string;
	_misskey_quote?: string;
	_misskey_rating?: string;
	_misskey_qa?: string;
	quoteUrl?: string;
	oneOf?: IQuestionChoice[];
	anyOf?: IQuestionChoice[];
	endTime?: Date;
	closed?: Date;
}

export const isQuestion = (object: IObject): object is IQuestion =>
	object.type === 'Note' || object.type === 'Question';

interface IQuestionChoice {
	name?: string;
	replies?: ICollection;
	_misskey_votes?: number;
}

export const actorMap = {
	// 'Application': false,
	// 'Group': false,
	'Organization': false,
	'Person': false,
	'Service': true
};
export const validDocument = ['Audio', 'Document', 'Image', 'Page', 'Video'] as const;

export interface IApDocument extends IObject {
	type: typeof validDocument[number];
}

export const isDocument = (object: IObject): object is IApDocument =>
	validDocument.includes(object.type as typeof validDocument[number]);

export interface IApImage extends IObject {
	type: 'Image';
}

export const isImage = (object: IObject): object is IApImage =>
	object.type === 'Image';

export const actorIsBot: Record<keyof typeof actorMap, boolean> = actorMap;

export const validActor = Object.keys(actorMap);

export interface IApPropertyValue extends IObject {
	type: 'PropertyValue';
	identifier: IApPropertyValue;
	value: string;
}

export const isPropertyValue = (object: IObject): object is IApPropertyValue =>
	object &&
	object.type === 'PropertyValue' &&
	typeof object.name === 'string' &&
	typeof (object as any).value === 'string';

export interface IApHashtag extends IObject {
	type: 'Hashtag';
}

export const isHashtag = (object: IObject): object is IApHashtag =>
	object.type === 'Hashtag' &&
	typeof object.name === 'string';

export interface IActor extends IObject {
	type: keyof typeof actorMap;
	name: string;
	preferredUsername: string;
	manuallyApprovesFollowers: boolean;
	inbox: string;
	sharedInbox?: string;
	publicKey: any;
	followers: any;
	following: any;
	featured?: any;
	outbox: any;
	endpoints: any;
}

export const isPerson = (object: IObject): object is IActor =>
	['Person', 'Service'].includes(object.type);

export interface IApEmoji extends IObject {
	type: 'Emoji';
	name: string;
	updated: Date;
}

export const isEmoji = (object: IObject): object is IApEmoji =>
	object.type === 'Emoji' && !Array.isArray(object.icon) && object.icon.url != null;

export const isCollection = (object: IObject): object is ICollection =>
	object.type === 'Collection';

export const isOrderedCollection = (object: IObject): object is IOrderedCollection =>
	object.type === 'OrderedCollection';

export const isCollectionOrOrderedCollection = (object: IObject): object is ICollection | IOrderedCollection =>
	isCollection(object) || isOrderedCollection(object);

export interface ICreate extends IActivity {
	type: 'Create';
}

export interface IDelete extends IActivity {
	type: 'Delete';
}

export interface IUpdate extends IActivity {
	type: 'Update';
}

export interface IUndo extends IActivity {
	type: 'Undo';
}

export interface IFollow extends IActivity {
	type: 'Follow';
}

export interface IAccept extends IActivity {
	type: 'Accept';
}

export interface IReject extends IActivity {
	type: 'Reject';
}

export interface IAdd extends IActivity {
	type: 'Add';
}

export interface IRemove extends IActivity {
	type: 'Remove';
}

export interface ILike extends IActivity {
	type: 'Like';
	_misskey_reaction: string;
}

export interface IAnnounce extends IActivity {
	type: 'Announce';
}

export interface IBlock extends IActivity {
	type: 'Block';
}
