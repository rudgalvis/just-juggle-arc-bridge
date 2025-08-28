import { test } from 'vitest'
import { ArcNativeModulesMonitor } from './ArcNativeModulesMonitor'

const arcSpaceMonitor = new ArcNativeModulesMonitor()

test('Get Arc space using native modules', async () => {

  console.log('Checking space in 5 seconds...')
  console.log('Open up Arc window so it would be the active one.')

  // Countdown from 5 to 1
  for (let i = 5; i > 0; i--) {
    console.log(i)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const space = arcSpaceMonitor.getActiveWindowSpace()

  console.log(space)

  arcSpaceMonitor.cleanup()
}, {timeout: 10000})