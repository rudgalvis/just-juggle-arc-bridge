import { test } from 'vitest'
import { getLastFocusedSpace } from '../utils/get-last-focused-space'
import { parseSpaces } from '../utils/parse-spaces'
import { ArcMacService } from './arc-mac.service'

test('test', async () => {
  const arcMacService =  new ArcMacService();
  const spaceName = await arcMacService.getLastActiveSpaceName()
  const p = await arcMacService.getProfileSpaces()

  console.log(spaceName)
//  console.log(p)
//  console.log(p.profileGroups.map(e => e.spaces))

//  console.log({
//    spaceName
//  })
})

test('test2', async () => {
  const arcMacService =  new ArcMacService();

//  const b = await arcMacService.parseWindows()

//  const r = parseSpaces(arcMacService.sidebar)
//  const n = getLastFocusedSpace(arcMacService.windows)

//  console.log(b)
})