#!/usr/bin/env node

const {exec} = require("child_process");

const run = async (command, options) => new Promise((res, rej) => {
    exec(command, options, (error, stdout) => {
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
const macDistroSrc = `${distribution}/mac`
const dmgFilename = 'JustJuggle-ArcBridge-beta.dmg'

run(`cp ./out/make/${dmgFilename} ${macDistroSrc}/${dmgFilename}`).then(() => {
    run(`zip -r ${zipName}.zip .`, { cwd: `${macDistroSrc}` }).then(() => {
          run(`mv ${macDistroSrc}/${zipName}.zip ${macDistroSrc}/${zipName}.zip`).then(() => {
              console.log(`Mac distribution zipped`)
          })
    })
})


