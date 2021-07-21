// Load IPC promises, and replace all the versions with the correct ones.
require("electron-promise-ipc/preload");

console.log("PRELOAD SCRIPT IS BEING LOADED");
window.addEventListener("DOMContentLoaded", () => {
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

window.require = require;
