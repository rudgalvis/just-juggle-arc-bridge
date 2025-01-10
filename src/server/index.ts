import express from 'express';
import cors from 'cors';
import {
    getSpaceNameById,
    getStorableSidebar,
    getStorableWindows,
    itemsData,
    latestActiveTabs, latestActiveWindow,
    parseSpacesData,
} from "./parse-arc";

const server = express();
const port = process.env.PORT || 55513; // random port representing JJGLE where 5 is J & G, 1 is L, 3 is E
server.use(cors());

server.get('/ping', async (req, res) => {
    res.status(200)
    res.send('pong')
});

server.get('/recent-space', async (_, res) => {
    // Arc storable data
    const storableSidebar = await getStorableSidebar();
    const {windows} = await getStorableWindows()
    const {focusedSpaceID} = latestActiveWindow(windows)

    // Parsing data into usable format
    const spaces = parseSpacesData(storableSidebar);

    if (!spaces?.length) return res.json({spaceName: 'No spaces found', knownTab: null})

    const spaceName = getSpaceNameById(spaces, focusedSpaceID);
    const items = itemsData(storableSidebar);
    const tabs = latestActiveTabs(items, spaces)
    const knownTabIndex = tabs.findIndex(e => !!e.spaceName)
    const knownTab = tabs[knownTabIndex]

    res.json({
        spaceName,
        ...knownTab
    })
})

export const startServer = (p = port) => server.listen(p, () => {
    console.log(`Server running at http://localhost:${p}/`);
});
