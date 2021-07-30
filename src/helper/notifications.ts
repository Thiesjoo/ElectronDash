import { nativeImage, Notification } from "electron";
import { getConfigKey } from "../services";
import { NotificationListeners } from "../types/notifications";

export function createNotification(notification: any): Notification | void {
	try {
		switch (getConfigKey("notification")) {
			case NotificationListeners.NativeElectron: {
				const icon = nativeImage.createFromDataURL(notification.image);
				console.log("GOt here right?", icon);
				return new Notification({
					title: notification.title,
					body: notification.message,
					icon,
				}).show();
			}
			default: {
				console.error("NOT IMPLEMENTED YET");
				process.exit(1);
			}
		}
	} catch (e) {
		console.error("Error in creating notification: ", e);
		return;
	}
}
