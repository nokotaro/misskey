/**
 * twista Entry Point!
 */

Error.stackTraceLimit = Infinity;

require('events').EventEmitter.defaultMaxListeners = 128;

//#region global type definition tweaks
// tslint:disable
declare global {
	interface ArrayConstructor {
    /**
     * Returns a new array from a set of elements.
     * @param item1 One of elements to include in the new array object.
     * @param item2 One of elements to include in the new array object.
     * @param item3 One of elements to include in the new array object.
     * @param item4 One of elements to include in the new array object.
     * @param item5 One of elements to include in the new array object.
     * @param item6 One of elements to include in the new array object.
     * @param item7 One of elements to include in the new array object.
     * @param item8 One of elements to include in the new array object.
     */
		of<T1, T2, T3, T4, T5, T6, T7, T8>(item1: T1, item2: T2, item3: T3, item4: T4, item5: T5, item6: T6, item7: T7, item8: T8): [T1, T2, T3, T4, T5, T6, T7, T8];

    /**
     * Returns a new array from a set of elements.
     * @param item1 One of elements to include in the new array object.
     * @param item2 One of elements to include in the new array object.
     * @param item3 One of elements to include in the new array object.
     * @param item4 One of elements to include in the new array object.
     * @param item5 One of elements to include in the new array object.
     * @param item6 One of elements to include in the new array object.
     * @param item7 One of elements to include in the new array object.
     */
		of<T1, T2, T3, T4, T5, T6, T7>(item1: T1, item2: T2, item3: T3, item4: T4, item5: T5, item6: T6, item7: T7): [T1, T2, T3, T4, T5, T6, T7];

    /**
     * Returns a new array from a set of elements.
     * @param item1 One of elements to include in the new array object.
     * @param item2 One of elements to include in the new array object.
     * @param item3 One of elements to include in the new array object.
     * @param item4 One of elements to include in the new array object.
     * @param item5 One of elements to include in the new array object.
     * @param item6 One of elements to include in the new array object.
     */
		of<T1, T2, T3, T4, T5, T6>(item1: T1, item2: T2, item3: T3, item4: T4, item5: T5, item6: T6): [T1, T2, T3, T4, T5, T6];

    /**
     * Returns a new array from a set of elements.
     * @param item1 One of elements to include in the new array object.
     * @param item2 One of elements to include in the new array object.
     * @param item3 One of elements to include in the new array object.
     * @param item4 One of elements to include in the new array object.
     * @param item5 One of elements to include in the new array object.
     */
		of<T1, T2, T3, T4, T5>(item1: T1, item2: T2, item3: T3, item4: T4, item5: T5): [T1, T2, T3, T4, T5];

    /**
     * Returns a new array from a set of elements.
     * @param item1 One of elements to include in the new array object.
     * @param item2 One of elements to include in the new array object.
     * @param item3 One of elements to include in the new array object.
     * @param item4 One of elements to include in the new array object.
     */
		of<T1, T2, T3, T4>(item1: T1, item2: T2, item3: T3, item4: T4): [T1, T2, T3, T4];

    /**
     * Returns a new array from a set of elements.
     * @param item1 One of elements to include in the new array object.
     * @param item2 One of elements to include in the new array object.
     * @param item3 One of elements to include in the new array object.
     */
		of<T1, T2, T3>(item1: T1, item2: T2, item3: T3): [T1, T2, T3];

    /**
     * Returns a new array from a set of elements.
     * @param item1 One of elements to include in the new array object.
     * @param item2 One of elements to include in the new array object.
     */
		of<T1, T2>(item1: T1, item2: T2): [T1, T2];

    /**
     * Returns a new array from a set of elements.
     * @param item1 One of elements to include in the new array object.
     */
		of<T1>(item1: T1): [T1];
	}
}
// tslint:enable
//#endregion

import * as os from 'os';
import * as cluster from 'cluster';
import chalk from 'chalk';
import Xev from 'xev';

import Logger from './services/logger';
import serverStats from './daemons/server-stats';
import notesStats from './daemons/notes-stats';
import queueStats from './daemons/queue-stats';
import imasTlWorker from './daemons/imas-tl-worker';
import futabaAnzuBot from './daemons/futaba-anzu-bot';
import loadConfig from './config/load';
import { Config } from './config/types';
import { lessThan } from './prelude/array';
import * as pkg from '../package.json';
import { program } from './argv';
import { checkMongoDB } from './misc/check-mongodb';
import { showMachineInfo } from './misc/show-machine-info';

const logger = new Logger('core', 'cyan');
const bootLogger = logger.createSubLogger('boot', 'magenta', false);
const clusterLogger = logger.createSubLogger('cluster', 'orange');
const ev = new Xev();

/**
 * Init process
 */
function main() {
	process.title = `twista (${cluster.isMaster ? 'master' : 'worker'})`;

	if (program.onlyQueue) {
		queueMain();
		return;
	}

	if (cluster.isMaster || program.disableClustering) {
		masterMain();

		if (cluster.isMaster) {
			ev.mount();
		}

		if (program.daemons) {
			serverStats();
			notesStats();
			queueStats();
			imasTlWorker();
			futabaAnzuBot();
		}
	}

	if (cluster.isWorker || program.disableClustering) {
		workerMain();
	}
}

