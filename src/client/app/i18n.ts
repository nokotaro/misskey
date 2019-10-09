import { lang, locale } from './config';

export default function i18n(scope?: string) {
	const texts = scope ? locale[scope] || {} : {};
	texts['@'] = locale['common'];
	texts['@deck'] = locale['deck'];
	return {
		sync: false,
		locale: lang,
		messages: {
			[lang]: texts
		}
	};
}
