import { ffprobe } from 'fluent-ffmpeg';
import { multiple } from '../../prelude/array';

type Stream = Record<'width' | 'height', number>;

type Probed = { streams: Stream[] };

export const measureVideoResoluttion = (path: string) => new Promise<[number, number]>((s, j) => ffprobe(path, (err, data: Probed) => err ? j(err) : s(data.streams
	.map(({ width, height }) => [width || 0, height || 0] as [number, number])
	.sort((a, b) => multiple(b) - multiple(a))[0])));
