import { ObjectID } from 'mongodb';

export default function isObjectID(x: any): x is ObjectID {
	return x && typeof x === 'object' && (x.hasOwnProperty('toHexString') || x.hasOwnProperty('_bsontype'));
}
