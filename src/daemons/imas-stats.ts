import * as WebSocket from 'ws';
import config from '../config';
import { query } from '../prelude/url';
import { createNote } from '../remote/activitypub/models/note';

const interval = 1024;

export default function() {
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

		socket.on('close', _ => setTimeout(connect, interval, socket));
	};

	for (const [k, v] of Object.entries(config.imasHostTokens))
		connect(`https://${k}/api/v1/streaming?${query({
			access_token: v,
			stream: 'public:local'
		})}`);
}
