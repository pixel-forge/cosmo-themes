import {_keys, Cosmo_LogLevel, Cosmo_WebStorage, CosmoModule} from '@pixel-forge/cosmo-utils';

type Theme = { [k: string]: string };

export const cosmoKey_Themes_Default = 'default';

class CosmoModule_Theme_Class
	extends CosmoModule {

	private readonly styleSheet: HTMLStyleElement;
	private readonly themes: { [k: string]: Theme } = {};
	private themeKey: string | undefined;
	private readonly webStorage = new Cosmo_WebStorage<string>('cosmo-theme');

	constructor() {
		super();
		this.setMinLevel(Cosmo_LogLevel.Warning);

		//Create style sheet
		this.styleSheet = document.createElement('style');
		this.styleSheet.id = 'cosmo-style-sheet';
		document.head.appendChild(this.styleSheet);
	}

	// ################## Class Methods - Theme Registration ##################

	public registerTheme = (key: string, theme: Theme): this => {
		//Warn if overwriting existing theme
		if (this.themes[key])
			this.logWarning(`Overwriting theme ${key}`);

		try {
			this.validateTheme(key, theme);
			this.themes[key] = theme;
			return this;
		} catch (e) {
			throw e;
		}
	};

	public registerDefaultTheme = (theme: Theme) => {
		if (this.themes[cosmoKey_Themes_Default])
			this.logWarning(`Overwriting default theme`);

		try {
			this.validateTheme(cosmoKey_Themes_Default, theme);
			this.themes[cosmoKey_Themes_Default] = theme;
			this.applyTheme(cosmoKey_Themes_Default);
			return this;
		} catch (e) {
			throw e;
		}
	};

	private validateTheme = (key: string, theme: Theme) => {
		const keys = _keys(theme) as string[];
		const invalidKeys: string[] = [];

		keys.forEach(key => {
			if (!key.startsWith('--'))
				invalidKeys.push(key);
		});

		if (invalidKeys.length) {
			this.logErrorBold(`Invalid keys in theme ${key}:`, invalidKeys);
			throw new Error(`Invalid keys in theme ${key}`);
		}
	};

	// ################## Class Methods - Theme Application ##################

	public applyTheme = (key: string) => {
		const theme = this.themes[key];
		const defaultTheme = this.themes[cosmoKey_Themes_Default] ?? {};

		if (!theme) {
			this.logErrorBold(`No theme registered for key ${key}`);
			return;
		}

		this.logVerbose(`Setting theme ${key}`);
		const _theme = {...defaultTheme,...theme};
		this.styleSheet.innerHTML = this.getThemeString(key, _theme);
		this.themeKey = key;
		this.webStorage.set(key);
	};

	public applyThemeFromStorage = (fallbackKey?: string) => {
		const keyFromStorage = this.webStorage.get();
		const storageTheme = this.themes[keyFromStorage];

		if (!keyFromStorage)
			this.logWarning('Could not find a theme key in storage');

		if (keyFromStorage && !storageTheme)
			this.logWarning(`Could not find a theme for key from storage ${keyFromStorage}`);

		if (!storageTheme) {
			if (!fallbackKey)
				return;

			this.logWarning(`Applying fallback theme ${fallbackKey}`);
			return this.applyTheme(fallbackKey);
		}

		this.logVerbose(`Setting theme ${keyFromStorage}`);
		this.styleSheet.innerHTML = this.getThemeString(keyFromStorage, storageTheme);
		this.themeKey = keyFromStorage;
		this.webStorage.set(keyFromStorage);
	};

	private getThemeString = (key: string, theme: Theme): string => {
		let themeString: string = `/* CosmoTheme generated theme ${key} */\n`;
		themeString += ':root {\n';
		_keys(theme).forEach(key => {
			themeString += `${key}: ${theme[key]};\n`;
		});
		themeString += '}\n';
		return themeString;
	};

	public getThemeKey = () => {
		if (!this.themeKey)
			this.logWarning('Trying to get theme key but no theme was set.\nDid you forget to call applyTheme?');
		return this.themeKey;
	};
}

export const CosmoModule_Theme = new CosmoModule_Theme_Class();