import { create } from 'xmlbuilder';

/**
 * Convert to XML
 * @param obj source object
 */
export function objectToXml(obj: {}): string {
	const xml = create(obj, { encoding: 'utf-8' });
	return xml.end({ pretty: true });
}
