const map: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\'': '&apos;'
};

const beginOfCDATA = '<![CDATA[';
const endOfCDATA = ']]>';

export function escapeValue(x: string): string {
	let insideOfCDATA = false;
	let builder = '';
	for (
		let i = 0;
		i < x.length;
	) {
		if (insideOfCDATA) {
			if (x.slice(i, i + endOfCDATA.length) === endOfCDATA) {
				insideOfCDATA = false;
				i += endOfCDATA.length;
				builder += endOfCDATA;
			} else {
				builder += x[i++];
			}
		} else {
			if (x.slice(i, i + beginOfCDATA.length) === beginOfCDATA) {
				insideOfCDATA = true;
				i += beginOfCDATA.length;
				builder += beginOfCDATA;
			} else {
				const b = x[i++];
				builder += map[b] || b;
			}
		}
	}
	return builder;
}

export function escapeAttribute(x: string): string {
	return Object.entries(map).reduce((a, [k, v]) => a.replace(k, v), x);
}
