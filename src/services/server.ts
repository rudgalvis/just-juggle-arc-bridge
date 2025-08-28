/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { onProcessClose } from '../utils/on-process-close'
import { ArcSpaceMonitor } from './ArcSpaceMonitor'

const arcSpaceMonitor = new ArcSpaceMonitor();

arcSpaceMonitor.listenForWindowsChange({ updateArcSpaceOnChange: true });

onProcessClose((signal) => arcSpaceMonitor.gracefulShutDown(signal));