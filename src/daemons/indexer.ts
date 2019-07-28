import { getIndexer, mecabIndexVersion, droppedndexVersion } from '../misc/mecab';
import Note from '../models/note';

const interval = 0;

export async function index() {
	const note = await Note.findOne({
		mecabIndexVersion: { $nin: [mecabIndexVersion, droppedndexVersion] }
	}).catch(_ => null);

	if (!note) {
		return false;
	}

	const { _id } = note;

	await Note.findOneAndUpdate({ _id }, {
		$set: {
			mecabIndex: await getIndexer(note),
			mecabIndexVersion
		}
	}).catch(_ => {});

	return true;
}

function work() {
	index().then(x => x && setTimeout(work, interval), _ => setTimeout(work, interval));
}

export default work;
