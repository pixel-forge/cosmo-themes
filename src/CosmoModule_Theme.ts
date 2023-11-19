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

	public applyTheme = (_key: string, takeFromStorage: boolean = false) => {
		const keyFromStorage = this.webStorage.get();
		const _theme = this.themes[_key];
		const _storageTheme = this.themes[keyFromStorage];
		let theme: Theme;
		let key: string;

		if (!_theme) {
			this.logErrorBold(`No theme registered for key ${_key}`);
			return;
		}

		//Taking theme from storage
		if (takeFromStorage) {
			if (_storageTheme) {
				theme = _storageTheme;
				key = keyFromStorage;
			} else { //Theme from storage not registered
				this.logErrorBold(`No theme registered for key taken from storage ${keyFromStorage}`);
				theme = _theme;
				key = _key;
			}
		} else { //Not taking theme from storage
			theme = _theme;
			key = _key;
		}

		this.logVerbose(`Setting theme ${key}`);
		this.styleSheet.innerHTML = this.getThemeString(key, theme);
		this.themeKey = key;
		this.webStorage.set(key);
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