function greet() {
	console.log(chalk`${os.hostname()} {gray (PID: ${process.pid.toString()})}`);

	bootLogger.info('Welcome to twista!');
	bootLogger.info(`twista v${pkg.version}`, null, true);
	bootLogger.info('twista is maintained by @346design.');
	bootLogger.info('Misskey (fork base) is maintained by @syuilo, @AyaMorisawa, @mei23, and @acid-chicken.');
}

/**
 * Init master process
 */
async function masterMain() {
	greet();

	let config: Config;

	try {
		// initialize app
		config = await init();

		if (config.port == null) {
			bootLogger.error('The port is not configured. Please configure port.', null, true);
			process.exit(1);
		}
	} catch (e) {
		bootLogger.error('Fatal error occurred during initialization', null, true);
		process.exit(1);
	}

	bootLogger.succ('twista initialized');

	if (!program.disableClustering) {
		await spawnWorkers(config.clusterLimit);
	}

	bootLogger.succ(`Now listening on port ${config.port} on ${config.url}`, null, true);
}

/**
 * Init worker process
 */
async function workerMain() {
	// start server
	await require('./server').default();

	// start job queue
	require('./queue').default();

	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send('ready');
	}
}

async function queueMain() {
	greet();

	try {
		// initialize app
		await init();
	} catch (e) {
		bootLogger.error('Fatal error occurred during initialization', null, true);
		process.exit(1);
	}

	bootLogger.succ('twista initialized');

	// start processor
	require('./queue').default();

	bootLogger.succ('Queue started', null, true);
}

const runningNodejsVersion = process.version.slice(1).split('.').map(x => parseInt(x, 10));
const requiredNodejsVersion = [10, 0, 0];
const satisfyNodejsVersion = !lessThan(runningNodejsVersion, requiredNodejsVersion);

function showEnvironment(): void {
	const env = process.env.NODE_ENV;
	const logger = bootLogger.createSubLogger('env');
	logger.info(typeof env == 'undefined' ? 'NODE_ENV is not set' : `NODE_ENV: ${env}`);

	if (env !== 'production') {
		logger.warn('The environment is not in production mode.');
		logger.warn('DO NOT USE FOR PRODUCTION PURPOSE!', null, true);
	}
}

/**
 * Init app
 */
async function init(): Promise<Config> {
	showEnvironment();

	const nodejsLogger = bootLogger.createSubLogger('nodejs');

	nodejsLogger.info(`Version ${runningNodejsVersion.join('.')}`);

	if (!satisfyNodejsVersion) {
		nodejsLogger.error(`Node.js version is less than ${requiredNodejsVersion.join('.')}. Please upgrade it.`, null, true);
		process.exit(1);
	}

	await showMachineInfo(bootLogger);

	const configLogger = bootLogger.createSubLogger('config');
	let config;

	try {
		config = loadConfig();
	} catch (exception) {
		if (typeof exception === 'string') {
			configLogger.error(exception);
			process.exit(1);
		}
		if (exception.code === 'ENOENT') {
			configLogger.error('Configuration file not found', null, true);
			process.exit(1);
		}
		throw exception;
	}

	configLogger.succ('Loaded');

	// Try to connect to MongoDB
	try {
		await checkMongoDB(config, bootLogger);
	} catch (e) {
		bootLogger.error('Cannot connect to database', null, true);
		process.exit(1);
	}

	return config;
}

async function spawnWorkers(limit: number = Infinity) {
	const workers = Math.min(limit, os.cpus().length);
	bootLogger.info(`Starting ${workers} worker${workers === 1 ? '' : 's'}...`);
	await Promise.all([...Array(workers)].map(spawnWorker));
	bootLogger.succ('All workers started');
}

function spawnWorker(): Promise<void> {
	return new Promise(res => {
		const worker = cluster.fork();
		worker.on('message', message => {
			if (message !== 'ready') return;
			res();
		});
	});
}

//#region Events

// Listen new workers
cluster.on('fork', worker => {
	clusterLogger.debug(`Process forked: [${worker.id}]`);
});

// Listen online workers
cluster.on('online', worker => {
	clusterLogger.debug(`Process is now online: [${worker.id}]`);
});

// Listen for dying workers
cluster.on('exit', worker => {
	// Replace the dead worker,
	// we're not sentimental
	clusterLogger.error(chalk.red(`[${worker.id}] died :(`));
	cluster.fork();
});

// Display detail of unhandled promise rejection
if (!program.quiet) {
	process.on('unhandledRejection', console.dir);
}

// Display detail of uncaught exception
process.on('uncaughtException', err => {
	logger.error(err);
});

// Dying away...
process.on('exit', code => {
	logger.info(`The process is going to exit with code ${code}`);
});

//#endregion

main();
