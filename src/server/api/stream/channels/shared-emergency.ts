import autobind from 'autobind-decorator';
import Channel from '../channel';

export default class extends Channel {
	public readonly chName = 'sharedEmergency';
	public static shouldShare = true;
	public static requireCredential = false;

	@autobind
	public async init(params: any) {
		// Subscribe shared emergency stream channel
		this.subscriber.on('sharedEmergencyStream', async data => {
			const { type, body } = data;

			this.send(type, body);
		});
	}
}
