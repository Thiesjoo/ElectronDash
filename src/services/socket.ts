import { io, Socket } from "socket.io-client";
import { Injectable } from "src/helper/reexports";
import { AuthTokenPayloadDTO } from "src/helper/types";
import { decodeToken } from "../helper/misc";

@Injectable()
class SocketManagerService {
	socket: Socket;
	parsedToken: AuthTokenPayloadDTO;

	toAuthenticate: { provider: string }[] = [];

	constructor(url: string, private token: string) {
		this.parsedToken = decodeToken(token);
		if (!this.parsedToken) throw new Error("Token not defined");
		this.socket = io(url, { auth: { token } });

		this.socket.on("connect", () => {
			this.toAuthenticate.forEach((x) => {
				this.socket.emit("authenticateSending", {
					provider: x.provider,
					id: this.parsedToken.sub,
				});
			});
		});
	}

	async authenticateSending(providerName: string) {
		return new Promise((resolve, reject) => {
			let timeout = setTimeout(() => {
				reject("Response took too long");
			}, 2000);

			this.socket.emit(
				"authenticateSending",
				{
					provider: providerName,
					id: this.parsedToken.sub, //UserID
				},
				(provider: { accessToken: string }) => {
					clearTimeout(timeout);
					this.toAuthenticate.push({ provider: providerName });
					resolve(provider);
				}
			);
		});
	}
}
