import * as mongo from 'mongodb';
import db from '../db/mongodb';

const MirroringMastodonApp = db.get<IMirroringMastodonApp>('mirroringMastodonApps');
MirroringMastodonApp.createIndex('hostname', { unique: true });
export default MirroringMastodonApp;

export interface IMirroringMastodonApp {
	_id: mongo.ObjectID;
	hostname: string;
	clientId: string;
	clientSecret: string;
}
