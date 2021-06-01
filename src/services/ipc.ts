import { BrowserWindow, ipcMain, session } from "electron";
import { initializeSocket } from "./discord-rpc";

import { PromiseIpc } from "electron-promise-ipc/build/mainProcess";
import { Awaited } from "src/helper/types";
const promiseIpc = new PromiseIpc({ maxTimeoutMs: 2000 });

ipcMain.handle("toggle-window", (event, arg) => {
	let window = BrowserWindow.fromId(event.sender.id);
	if (!window) {
		return false;
	}
	window.setIgnoreMouseEvents(arg);
	return true;
});

let runningSocket: Awaited<ReturnType<typeof initializeSocket>> | null = null;

promiseIpc.on("discord-login", async () => {
	const cookies = await session.defaultSession.cookies.get({
		name: "accesstoken",
	}); //TODO: Maybe domain

	if (!cookies) {
		throw new Error("No cookies found");
	}

	if (cookies.length !== 1) {
		throw new Error("More cookies than specified");
	}
	const token = cookies[0].value;

	destroy();

	console.log("Trying to init socket with token: ", token);
	initializeSocket(token).then((result) => {
		runningSocket = result;
		console.log("Discord login success");
	});
	//Early return to prevent timeout. True means: old socket got destroyed and user is logged in. There can still be errors due to discord RPC
	return true;
});

ipcMain.on("discord-logout", (event, arg) => {
	destroy();
	event.reply("discord-logout-reply", true);
});

async function destroy() {
	if (runningSocket) {
		await runningSocket.sub.unsubscribe();
		runningSocket.socket.disconnect();
		runningSocket = null;
	}
}
