/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { onProcessClose } from '../utils/on-process-close'
import { ArcNativeModulesMonitor } from './ArcNativeModulesMonitor'

const arcSpaceMonitor = new ArcNativeModulesMonitor();

arcSpaceMonitor.listenForWindowsChange({ updateArcSpaceOnChange: true });

onProcessClose((signal) => arcSpaceMonitor.gracefulShutDown(signal));