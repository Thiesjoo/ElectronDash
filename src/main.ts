console.log("SCRIPT INIT ");
import 'reflect-metadata';
import { app, BrowserWindow, Menu, screen, Tray } from 'electron';
import * as WindowStateService from 'electron-window-state';
import * as path from 'path';
import { container } from 'tsyringe';
import * as url from 'url';
import { getTokenStringFromCookie } from './helper';
import {
  DiscordRPCService,
  getConfigKey,
  PromiseIPCService,
  setConfigKey,
  SocketManagerService,
} from './services';
import { NotificationListeners } from './types/notifications';

let win: BrowserWindow | null = null;
let win2: BrowserWindow | null = null;

let sampleTrayWin: BrowserWindow | null = null;

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
	console.log("Create extra window");
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

console.log(
	"The app config is stored in: ",

	app.getPath("userData") + "/config.json"
);

/** Tray declared here to avoid garbage collection */
let tray = null;

app.whenReady().then(() => {
	//Pre register all services (This is for the IPCService. Otherwise DI errors)
	container.resolve(PromiseIPCService);
	container.resolve(DiscordRPCService);
	container.resolve(SocketManagerService);
	console.log("App starting");

	createMainWindow();

	//Create tray icon (Electron icon)
	tray = new Tray("/usr/share/icons/hicolor/22x22/apps/orca.png");

	const listenerChanged = (listener: { id: string }) => {
		setConfigKey("notification", listener.id as NotificationListeners);
	};

	const socketChanged = async (val: boolean) => {
		const sockets = container.resolve(SocketManagerService);

		if (val) {
			if (!sockets.connected) {
				const token = await getTokenStringFromCookie();
				await sockets.connect(token);
			}
			sockets.authenticateReceiving();
		} else {
			sockets.stopReceiving();
		}
	};

	socketChanged(getConfigKey("listenForNotifications"));

	const notfListen = getConfigKey("notification");

	const contextMenu = Menu.buildFromTemplate([
		{
			label: "Toggle listening",
			type: "checkbox",
			checked: getConfigKey("listenForNotifications"),
			click: async (a) => {
				console.log("Toggling listening", a.checked);
				await socketChanged(a.checked);
				setConfigKey("listenForNotifications", a.checked);
			},
		},
		{
			label: "Type of notification",
			submenu: [
				{
					id: NotificationListeners.NativeElectron,
					label: "Electron Native",
				},
				{
					id: NotificationListeners.Native,
					label: "Native",
				},
				{
					id: NotificationListeners.OwnImplementation,
					label: "Own implementation",
				},
			].map((x) => {
				return {
					...x,
					checked: notfListen === x.id,
					type: "radio",
					click: listenerChanged,
				};
			}),
		},
	]);
	tray.setContextMenu(contextMenu);
});

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

		win.loadURL(getConfigKey("devURL") + pathToLoad);
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
