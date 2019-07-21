export default (value: string) => {
	return typeof value === 'string' && typeof navigator.clipboard.writeText === 'function' ?
		navigator.clipboard.writeText(value) :
		Promise.reject('navigator.clipboard.writeText is not supported');
};
