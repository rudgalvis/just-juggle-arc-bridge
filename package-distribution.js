#!/usr/bin/env node

import {exec} from "child_process";

const executeCommand = async (command) => new Promise((res, rej) => {
    exec(command, (error, stdout) => {
        if (error) {
            const message = `error: ${error}`

            console.error(message);
            rej(message)
            return;
        }
        res(stdout)
    });
})

const macDmgSource = './out/make/JustJuggle-ArcBridge-beta.dmg'
const macDmgDestionation = './out/make/JustJuggle-ArcBridge-beta.dmg'

executeCommand(`cp ${macDmgSource} ${macDmgDestionation}`)