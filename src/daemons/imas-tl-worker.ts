import * as WebSocket from 'ws';
import * as request from 'request-promise-native';
import config from '../config';
import { query } from '../prelude/url';
import { createNote } from '../remote/activitypub/models/note';
import { createSubLogger } from './logger';

const logger = createSubLogger('imas-tl-worker');

const interval = 1024;

function work() {
	try {
		const connect = (host: string, token: string) => {
			logger.info(`connect @${host}`);

			const socket = new WebSocket(`https://${host}/api/v1/streaming?${query({
				access_token: token,
				stream: 'public:local'
			})}`);

			socket.on('message', x => {
				try {
					const data: {
						event?: string,
						payload?: string
					} = JSON.parse(typeof x === 'string' ? x : x.toString());

					logger.info(`message @${host}`, { data });

					if (data.event === 'update' && typeof data.payload === 'string') {
						const payload: {
							uri?: string
						} = JSON.parse(data.payload);

						if (typeof payload.uri === 'string')
							createNote(payload.uri);
					}
				} catch (e) {
					logger.error(`message @${host}`, { e });
				}
			});

			socket.on('open', () => {
				try {
					request({
						url: `https://${host}/api/v1/timelines/public?${query({
							local: true,
							limit: 40
						})}`,
						proxy: config.proxy,
						headers: {
							'User-Agent': config.userAgent,
							Accept: 'application/json+oembed, application/json'
						},
						json: true
					}).then(response => (logger.info(`open @${host}`, { response }), Array.isArray(response) && response
						.filter(x => typeof x === 'object' && typeof x.uri === 'string')
						.reduceRight<Promise<void>>((a, c) => a.then(() => createNote(c)).then(() => {}), Promise.resolve())));
				} catch (e) {
					logger.error(`open @${host}`, { e });
				}
			});

			socket.on('close', _ => {
				logger.info(`close @${host}`);
				setTimeout(connect, interval, host, token);
			});
		};

		for (const [k, v] of Object.entries(config.imasHostTokens))
			connect(k, v);
	} catch (e) {
		logger.error('error', { e }, true);
		setTimeout(work, interval);
	}
}

export default work;
