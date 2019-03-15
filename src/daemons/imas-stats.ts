import * as WebSocket from 'ws';
import * as request from 'request-promise-native';
import config from '../config';
import { query } from '../prelude/url';
import { createNote } from '../remote/activitypub/models/note';

const interval = 1024;

export default function() {
	const connect = (host: string, token: string) => {
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

				if (data.event === 'update' && typeof data.payload === 'string') {
					const payload: {
						uri?: string
					} = JSON.parse(data.payload);

					if (typeof payload.uri === 'string')
						createNote(payload.uri);
				}
			} finally {
			}
		});

		socket.on('open', () => request({
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
			}).then(response => Array.isArray(response) && response
				.filter(x => typeof x === 'object' && typeof x.uri === 'string')
				.reduceRight<Promise<void>>((a, c) => a.then(() => createNote(c)).then(() => {}), Promise.resolve())));

		socket.on('close', _ => setTimeout(connect, interval, socket));
	};

	for (const [k, v] of Object.entries(config.imasHostTokens))
		connect(k, v);
}
