import {test} from 'vitest'
import {
    getSpaceNameById,
    getStorableSidebar,
    getStorableWindows, itemsData, latestActiveTabs,
    latestActiveWindow,
    parseSpacesData
} from "./parse-arc";

test('test', async () => {
    const sidebar = await getStorableSidebar()
    const {windows} = await getStorableWindows()
    const spaces = await parseSpacesData(sidebar)
    const {focusedSpaceID} = latestActiveWindow(windows)

    const spaceName = getSpaceNameById(spaces, focusedSpaceID);

    const items = itemsData(sidebar);
    const tabs = latestActiveTabs(items, spaces)
    const knownTabIndex = tabs.findIndex(e => !!e.spaceName)
    const knownTab = tabs[knownTabIndex]

    console.log({
        focusedSpaceID,
        spaces,
        knownTab
//        windows,
//        spaceName
    })
})