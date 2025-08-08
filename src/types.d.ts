type SettingsEntry = {
	value: string | number | boolean;
	description: string;
};

export type Settings = {
	CS2_path: SettingsEntry;
	port: SettingsEntry;
	host: SettingsEntry;
} | null;
