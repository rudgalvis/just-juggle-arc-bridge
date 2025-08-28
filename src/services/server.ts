/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import http from 'http';
import fs from 'fs';
import path from 'path';

import ws from 'ws';

import ActiveWindow, { WindowInfo } from './native-active-window/NativeActiveWindow';

ActiveWindow.initialize({ osxRunLoop: 'all' });
ActiveWindow.requestPermissions();

let winInfo: WindowInfo | null = null;

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

const watchId = ActiveWindow.subscribe(curWinInfo => {
	if (curWinInfo == null) {
		console.log('Got null window');
		return;
	}
//	console.log( curWinInfo.application, curWinInfo)

	if (!objectDeepCompare(curWinInfo, winInfo)) {
		// different
		console.log('Broadcasting changes...',);
		winInfo = curWinInfo;
	}
});

console.log('Started watching with ID:', watchId);

process.on('SIGINT', () => {
	console.log('Closing');
	ActiveWindow.unsubscribe(watchId);


	setTimeout(() => {
		console.log('Exited');
		process.exit(0);
	}, 1000);
});
