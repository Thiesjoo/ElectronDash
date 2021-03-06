import { io, Socket } from 'socket.io-client';
import { createNotification, decodeToken } from '../helper';
import { Injectable, Singleton } from '../helper/reexports';
import { AuthTokenPayloadDTO } from '../types/random';
import { getConfigKey } from './config';
import { PromiseIPCService } from './ipcService';

@Injectable()
@Singleton()
export class SocketManagerService {
	private socket?: Socket;
	private parsedToken?: AuthTokenPayloadDTO;

	private toAuthenticate: { provider: string }[] = [];

	private receivingAuthenticated = {
		/** Check if we should authenticate */
		requested: false,
		/** Are we currently authenticated */
		actual: false,
		/** Active listener */
		listener: null,
	};

	get connected(): boolean {
		if (this.parsedToken && this.socket?.connected) return true;

		return false;
	}

	constructor(private promiseIPC: PromiseIPCService) {
		this.promiseIPC.on("enable-notifs", this.authenticateReceiving);
	}

	async authenticateReceiving() {
		if (this.receivingAuthenticated.actual) return;
		this.receivingAuthenticated.requested = true;
		if (!this.parsedToken) {
			throw new Error("Not logged in yet");
		}
		console.log("Trying for auth receive");
		//auth receive
		this.socket?.emit(
			"authenticateReceiving",
			this.parsedToken.sub,
			(resp: any) => {
				this.receivingAuthenticated.actual = true;
				console.log("Response socket: ", resp);
				this.socket?.on("add", (notification) => {
					console.log("Received notification", notification);
					createNotification(notification);
				});
			}
		);
	}

	async destroy() {
		this.stopReceiving();
		this.socket?.disconnect();
		this.socket = undefined;
		this.parsedToken = undefined;
		this.toAuthenticate = [];
		this.receivingAuthenticated.requested = false;
		this.receivingAuthenticated.requested = false;
	}

	async stopReceiving() {
		this.socket?.off("add");
	}

	/** Returns true for new connections, false if there is already a connection */
	async connect(token: string): Promise<boolean> {
		if (this.parsedToken) {
			console.error("Request pending");
			return false;
		}
		return new Promise<boolean>((resolve, reject) => {
			this.parsedToken = decodeToken(token);
			if (!this.parsedToken) throw new Error("Token not defined");
			this.socket = io(getConfigKey("socketURL"), { auth: { token } });

			this.socket.on("connect", () => {
				console.log("socket connected");
				resolve(true);
				//TODO: Maybe reconnect on api (Get all the missed notifications)
				if (this.receivingAuthenticated.requested) this.authenticateReceiving();
				this.toAuthenticate.forEach((x) => {
					this.socket?.emit("authenticateSending", {
						provider: x.provider,
						id: this.parsedToken?.sub,
					});
				});
			});
			//TODO: Add socket typing right here
			this.socket.on("exception", (err) => {
				console.error("Socket errored: ", err);
				if (err?.error?.status === 401) {
					this.destroy();
				}
			});
			this.socket.on("disconnect", () => {
				this.receivingAuthenticated.actual = false;
			});
		});
	}

	async authenticateSending(
		providerName: string
	): Promise<{ accessToken: string }> {
		return new Promise((resolve, reject) => {
			let timeout = setTimeout(() => {
				reject("Response of authSending socket took too long");
			}, 5000);

			if (!this.socket || !this.parsedToken)
				return reject("Socket not connected yet!");

			//TODO: ACK timeout
			this.socket.emit(
				"authenticateSending",
				{
					provider: providerName,
					id: this.parsedToken.sub, //UserID
				},
				(provider: { accessToken: string }, err: any) => {
					if (err || !provider.accessToken) {
						reject(err);
						return clearTimeout(timeout);
					}
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
