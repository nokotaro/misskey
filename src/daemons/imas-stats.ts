import * as WebSocket from 'ws';
import config from '../config';
import { query } from '../prelude/url';
import { createNote } from '../remote/activitypub/models/note';

export default function() {
	const connection: Record<string, {
		lastConnectedAt: number;
		interval: number;
	}> = {};

	const connect = (url: string) => {
		const socket = new WebSocket(url);

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

		socket.on('open', () => {
			if (!connection[url])
				connection[url] = {
					lastConnectedAt: 0,
					interval: 0
				};

			connection[url].lastConnectedAt = Date.now();
		});

		socket.on('close', _ => {
			if (!connection[url])
				connection[url] = {
					lastConnectedAt: 0,
					interval: 0
				};

			connection[url].interval = Date.now() - connection[url].lastConnectedAt >> 16 ? 0 : connection[url].interval << 1 || 1;

			setTimeout(connect, connection[url].interval, socket);
		});
	};

	for (const [k, v] of Object.entries(config.imasHostTokens))
		connect(`https://${k}/api/v1/streaming?${query({
			access_token: v,
			stream: 'public:local'
		})}`);
}
