import {_keys, Cosmo_LogLevel, Cosmo_WebStorage, Cosmo_Module} from '@pixel-forge/cosmo-utils';

type Theme = { [k: string]: string };

export const cosmoKey_Themes_Default = 'default';

class CosmoModule_Theme_Class
	extends Cosmo_Module {

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

	/**
	 * Saves a theme to the modules cache so that in runtime switching themes needs just the theme key.
	 * @param key
	 * @param theme
	 */
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

	/**
	 * Saves a theme under the 'default' key.<br/>The properties of the default theme are added to any later generated theme.
	 * <br/>In case a theme that is applied in runtime shares properties that also appear in the default theme, the default theme will
	 * always be overwritten.
	 * @param theme
	 */
	public registerDefaultTheme = (theme: Theme) => {
		if (this.themes[cosmoKey_Themes_Default])
			this.logWarning(`Overwriting default theme`);

		try {
			this.validateTheme(cosmoKey_Themes_Default, theme);
			this.themes[cosmoKey_Themes_Default] = theme;
			return this;
		} catch (e) {
			throw e;
		}
	};

	/**
	 * Validates that all the properties in the theme start with "--" to adhere to css conventions
	 * @param key
	 * @param theme
	 */
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

	/**
	 * Given a theme key, applies a theme, so long as the theme was registered in the module beforehand.
	 * @param key
	 */
	public applyTheme = (key: string) => {
		const theme = this.themes[key];
		const defaultTheme = this.themes[cosmoKey_Themes_Default] ?? {};

		if (!theme) {
			this.logErrorBold(`No theme registered for key ${key}`);
			return;
		}

		this.logVerbose(`Setting theme ${key}`);
		const _theme = {...defaultTheme, ...theme};
		this.styleSheet.innerHTML = this.getThemeString(key, _theme);
		this.themeKey = key;
		this.webStorage.set(key);
	};

	/**
	 * Attempts to set the theme of the key that was last saved in the local storage.<br/>
	 * If there was no key in the storage, will attempt to set the theme of the given fallback key.
	 * @param fallbackKey
	 */
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

		const defaultTheme = this.themes[cosmoKey_Themes_Default] ?? {};
		const _theme = {...defaultTheme, ...storageTheme};
		this.logVerbose(`Setting theme ${keyFromStorage}`);
		this.styleSheet.innerHTML = this.getThemeString(keyFromStorage, _theme);
		this.themeKey = keyFromStorage;
		this.webStorage.set(keyFromStorage);
	};

	/**
	 * Generates a theme string to insert into the HTML tag.
	 * @param key
	 * @param theme
	 */
	private getThemeString = (key: string, theme: Theme): string => {
		let themeString: string = `/* CosmoTheme generated theme ${key} */\n`;
		themeString += ':root {\n';
		_keys(theme).forEach(key => {
			themeString += `${key}: ${theme[key]};\n`;
		});
		themeString += '}\n';
		return themeString;
	};

	/**
	 * Returns the key of the current set theme.
	 */
	public getThemeKey = () => {
		if (!this.themeKey)
			this.logWarning('Trying to get theme key but no theme was set.\nDid you forget to call applyTheme?');
		return this.themeKey;
	};
}

export const CosmoModule_Theme = new CosmoModule_Theme_Class();