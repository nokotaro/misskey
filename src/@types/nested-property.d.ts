declare module 'nested-property' {
	interface IHasNestedPropertyOptions {
		own?: boolean;
	}

	interface IIsInNestedPropertyOptions {
		validPath?: boolean;
	}

	export function set<T>(object: T, property: string, value: any): T;

	export function get(object: Record<string, any>, property: string): any;

	export function has(object: Record<string, any>, property: string, options?: IHasNestedPropertyOptions): boolean;

	export function hasOwn(object: Record<string, any>, property: string, options?: IHasNestedPropertyOptions): boolean;

	export function isIn(object: Record<string, any>, property: string, objectInPath: Record<string, any>, options?: IIsInNestedPropertyOptions): boolean;
}
