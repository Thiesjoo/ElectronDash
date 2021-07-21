import { nativeImage, Notification } from 'electron';
import { config } from '../services/config';
import { NotificationListeners } from '../types/notifications';

export function createNotification(notification: any): Notification {
	switch (config.notfication) {
		case NotificationListeners.NativeElectron: {
			const icon = nativeImage.createFromDataURL(notification.image);
			return new Notification({
				title: notification.title,
				body: notification.message,
				icon,
			});
		}
		default: {
			console.error("NOT IMPLEMENTED YET");
			process.exit(1);
		}
	}
}
