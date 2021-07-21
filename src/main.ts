console.log("SCRIPT INIT ");
import 'reflect-metadata';
import { app, BrowserWindow, screen } from 'electron';
import * as WindowStateService from 'electron-window-state';
import * as path from 'path';
import { container } from 'tsyringe';
import * as url from 'url';
import {
  config,
  DiscordRPCService,
  PromiseIPCService,
  SocketManagerService,
} from './services';

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
	const extraWindowState = WindowStateService({
		defaultHeight: 600,
		defaultWidth: 800,
		file: "extra.window-state.json",
	});
	const size = screen.getPrimaryDisplay().workAreaSize;
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
		show: false,
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
app.on("ready", () => {
	//Pre register all services
	container.resolve(PromiseIPCService);
	container.resolve(DiscordRPCService);
	container.resolve(SocketManagerService);
	setTimeout(() => {
		if (!win) {
			createMainWindow();
		}
		// if (!win2) {
		// 	createExtraWindow().showInactive();
		// }
	}, 400);
});

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

/**
 *
 * @param win Window to load on
 * @param pathToLoad Path of the URL to load
 * @param dev If true, loads from localhost:4200 with devtools open
 */
function loadWindowContent(
	win: BrowserWindow,
	pathToLoad: string,
	dev = false
) {
	if (dev) {
		win.webContents.openDevTools();

		win.loadURL(config.devURL + pathToLoad);
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
