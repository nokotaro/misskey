import { scheduleJob } from 'node-schedule';
import fetchMeta from '../misc/fetch-meta';
import User, { IUser } from '../models/user';
import create from '../services/note/create';
import { createSubLogger } from './logger';

const logger = createSubLogger('futaba-anzu-bot');

const text = `みなさん ! おはようございまーっす♪
今日も一日、元気いっぱいがんばろー !
#双葉杏bot`;

const requestCreate = (date: Date) => (date.setHours(7, 0, 0, 0), date.getTime() === (lastCreatedAt && lastCreatedAt.getTime())) ?
	Promise.reject() :
	Promise.resolve(lastCreatedAt = date);

let lastCreatedAt: Date = null;

export default function() {
	scheduleJob('futaba-anzu-bot', {
		hour: 7,
		minute: 0,
		second: 0,
	}, date => fetchMeta()
		.then(meta => User.findOne({
			usernameLower: meta.futabaAnzuBotAccount.toLowerCase(),
			host: null
		}))
		.then(user => user || Promise.reject<IUser>('Anzu bot not found.'))
		.then(user => requestCreate(date)
			.then(createdAt => create(user, { createdAt, text })))
		.then(
			x => logger.succ('success', { x }),
			e => logger.error('failure', { e })));
}
