import { execSync } from "child_process";
import { AuthTokenPayloadDTO } from "./types";
function execShellCommand(cmd: string) {
	return execSync(cmd, { encoding: "utf-8" });
}

export function focusWindow(windowName: string) {
	return execShellCommand(`wmctrl -a ${windowName}`);
}

export function decodeToken(token: string): AuthTokenPayloadDTO {
	const decodedToken = Buffer.from(token.split(".")[1], "base64").toString(
		"utf-8"
	);

	if (!decodedToken || !token) {
		throw new Error("Cookie is not valid");
	}

	const userInfo = JSON.parse(decodedToken);
	return userInfo as AuthTokenPayloadDTO;
}
