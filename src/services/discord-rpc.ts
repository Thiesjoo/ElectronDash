import { Client, Subscription } from "discord-rpc";
import { ipcMain, session } from "electron";
import io from "socket.io-client";
const clientId = "731554692970315891";
const scopes = ["rpc", "rpc.notifications.read", "rpc.activities.write"];
const client = new Client({ transport: "ipc" });

ipcMain.on("switch-channel", (event, arg) => {
	console.log(arg); // prints "ping"
	client.selectTextChannel(arg);
	event.reply("switch-channel-reply", "Channel switch success");
});

export function initializeSocket(token: string) {
	console.log("starting", io);
	const socket = io("http://localhost:3000", {
		auth: {
			token,
		},
	});

	let currSub: Subscription | null = null;

	socket.on("connect", function () {
		console.log("Connected");

		socket.emit(
			"authenticateSending",
			{
				provider: "discord",
				id: "60917a42c0931b34948267fd", //UserID
			},
			async (provider: { accessToken: string }) => {
				console.log("WE GOT EM", provider);

				if (!client.user) {
					client
						.login({ clientId, scopes, accessToken: provider.accessToken })
						.catch((e) => {
							console.error("Discord error: ", e);
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
					currSub = await client.subscribe("NOTIFICATION_CREATE", (data) => {
						console.log(data);
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
								channel: data.message.channel_id,
							},
							color: data.message.author_color,
							providerType: "discord",
						});
					});
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
	});
	socket.on("disconnect", function () {
		console.log("Disconnected");
	});
}
