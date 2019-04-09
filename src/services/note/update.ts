import Note, { INote } from '../../models/note';
import { IUser } from '../../models/user';

/**
 * 投稿を更新します。
 * @param user 更新者
 * @param note 投稿
 */
export default async function(user: IUser, note: INote, requestQa?: 'question' | 'answer' | 'bestAnswer' | null) {
	if (user._id !== note.userId && !user.isAdmin && !user.isModerator)
		return null;

	const reply = await Note.findOne({ _id: note.replyId });

	const answerable = reply && reply.qa === 'question';

	const bestAnswerable = answerable && reply.userId === user._id;

	const qa =
		['bestAnswer'].includes(requestQa) && bestAnswerable ? 'bestAnswer' :
		['bestAnswer', 'answer'].includes(requestQa) && answerable ? 'answer' :
		['question'].includes(requestQa) ? 'question' : null;

	const updatedAt = new Date();

	const result = await Note.findOneAndUpdate({
		_id: note._id
	}, {
		$set: {
			updatedAt,
			...(qa !== undefined ? { qa } : {})
		}
	}, {
		new: true
	});

	if (qa === 'bestAnswer') {
		await Note.update({
			_id: reply._id
		}, {
			$set: {
				updatedAt,
				qa: 'resolvedQuestion'
			}
		});
	}

	return result;
}
