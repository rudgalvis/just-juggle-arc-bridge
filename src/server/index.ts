import express from 'express';
import cors from 'cors';
import fs from "fs";
import { getSidebarJson, itemsData, spacesData, tabsData } from "./parse-arc";

// Create Express server
const server = express();
const port = process.env.PORT || 55513; // random port representing JJGLE where 5 is J & G, 1 is L, 3 is E

// Use cors middleware
server.use(cors());

// Create / route
server.get('/ping', async (req, res) => {
    res.status(200)
    res.send('pong')
});

server.get('/tab/:tabId', async (req, res) => {
    const data = await getSidebarJson();

    const spaces = spacesData(data);
    const items = itemsData(data);
    const tabs = tabsData(items, spaces);

    const space = tabs.filter(e => e.tabId === +req.params.tabId);

    if (space[0]) {
        return res.json(space[0]);
    } else {
        res.status(404)
        return res.json({error: 'No space found'})
    }
});

server.get('/dev', async (req, res) => {
    const data = await getSidebarJson();

    const spaces = spacesData(data);
    const items = itemsData(data);
    const tabs = tabsData(items, spaces);

//    const space = tabs.filter(e => e.tabId === +req.params.tabId);

    res.json(data)
})

export const startServer = () => server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

startServer()