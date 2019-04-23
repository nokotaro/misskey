declare module 'gulp-cssnano' {
	import { ProcessOptions } from 'postcss';

	type ExtendedOptions = ProcessOptions & {
		/** @deprecated Use `map` instead of `sourcemap`. */
		sourcemap: any;
	};

	function cssnano(opts?: ExtendedOptions): any;

	namespace cssnano {} // Hack

	export = cssnano;
}
