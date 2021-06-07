console.log("SCRIPT INIT ");
import { app, BrowserWindow, screen, session } from "electron";
import * as path from "path";
import * as url from "url";
import * as WindowStateService from "electron-window-state";
import "./services/ipc";
let win: BrowserWindow | null = null;
let win2: BrowserWindow | null = null;

function createMainWindow(): BrowserWindow {
	console.log("Creating MAIN window!");
	const size = screen.getPrimaryDisplay().workAreaSize;

	const mainWindowState = WindowStateService({
		defaultHeight: size.height,
		defaultWidth: Math.floor(size.width / 3),
		file: "main.window-state.json",
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
			preload: path.join(__dirname, "preloaders/default.js"),
			contextIsolation: false,
		},
		// transparent: true,
		// alwaysOnTop: true,
		// frame: false,
		title: "ElectronDash Main App",
	});

	mainWindowState.manage(win);

	loadWindowContent(win, "", process.env.NODE_ENV !== "production");

	win.on("closed", () => {
		win = null;
	});

	return win;
}

function createExtraWindow(): BrowserWindow {
	console.log("Creating Extra window!");

	const extraWindowState = WindowStateService({
		defaultHeight: 600,
		defaultWidth: 800,
		file: "extra.window-state.json",
	});
	const size = screen.getPrimaryDisplay().workAreaSize;
	console.log(extraWindowState.x);
	// Create the browser window.
	win2 = new BrowserWindow({
		x: size.width - extraWindowState.width,
		y: 0,
		width: extraWindowState.width,
		height: extraWindowState.height,
		webPreferences: {
			nodeIntegration: true,
			allowRunningInsecureContent: true, // Only allow insecure content when developing
			preload: path.join(__dirname, "preloaders/windowEvents.js"),
			contextIsolation: false,
		},
		transparent: true,
		alwaysOnTop: true,
		frame: false,
		title: "ElectronDash Extra App",
	});

	extraWindowState.manage(win2);

	loadWindowContent(win2, "/live", process.env.NODE_ENV !== "production");

	win2.on("closed", () => {
		win = null;
	});

	return win2;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
app.on("ready", () =>
	setTimeout(() => {
		if (!win) {
			createMainWindow();
		}
		if (!win2) {
			createExtraWindow();
		}
	}, 400)
);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// app.on("activate", () => {
// 	// On OS X it's common to re-create a window in the app when the
// 	// dock icon is clicked and there are no other windows open.
// 	if (win === null) {
// 		createWindow();
// 	}
// });

function loadWindowContent(
	win: BrowserWindow,
	pathToLoad: string,
	dev = false
) {
	if (dev) {
		win.webContents.openDevTools();

		win.loadURL("http://localhost:4200" + pathToLoad);
		//Auto Focus on startup for Dev
		win.on("show", () => {
			win?.focus();
		});

		setTimeout(() => win?.show(), 200);
	} else {
		win.loadURL(
			url.format({
				pathname: path.join(__dirname, "dist/index.html"), //TODO: Add path here
				protocol: "file:",
				slashes: true,
			})
		);
	}
}
