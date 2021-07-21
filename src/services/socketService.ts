import { io, Socket } from "socket.io-client";
import { AuthTokenPayloadDTO } from "../types/random";
import { decodeToken, Injectable, Singleton } from "../helper";
import { config } from "./config";

@Injectable()
@Singleton()
export class SocketManagerService {
	private socket?: Socket;
	private parsedToken?: AuthTokenPayloadDTO;

	private toAuthenticate: { provider: string }[] = [];

	get connected(): boolean {
		if (this.parsedToken || this.socket?.connected) return false;

		return true;
	}

	constructor() {}

	/** Returns true for new connections, false if there is already a connection */
	async connect(token: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.parsedToken = decodeToken(token);
			if (!this.parsedToken) throw new Error("Token not defined");
			this.socket = io(config.socketURL, { auth: { token } });

			this.socket.on("connect", () => {
				resolve(true);
				this.toAuthenticate.forEach((x) => {
					this.socket?.emit("authenticateSending", {
						provider: x.provider,
						id: this.parsedToken?.sub,
					});
				});
			});
		});
	}

	async authenticateSending(
		providerName: string
	): Promise<{ accessToken: string }> {
		return new Promise((resolve, reject) => {
			let timeout = setTimeout(() => {
				reject("Response took too long");
			}, 2000);

			if (!this.socket || !this.parsedToken)
				return reject("Socket not connected yet!");

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

	async ingestMessage(notification: any) {
		this.socket?.emit("ingest", notification);
	}
}
