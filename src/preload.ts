// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
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

const setIgnoreMouseEvents = window
	.require("electron")
	.remote.getCurrentWindow().setIgnoreMouseEvents;

// setIgnoreMouseEvents(true);

let timeout: NodeJS.Timeout | null;

window.addEventListener("mousemove", (event) => {
	console.log(event.target?.nodeName.toLowerCase());
	if (
		["body", "html", "app-chat-card"].includes(
			event.target?.nodeName.toLowerCase()
		)
	) {
		setIgnoreMouseEvents(true, { forward: true });
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(function () {
			setIgnoreMouseEvents(false);
		}, 150);
	} else setIgnoreMouseEvents(false);
});
