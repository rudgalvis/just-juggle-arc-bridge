/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { getSpaceViaOsa } from '../utils/mac/get-space-via-osa'
import { measurePerformance } from '../utils/measure-performance'
import ActiveWindow, { WindowInfo } from './native-active-window/NativeActiveWindow';

ActiveWindow.initialize({ osxRunLoop: 'all' });
ActiveWindow.requestPermissions();

const winInfo: WindowInfo | null = null;

const objectDeepCompare = (a: any, b: any): boolean => {
	return Object.keys(a).reduce((acc: boolean, cur) => {
		if (cur == 'icon') {
			return acc;
		}

		if (!b) {
			return false;
		}

		if (typeof a[cur] == 'object') {
			return acc && objectDeepCompare(a[cur], b[cur]);
		}

		return acc && a[cur] == b[cur];
	}, true);
};



const watchId = ActiveWindow.subscribe(async curWinInfo => {
	if (curWinInfo == null) {
		console.log('Got null window');
		return;
	}

	console.log(curWinInfo)

//	const res = await measurePerformance(getSpaceViaOsa)
//	console.log(res)

//	if (!objectDeepCompare(curWinInfo, winInfo)) {
//		// different
//		console.log('Broadcasting changes...',);
//		winInfo = curWinInfo;
//	}
});

console.log('Started watching with ID:', watchId);

// Graceful shutdown function
const gracefulShutdown = (signal: string) => {
		console.log(`Received ${signal}. Shutting down gracefully...`);

		ActiveWindow.unsubscribe(watchId);

	setTimeout(() => {
		console.error('Active window unsubscribed. Exiting.');
		process.exit(0);
	}, 1000);

		// Force shutdown after 10 seconds if graceful shutdown fails
		setTimeout(() => {
			console.error('Force shutdown after timeout');
			process.exit(1);
		}, 10000);

};


process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle Ctrl+C in terminal (SIGINT)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle other termination signals
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error);
	gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
	gracefulShutdown('unhandledRejection');
});

