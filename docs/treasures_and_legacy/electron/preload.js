// preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded!'); // Debug

contextBridge.exposeInMainWorld('_fileAPI', {
    readdir: (relativePath) => ipcRenderer.invoke('readdir', relativePath),
    rename: (oldRelativePath, newRelativePath) => ipcRenderer.invoke('rename', oldRelativePath, newRelativePath),
    copy: (srcRelativePath, destRelativePath) => ipcRenderer.invoke('copy', srcRelativePath, destRelativePath),
    delete : (relativePath) => ipcRenderer.invoke('delete', relativePath),
    fetch: (filePath) => ipcRenderer.invoke('fetch', filePath),
	write: (filePath, data) => ipcRenderer.invoke('write', filePath, data),
	writeBuffer: (filePath, bufferData) => ipcRenderer.invoke('writeBuffer', filePath, bufferData),
	readFile: (filePath) => ipcRenderer.invoke('fetch', filePath),
	exists: (relativePath) => ipcRenderer.invoke('exists', relativePath),
	appendFile: (relativePath, data) => ipcRenderer.invoke('appendFile', relativePath, data),
    DOWNLOAD_DIR: () => ipcRenderer.invoke("downloadDir"),
    STEVEN_DIR: () => ipcRenderer.invoke("STEVEN_DIR")
});

// Optional: Log that it's exposed
console.log('preload: _fileAPI exposed successfully!');
// console.log("To connect to port 8080 instead type \x1b[32m fallback \x1b[0m in the console then press Enter.");


// Wait for the window to be ready
contextBridge.exposeInMainWorld('Steven', {
	manager(){
		console.log("Manager requested!")
		window.onbeforeunload = null;
		location.href = "http://localhost/conquest/electronManager.html";
	},
    spire() {
        console.log("Spire requested!");
		window.onbeforeunload = null;
        window.location.href = "http://localhost/spire/server/server.html";
    },
    conquest(){
        console.log("Conquest requested!");
		window.onbeforeunload = null;
        window.location.href = "http://localhost/conquest.html";
    }
});
console.log(
	"Available games:\n"+
	["spire","conquest"]
		.map(x=>"  "+"\x1b[32m"+"Steven."+x+"()"+"\x1b[0m").join("\n")+
	"\ntype in console then press Enter.")
