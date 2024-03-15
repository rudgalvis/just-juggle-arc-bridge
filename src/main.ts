import { app, BrowserWindow, Menu, Tray } from 'electron';
import path from 'path';
import { startServer } from './server';
import AutoLaunch from 'electron-auto-launch';

startServer()

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const top: { win?: BrowserWindow, allowQuit: boolean } = {win: undefined, allowQuit: false}; // prevent gc to keep windows

// Create a new instance of AutoLaunch
const autoLaunch = new AutoLaunch({
    name: 'Just Juggle',
    path: app.getPath('exe'),
});

// Check if auto-launch is enabled and then enable it if it's not
autoLaunch.isEnabled().then((isEnabled) => {
    if (!isEnabled) autoLaunch.enable();
});

const createWindow = () => {
    // Create the browser window.
    top.win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    top.win.on("close", ev => {
        console.log(ev)
        top.win?.hide();

        if (!top.allowQuit) {
            ev.preventDefault(); // prevent quit process
        }
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        top.win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        top.win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Open the DevTools.
    // top.win.webContents.openDevTools();
};

app.dock?.hide()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
//    app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

let tray = null
app.whenReady().then(() => {
    const trayIconPath = path.join(__dirname, 'assets', 'macos-tray.png');
//  const trayIcon = nativeImage.createFromPath(trayIconPath);
    tray = new Tray(trayIconPath)
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Just Juggle - Arc Bridge', enabled: false
        },
        {type: 'separator'},
        {
            label: 'Quit', click: () => {
                top.allowQuit = true;
                setTimeout(() => {
                    app.quit();
                })
            }
        }
    ])
    tray.setContextMenu(contextMenu)
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
