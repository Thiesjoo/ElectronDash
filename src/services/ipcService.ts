import { BrowserWindow, IpcMain, ipcMain, IpcMainEvent } from 'electron';
import { Listener } from 'electron-promise-ipc/build/base';
import {
  PromiseIpc,
  PromiseIpcMain,
} from 'electron-promise-ipc/build/mainProcess';
import { injectable } from 'tsyringe';

@injectable()
export class PromiseIPCService {
	promiseIPC: PromiseIpcMain = new PromiseIpc({ maxTimeoutMs: 2000 });
	ipcMain: IpcMain = ipcMain;

	constructor() {
		// console.log("Registerd IPC handler");
		// this.ipcMain.on("toggle-window", this.toggleWindow);
	}

	private toggleWindow(event: IpcMainEvent, ignore: boolean, options: any) {
		let window = BrowserWindow.fromId(event.sender.id);
		if (!window) {
			return false;
		}
		window.setIgnoreMouseEvents(ignore, options);
		return true;
	}

	on(event: string, listener: Listener) {
		this.promiseIPC.on(event, listener);
	}
}
