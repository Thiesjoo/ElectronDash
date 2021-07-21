import { APIMessage } from 'discord-api-types/v9';
import { Client } from 'discord-rpc';
import { container, delay, inject } from 'tsyringe';
import { focusWindow, getTokenStringFromCookie } from '../helper/misc';
import { Injectable } from '../helper/reexports';
import { PromiseIPCService } from './';
import { SocketManagerService } from './socketService';

// @Singleton()
@Injectable()
export class DiscordRPCService {
	private clientId = "731554692970315891";
	private scopes = ["rpc", "rpc.notifications.read", "rpc.activities.write"];
	private client = new Client({ transport: "ipc" });

	constructor(
		private socketService: SocketManagerService,
		@inject(delay(() => PromiseIPCService))
		private promiseIPC: PromiseIPCService
	) {
		this.promiseIPC.on("switch-channel", async (channel: unknown) => {
			console.log(
				"Switch channel arg: ",
				channel,
				"client user: ",
				this.client.user
			);
			if (!this.client.user) {
				throw new Error("User is not yet logged in");
			}
			await this.client.selectTextChannel(channel as string);
			focusWindow("discord");
			return "Channel switch success";
		});

		this.promiseIPC.on("discord-login", () => this.discordLogin.apply(this));

		this.promiseIPC.on("discord-logout", async () => {
			await this.destroy();
			return true;
		});
	}

	/** This function is triggered on discord-login event from IPC. It gets the cookie from current session, connects to socketio, authenticates for sending.
	 * Then connects to discord and starts sending messsages
	 */
	private async discordLogin() {
		console.log("Triggering discord login");
		const token = await getTokenStringFromCookie();
		const socketManager = container.resolve(SocketManagerService);
		console.log("got here");

		//All the async stuff happens in a seperate function
		(async () => {
			console.log("Trying to init socket with token: ", token);
			const result = await socketManager.connect(token);
			console.log("Socket connection result: ", result);
			console.log("Trying to authenticate sending");

			const authInfo = await socketManager.authenticateSending("discord");
			console.log("Got authinfo: ", authInfo, "Now logging into discord");
			await this.connectToDiscord(authInfo);
		})();

		//Early return to prevent timeout. True means: old socket got destroyed and user is logged in. There can still be errors due to discord RPC
		return true;
	}

	async destroy() {
		if (!this.socketService.connected) this.client.removeAllListeners(); // Remove all existing listeners
		// await this.client.destroy(); 		//TODO: This line hangs
	}

	async connectToDiscord(provider: { accessToken: string }) {
		await this.destroy();

		return new Promise<boolean>(async (resolve, reject) => {
			console.log("WE GOT EM", provider);

			this.client.on("ready", async () => {
				console.log("Logged in as", this.client.application.name);
				console.log("Authed for user", this.client.user.username);
				// console.log(await client.getChannels("511673407449071645"))

				await this.client.subscribe(
					"NOTIFICATION_CREATE",
					(data: {
						channel_id: string;
						message: APIMessage;
						icon_url: string;
						title: string;
						body: string;
					}) => {
						console.log("Discord notification: ", data);
						this.socketService.ingestMessage({
							image: data.icon_url,
							message: data.body,
							title: data.title,
							time: data.message.timestamp,
							author: {
								name: data.message.author.username,
								image: `https://cdn.discordapp.com/avatars/${data.message.author.id}/${data.message.author.avatar}`, //This is in discord format
							},
							extra: {
								mention_everyone: data.message.mention_everyone,
								mentions: data.message.mentions,
								channel: data.channel_id,
							},
							//@ts-ignore
							color: data.message.author_color,
							providerType: "discord",
						});
					}
				);
				resolve(true);
			});

			if (!this.client.user) {
				await this.client
					.login({
						clientId: this.clientId,
						scopes: this.scopes,
						accessToken: provider.accessToken,
					})
					.catch((e) => {
						reject(e);
					});
			}
		});
	}
}
