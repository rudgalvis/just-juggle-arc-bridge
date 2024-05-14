#!/usr/bin/env node

const {exec} = require("child_process");

const run = async (command) => new Promise((res, rej) => {
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

const zipName = `JustJuggle-ArcBridge`

const distribution = './distribution'

/* Mac */
const macDistribution = `${distribution}/mac`
const dmgSourcePath = './out/make'
const dmgFilename = 'JustJuggle-ArcBridge-beta.dmg'

run(`cp ${dmgSourcePath}/${dmgFilename} ${macDistribution}/src/${dmgFilename}`).then(() => {
    run(`zip -r ${macDistribution}/${zipName}.zip ${macDistribution}`)
})


