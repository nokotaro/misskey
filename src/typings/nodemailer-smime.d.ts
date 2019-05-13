declare module 'nodemailer-smime' {
	import { Transporter } from 'nodemailer';

	interface ISMIMEOptions {
		cert: string;
		chain?: string[];
		key: string;
	}

	function smime(options: ISMIMEOptions): Parameters<Transporter['use']>[1];

	namespace smime {} // Hack

	export = smime;
}
