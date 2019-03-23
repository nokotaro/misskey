declare module 'emojilib' {
	type Lib = Record<string, {
		keywords: string[];
		char: string;
		fitzpatrick_scale: boolean;
		category: string;
	}>;

	type Ordered = string[];

	type FitzpatrickScaleModifiers = string[];

	const emojilib: {
		lib: Lib;
		ordered: Ordered;
		fitzpatrick_scale_modifiers: FitzpatrickScaleModifiers;
	};

	export = emojilib;
}
