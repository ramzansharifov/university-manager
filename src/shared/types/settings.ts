export type ThemeMode = 'light' | 'dark'

export type AccentColor = 'blue' | 'violet'

export type AppLanguage = 'ru' | 'en' | 'fr'

export interface AppSettings {
  themeMode: ThemeMode
  accentColor: AccentColor
  language: AppLanguage
}

export interface UpdateAppSettingsParams {
  themeMode?: ThemeMode
  accentColor?: AccentColor
  language?: AppLanguage
}

export interface UpdateAppSettingsResult {
  success: boolean
  settings: AppSettings
}
