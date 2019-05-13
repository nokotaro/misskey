import { INote } from '../../../models/note';
import { toHtml } from '../../../mfm/toHtml';
import { parse } from '../../../mfm/parse';

export default function(note: INote) {
	return toHtml(parse(note.text, true), note.mentionedRemoteUsers) || '<p><span class="placeholder">\u200b</span></p>';
}
