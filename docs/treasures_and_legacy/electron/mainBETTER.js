process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
//const downloadDir = path.join(app.getPath('documents'),'Steven', 'clipped');
const downloadDir = path.join(os.homedir(), 'Documents', 'Steven', 'clipped');

console.log(downloadDir);
const STEVEN_DIR = path.join(os.homedir(), 'Documents', 'Steven')
function getAbsolutePath(relativePath) {
	// Normalize and resolve the path
    const resolvedPath = path.resolve(STEVEN_DIR, relativePath);
	// Check if resolved path is within STEVEN_DIR
    if (!resolvedPath.startsWith(STEVEN_DIR + path.sep) && resolvedPath !== STEVEN_DIR) {
        throw new Error(`Access denied: Path traversal detected - ${relativePath}`);
    }
    return resolvedPath;
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        maximized: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: getAbsolutePath('preload.js'),
            backgroundThrottling: false // Disables throttling
        },
        // Additional performance options
        // show: false,  // Show after ready to avoid white flash
        alwaysOnTop: true,
        minimizable: false,
        // maximizable: false,
        frame: true,
        // titleBarStyle: 'default',
        // backgroundColor: '#000000', // Black background during load - keep it white
        transparent: false,
        hasShadow: false,
        useContentSize: true,
        minWidth: 240,
        minHeight: 135,
        maxWidth: 3840,
        maxHeight: 2160
    });

    // Serve index.html from current directory
    // win.loadFile(path.join(process.cwd(), 'index.html'));
    win.loadURL("http://localhost/listener")

    Menu.setApplicationMenu(null)

    win.on('close', async(event) => {
        // Don't show dialog if app is quitting
        if (app.isQuitting)
            return
            event.preventDefault()
            const { response } = await dialog.showMessageBox(win, {
                type: 'question',
                buttons: ['Cancel', 'Exit'],
                defaultId: 0,
                title: 'Exit confirmation',
                message: 'Are you sure you want to exit?',
                detail: 'Any unsaved progress will be lost.'
            });
        if (response === 1) { // Exit clicked
            const { response: response2 } = await dialog.showMessageBox(win, {
                type: 'question',
                buttons: ['Cancel', 'Really Exit'],
                defaultId: 0,
                title: 'Exit confirmation',
                message: 'Really?',
                detail: 'Any unsaved progress will be lost.'
            })
                if (response2 === 1) {
                    app.isQuitting = true;
                    win.destroy();
                }
        }
    });

    win.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12' || input.key === 'F1') {
            event.preventDefault();
            win.webContents.toggleDevTools();
        }
    });

    /*win.on('minimize', (event) => {
    event.preventDefault()
    win.setSize(320, 180)
    })*/
    win.on('unmaximize', () => {
        win.setSize(240, 135);
    });
    /*let isCustomSize = false
    win.on('maximize', (event) => {
    event.preventDefault()
    if (!isCustomSize) {
    win.setSize(320, 180)
    isCustomSize = true
    } else {
    win.setSize(800, 600)
    isCustomSize = false
    }
    })*/

    /*let isCompact = false
    ipcMain.on('toggle-size', () => {
    if (!isCompact) {
    win.setSize(320, 180)
    isCompact = true
    } else {
    win.setSize(800, 600)
    isCompact = false
    }
    })*/

    win.webContents.openDevTools(); // Uncomment for DevTools

    win.webContents.session.on('will-download', (event, item) => {
        item.setSavePath(path.join(downloadDir, item.getFilename()));
    });
    win.webContents.setFrameRate(60); // Lock to 60fps
    win.webContents.setBackgroundThrottling(false);

    ipcMain.handle('readdir', async(_, relativePath) => {
        const absolutePath = getAbsolutePath(relativePath);
        return await fs.readdir(absolutePath);
    });
    ipcMain.handle('rename', async(_, oldRelativePath, newRelativePath) => {
        const oldAbsolutePath = getAbsolutePath(oldRelativePath);
        const newAbsolutePath = getAbsolutePath(newRelativePath);
        await fs.rename(oldAbsolutePath, newAbsolutePath);
    });
    ipcMain.handle('copy', async(_, srcRelativePath, destRelativePath) => {
        const srcAbsolutePath = getAbsolutePath(srcRelativePath);
        const destAbsolutePath = getAbsolutePath(destRelativePath);
        await fs.cp(srcAbsolutePath, destAbsolutePath, {
            recursive: true
        });
    });
    ipcMain.handle('delete', async(_, relativePath) => {
        const absolutePath = getAbsolutePath(relativePath);
        await fs.rm(absolutePath, {
            recursive: true,
            force: true
        });
    });
    ipcMain.handle('fetch', async(_, filePath) => {
        const absolutePath = getAbsolutePath(filePath);
        return await fs.readFile(absolutePath, 'utf-8');
    });
    ipcMain.handle('write', async(_, filePath, data) => {
        const absolutePath = getAbsolutePath(filePath);
        await fs.writeFile(absolutePath, data);
    });
    ipcMain.handle('writeBuffer', async(_, filePath, bufferData) => {
        const absolutePath = getAbsolutePath(filePath);
        await fs.writeFile(absolutePath, Buffer.from(bufferData));
    });
	ipcMain.handle('appendFile', async (_, relativePath, data) => {
		const absolutePath = getAbsolutePath(relativePath);
		await fs.appendFile(absolutePath, data);
	});
	ipcMain.handle('exists', async (_, relativePath) => {
		const absolutePath = getAbsolutePath(relativePath);
		await fs.access(absolutePath);
		return true;
	});

    ipcMain.handle('downloadDir', () => {
        return downloadDir
    });
    ipcMain.handle('STEVEN_DIR', () => {
        return STEVEN_DIR
    });
	

    return win
}





process.on('unhandledRejection', (reason, promise) => {
    console.error('=== UNHANDLED REJECTION ===');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    console.error('Stack trace:', new Error().stack);
});




app.whenReady().then(createWindow);
