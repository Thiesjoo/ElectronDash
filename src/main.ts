import { app, BrowserWindow, screen, session } from "electron";
import * as path from "path";
import * as url from "url";
import * as WindowStateService from "electron-window-state";
import "./services/ipc";

let win: BrowserWindow | null = null;
const args = process.argv.slice(1),
	serve = args.some((val) => val === "--serve");

function createWindow(): BrowserWindow {
	console.log("Creating window!");
	const size = screen.getPrimaryDisplay().workAreaSize;

	const mainWindowState = WindowStateService({
		defaultHeight: size.height,
		defaultWidth: Math.floor(size.width / 3),
	});

	// Create the browser window.
	win = new BrowserWindow({
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		webPreferences: {
			nodeIntegration: true,
			allowRunningInsecureContent: true, // Only allow insecure content when developing
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: false,
			// enableRemoteModule: true, //Remote module is enaabled for the preload script to toggle mouseclick passthrough
		},
		// transparent: true,
		// alwaysOnTop: true,
		// frame: false,
		title: "ElectronDash",
	});

	mainWindowState.manage(win);

	if (serve) {
		win.webContents.openDevTools();

		win.loadURL("http://localhost:4200");
		//Auto Focus on startup for Dev
		win.on("show", () => {
			win?.focus();
		});

		setTimeout(() => win?.show(), 200);
	} else {
		win.loadURL(
			url.format({
				pathname: path.join(__dirname, "dist/index.html"),
				protocol: "file:",
				slashes: true,
			})
		);
	}

	win.on("closed", () => {
		win = null;
	});

	return win;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
app.on("ready", () => setTimeout(createWindow, 400));

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow();
	}
});
