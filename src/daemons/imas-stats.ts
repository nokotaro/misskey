import * as WebSocket from 'ws';
import config from '../config';
import { query } from '../prelude/url';
import { createNote } from '../remote/activitypub/models/note';

export default function() {
	const sockets = config.imasHostTokens ? Object.entries(config.imasHostTokens).map(([k, v]) => new WebSocket(`https://${k}/api/v1/streaming?${query({
		access_token: v,
		stream: 'public:local'
	})}`)) : [];

	for (const socket of sockets)
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
}
