import {_keys, Cosmo_LogLevel, CosmoModule} from '@pixel-forge/cosmo-utils';

type Theme = { [k: string]: string };

export const cosmoKey_Themes_Default = 'default';

class CosmoModule_Theme_Class
	extends CosmoModule {

	readonly themes: { [k: string]: Theme } = {};
	readonly styleSheet: HTMLStyleElement;

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
		if (!theme) {
			this.logErrorBold(`No theme registered for key ${key}`);
			return;
		}

		this.logVerbose(`Setting theme ${key}`);
		this.styleSheet.innerHTML = this.getThemeString(key, theme);
	};

	private getThemeString = (key: string, theme: Theme): string => {
		let themeString: string = `/* CosmoTheme generated theme ${key} */`;
		_keys(theme).forEach(key=>{
			themeString += `${key}: ${theme[key]};`
		})
		return themeString;
	};
}

export const CosmoModule_Theme = new CosmoModule_Theme_Class();