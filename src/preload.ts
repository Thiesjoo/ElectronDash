require("electron-promise-ipc/preload");
const electron = require("electron");

console.log("PRELOAD SCRIPT IS BEING LOADED");
window.addEventListener("DOMContentLoaded", () => {
	console.log("Dom loaded");
	const replaceText = (selector: string, text: string) => {
		const element = document.getElementById(selector);
		if (element) {
			element.innerText = text;
		}
	};

	for (const type of ["chrome", "node", "electron"]) {
		replaceText(
			`${type}-version`,
			process.versions[type as keyof NodeJS.ProcessVersions] || ""
		);
	}
});

let currentState: boolean | null = null;
const setIgnoreMouseEvents = async (arg: boolean) => {
	if (currentState === arg) return;
	let result = await electron.ipcRenderer.invoke("toggle-window", arg);
	if (result) {
		currentState = arg;
	}
	return;
};

// setIgnoreMouseEvents(true);

let timeout: NodeJS.Timeout | null;

// window.addEventListener("mousemove", (event) => {
// 	// console.log(event.target?.nodeName.toLowerCase());
// 	if (
// 		["body", "html", "app-chat-card"].includes(
// 			event.target?.nodeName.toLowerCase()
// 		)
// 	) {
// 		setIgnoreMouseEvents(true, { forward: true });
// 		if (timeout) clearTimeout(timeout);
// 		timeout = setTimeout(function () {
// 			setIgnoreMouseEvents(false);
// 		}, 150);
// 	} else setIgnoreMouseEvents(false);
// });

window.require = require;
