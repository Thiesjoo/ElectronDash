import { Client, Subscription } from "discord-rpc";
import io, { Socket } from "socket.io-client";
import { focusWindow } from "../helper/misc";
const clientId = "731554692970315891";
const scopes = ["rpc", "rpc.notifications.read", "rpc.activities.write"];
const client = new Client({ transport: "ipc" });

import { PromiseIpc } from "electron-promise-ipc/build/mainProcess";
const promiseIpc = new PromiseIpc({ maxTimeoutMs: 2000 });

promiseIpc.on("switch-channel", async (channel: unknown) => {
	console.log("Switch channel arg: ", channel, "client user: ", client.user); // prints "ping"
	if (!client.user) {
		throw new Error("User is not yet logged in");
	}
	await client.selectTextChannel(channel as string);
	focusWindow("discord");
	return "Channel switch success";
});

/** Connect to the remote server via socketio. Then authenticate for reiciving. If that worked, login to the local discord IPC and start listening for messages  */
export function initializeSocket(
	token: string
): Promise<{ socket: Socket; sub: Subscription }> {
	const decodedToken = Buffer.from(token.split(".")[1], "base64").toString(
		"utf-8"
	);

	if (!decodedToken || !token) {
		throw new Error("Cookie is not valid");
	}

	const userInfo = JSON.parse(decodedToken);
	console.log("Decoded token: ", userInfo);

	const socket = io("http://localhost:3000", {
		auth: {
			token,
		},
	});

	return new Promise<{ socket: Socket; sub: Subscription }>(
		(resolve, reject) => {
			let currSub: Subscription | null = null; // Store if we are already listening to discord messages. On reconnect reregister this sub

			socket.on("connect", function () {
				console.log("Connected to Socket");

				socket.emit(
					"authenticateSending",
					{
						provider: "discord",
						id: userInfo.sub, //UserID
					},
					async (provider: { accessToken: string }) => {
						console.log("WE GOT EM", provider);

						if (!client.user) {
							client
								.login({ clientId, scopes, accessToken: provider.accessToken })
								.catch((e) => {
									reject(e);
								});
						}

						client.on("ready", async () => {
							console.log("Logged in as", client.application.name);
							console.log("Authed for user", client.user.username);
							// console.log(await client.getChannels("511673407449071645"))
							if (currSub) {
								currSub.unsubscribe();
								console.log("Unsubbed from prev socket");
							}
							currSub = await client.subscribe(
								"NOTIFICATION_CREATE",
								(data) => {
									console.log("Discord notification: ", data);
									socket.emit("ingest", {
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
										color: data.message.author_color,
										providerType: "discord",
									});
								}
							);
							resolve({ socket, sub: currSub });
						});
					}
				);

				socket.emit("identity", { test: {} }, (response: any) =>
					console.log("Identity:", response)
				);
			});
			socket.on("events", function (data) {
				console.log("Socket: event", data);
			});
			socket.on("exception", function (data) {
				console.log("event", data);
				reject(data);
			});
			socket.on("disconnect", function () {
				console.log("Disconnected");
			});
		}
	);
}
