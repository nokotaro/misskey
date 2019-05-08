import autobind from 'autobind-decorator';
import Mute from '../../../../models/mute';
import Channel from '../channel';
import Blocking from '../../../../models/blocking';

export default class extends Channel {
	public readonly chName = 'main';
	public static shouldShare = true;
	public static requireCredential = true;

	@autobind
	public async init(params: any) {
		const mute = await Mute.find({ muterId: this.user._id });
		const blocking = await Blocking.find({ blockerId: this.user._id });
		const ignoredUserIds = [
			...mute.map(x => x.muteeId.toHexString()),
			...blocking.map(x => x.blockeeId.toHexString())
		];

		// Subscribe main stream channel
		this.subscriber.on(`mainStream:${this.user._id}`, async data => {
			const { type, body } = data;

			switch (type) {
				case 'notification': {
					if (ignoredUserIds.includes(body.userId)) return;
					if (body.note && body.note.isHidden) return;
					break;
				}
				case 'mention': {
					if (ignoredUserIds.includes(body.userId)) return;
					if (body.isHidden) return;
					break;
				}
			}

			this.send(type, body);
		});
	}
}
