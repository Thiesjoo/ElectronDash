import './default';

const electron = require("electron");

let currentState: boolean | null = null;
const setIgnoreMouseEvents = async (
	arg: boolean,
	options?: { forward?: boolean }
) => {
	if (currentState === arg) return;
	let result = await electron.ipcRenderer.invoke("toggle-window", arg, options);
	if (result) {
		currentState = arg;
	}
	return;
};

// setIgnoreMouseEvents(true);

let timeout: NodeJS.Timeout | null;

window.addEventListener("mousemove", (event) => {
	console.log((event.target as any)?.nodeName.toLowerCase());
	if (
		["body", "html", "app-chat-card"].includes(
			(event.target as any)?.nodeName.toLowerCase()
		)
	) {
		setIgnoreMouseEvents(true, { forward: true });
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(function () {
			setIgnoreMouseEvents(false);
		}, 150);
	} else {
		setIgnoreMouseEvents(false);
	}
});
