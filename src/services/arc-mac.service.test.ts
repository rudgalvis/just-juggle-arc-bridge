import { test } from 'vitest'
import { ArcMacService } from './arc-mac.service'

test('test', async () => {
  const arcMacService =  new ArcMacService();
  const spaceName = await arcMacService.getLastActiveSpaceName()

  console.log({
    spaceName
  })
})