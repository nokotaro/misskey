export function isNonNullObject(source: any): source is object {
	return typeof source === 'object' && source;
}
