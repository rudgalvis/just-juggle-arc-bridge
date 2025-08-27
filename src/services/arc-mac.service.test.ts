import { test } from 'vitest'
import { ArcMacService } from './arc-mac.service'

test('Try getting last active space name from Arc .jsons on Mac.', async () => {
  const arcMacService =  new ArcMacService();
  const spaceName = await arcMacService.getLastActiveSpaceName()

  console.log({ spaceName })
})
