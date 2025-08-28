import { test } from 'vitest'
import { ArcMacStorablesParser } from './ArcMacStorablesParser'


test('Should get last active space name from Arc .jsons on Mac.', async () => {
  const  a= new ArcMacStorablesParser()
  const space = await a.getLastActiveSpaceName()

  console.log(space)
})
