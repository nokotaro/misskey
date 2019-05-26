/*
import { readFileSync } from 'fs';
import * as smime from 'nodemailer-smime';
import { homedir } from 'os';
import { join } from 'path';

export default ((readFromKeyRegistry: (name: string) => string) => smime({
		cert: readFromKeyRegistry('twista_smtp.crt'),
		key: readFromKeyRegistry('twista_smtp.key')
	}))(name => readFileSync(join(homedir(), '.keys', name), { encoding: 'ascii' }));
*/

export default {};
