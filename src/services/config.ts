import * as Store from "electron-store";
import { NotificationListeners } from "../types/notifications";

const config = new Store({});

export type ConfigType = {
	notification: NotificationListeners;
	socketURL: string;
	listenForNotifications: boolean;
	devURL: string;
};

export const defaultConfig: ConfigType = {
	notification: NotificationListeners.NativeElectron,
	listenForNotifications: true,
	devURL: "http://localhost:4200",
	socketURL: "http://localhost:3000",
};

export function getConfigKey<T extends keyof ConfigType>(
	key: T
): ConfigType[T] {
	return (config.get(key) as ConfigType[T]) ?? defaultConfig[key];
}

export function setConfigKey<T extends keyof ConfigType>(
	key: T,
	val: ConfigType[T]
): void {
	config.set(key, val);
}
