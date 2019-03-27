declare module 'gulp-stylus' {
	type AccordStylusPlugin = (style: AccordStylusOptions) => void;

	type AccordStylusOptions = {
		define?: Record<string, any>;
		include?: string | string[];
		import?: string | string[];
		use?: AccordStylusPlugin | AccordStylusPlugin[];
	} & Record<string, string>;

	type ExtendedOptions = AccordStylusOptions & {
	};

	function cssnano(opts?: ExtendedOptions): any;

	namespace cssnano {} // Hack

	export = cssnano;
}
