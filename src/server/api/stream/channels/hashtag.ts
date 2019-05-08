import autobind from 'autobind-decorator';
import Mute from '../../../../models/mute';
import { pack } from '../../../../models/note';
import shouldIgnoreThisNote from '../../../../misc/should-ignore-this-note';
import Channel from '../channel';
import Blocking from '../../../../models/blocking';

export default class extends Channel {
	public readonly chName = 'hashtag';
	public static shouldShare = false;
	public static requireCredential = false;

	@autobind
	public async init(params: any) {
		const mute = this.user ? await Mute.find({ muterId: this.user._id }) : [];
		const blocking = this.user ? await Blocking.find({ blockerId: this.user._id }) : [];
		const ignoredUserIds = [
			...mute.map(x => x.muteeId.toHexString()),
			...blocking.map(x => x.blockeeId.toHexString())
		];

		const q: string[][] = params.q;

		if (q == null) return;

		// Subscribe stream
		this.subscriber.on('hashtag', async note => {
			const noteTags = note.tags.map((t: string) => t.toLowerCase());
			const matched = q.some(tags => tags.every(tag => noteTags.includes(tag.toLowerCase())));
			if (!matched) return;

			// Renoteなら再pack
			if (note.renoteId != null) {
				note.renote = await pack(note.renoteId, this.user, {
					detail: true
				});
			}

			// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
			if (await shouldIgnoreThisNote(note, ignoredUserIds)) return;

			this.send('note', note);
		});
	}
}
