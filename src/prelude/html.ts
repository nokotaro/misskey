import { JSDOM } from 'jsdom';

export function textContent(source: string) {
	return new JSDOM(`<!DOCTYPE html><meta charset="utf-8"><body>${source}</body>`).window.document.body.textContent;
}
