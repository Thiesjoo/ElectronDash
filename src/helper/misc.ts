import { execSync } from 'child_process';
import { session } from 'electron';
import { AuthTokenPayloadDTO } from '../types/random';

function execShellCommand(cmd: string) {
	return execSync(cmd, { encoding: "utf-8" });
}

/** Focus a window with a specific title */
export function focusWindow(windowName: string) {
	//TODO: Make this crossplatform
	return execShellCommand(`wmctrl -a ${windowName}`);
}

/** Decode a JWT accesstoken as AuthTokenPayload */
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

export async function getTokenStringFromCookie() {
	const cookies = await session.defaultSession.cookies.get({
		name: "accesstoken",
	}); //TODO: Maybe domain

	if (!cookies) {
		throw new Error("No cookies found");
	}

	console.warn(cookies);
	if (cookies.length === 0) {
		throw new Error("YOU ARE NOT LOGGED IN");
	}

	if (cookies.length !== 1) {
		throw new Error("More cookies than specified");
	}
	return cookies[0].value;
}
