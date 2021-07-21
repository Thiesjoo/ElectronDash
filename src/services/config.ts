import { NotificationListeners } from '../types/notifications';

export const config: {
	notfication: NotificationListeners;
	socketURL: string;
	devURL: string;
} = {
	notfication: NotificationListeners.NativeElectron,
	devURL: "http://localhost:4200",
	socketURL: "http://localhost:3000",
};
