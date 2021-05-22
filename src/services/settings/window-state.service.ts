import { BrowserWindow } from "electron";
import * as appConfig from "electron-settings";
import { throttle } from "throttle-typescript";

export type WindowState = {
	x?: number;
	y?: number;
	width: number;
	height: number;
};

const defaultState = {
	width: 500,
	height: 1000,
};

export class WindowStateService {
	windowState: WindowState = { ...defaultState };
	window?: BrowserWindow;

	constructor(public windowName: string) {
		this.setBounds();
	}

	async setBounds(): Promise<WindowState> {
		if (appConfig.has(`windowState.${this.windowName}`)) {
			this.windowState = (await appConfig.get(
				`windowState.${this.windowName}`
			)) as WindowState;
		} else {
			this.windowState = { ...defaultState };
		}

		return this.windowState;
	}
	saveState(win: BrowserWindow) {
		// if (!windowState.isMaximized) {
		this.windowState = win?.getBounds() ||
			this.window?.getBounds() || { ...defaultState };
		console.log("weird2", this.window);
		// }
		// windowState.isMaximized = this.window.isMaximized();
		appConfig.set(`windowState.${this.windowName}`, this.windowState);
	}

	track(win: BrowserWindow) {
		this.window = win;
		console.log("Now tracking: ", win, this);
		win.on(
			"resize",
			throttle(() => this.saveState(win), 999)
		);
		//@ts-ignore
		win.on("will-move", throttle(this.saveState, 998));
		//@ts-ignore
		win.on("close", throttle(this.saveState, 1000));
	}
}
