import { nativeImage, Notification } from 'electron';
import { getConfigKey } from '../services';
import { NotificationListeners } from '../types/notifications';

export function createNotification(notification: any): Notification | void {
	try {
		switch (getConfigKey("notification")) {
			case NotificationListeners.NativeElectron: {
				const icon = notification.image.startsWith("data")
					? nativeImage.createFromDataURL(notification.image)
					: undefined;
				console.log(
					"Trying to create native electron notification: ",
					icon,
					notification
				);
				return new Notification({
					title: "electron+_ " + notification.title,
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
