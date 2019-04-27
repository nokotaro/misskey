declare module 'progress-bar-webpack-plugin' {
	import { Plugin } from 'webpack';

	interface IProgressBarPluginConstructorOptions {
		complete?: string;
		incomplete?: string;
		width?: number;
		total?: number;
		clear?: boolean;
	}

	class ProgressBarPlugin extends Plugin {
		constructor(options: IProgressBarPluginConstructorOptions);
	}

	namespace ProgressBarPlugin {} // Hack

	export = ProgressBarPlugin;
}
