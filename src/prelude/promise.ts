export function promisify<T = any, U = any>(callback: (callback: (error: U, response: T) => void) => void) {
	return new Promise<T>((s, j) => callback((e, r) => e ? j(e) : s(r)));
}
