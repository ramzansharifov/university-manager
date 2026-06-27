import type {
  AccentColor,
  AppLanguage,
  AppSettings,
  ThemeMode,
  UpdateAppSettingsParams,
  UpdateAppSettingsResult
} from '../../shared/types/settings'
import type { AuditService } from '../audit/auditService'
import type { SettingsRepository } from './settingsRepository'

const settingKeys = {
  themeMode: 'theme.mode',
  accentColor: 'theme.accent',
  language: 'i18n.language'
} as const

const defaultSettings: AppSettings = {
  themeMode: 'light',
  accentColor: 'blue',
  language: 'ru'
}

export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly auditService: AuditService
  ) {}

  getSettings(): AppSettings {
    const themeMode = this.normalizeThemeMode(
      this.settingsRepository.getValue(settingKeys.themeMode)
    )

    const accentColor = this.normalizeAccentColor(
      this.settingsRepository.getValue(settingKeys.accentColor)
    )

    const language = this.normalizeLanguage(this.settingsRepository.getValue(settingKeys.language))

    return {
      themeMode,
      accentColor,
      language
    }
  }

  updateSettings(params: UpdateAppSettingsParams): UpdateAppSettingsResult {
    const before = this.getSettings()

    if (params.themeMode) {
      this.settingsRepository.setValue(
        settingKeys.themeMode,
        this.normalizeThemeMode(params.themeMode)
      )
    }

    if (params.accentColor) {
      this.settingsRepository.setValue(
        settingKeys.accentColor,
        this.normalizeAccentColor(params.accentColor)
      )
    }

    if (params.language) {
      this.settingsRepository.setValue(
        settingKeys.language,
        this.normalizeLanguage(params.language)
      )
    }

    const after = this.getSettings()

    this.auditService.write({
      action: 'change_settings',
      module: 'settings',
      entityName: 'app_settings',
      entityId: null,
      before,
      after
    })

    return {
      success: true,
      settings: after
    }
  }

  private normalizeThemeMode(value: string | null): ThemeMode {
    if (value === 'light' || value === 'dark') {
      return value
    }

    return defaultSettings.themeMode
  }

  private normalizeAccentColor(value: string | null): AccentColor {
    if (value === 'blue' || value === 'violet') {
      return value
    }

    return defaultSettings.accentColor
  }

  private normalizeLanguage(value: string | null): AppLanguage {
    if (value === 'ru' || value === 'en' || value === 'fr') {
      return value
    }

    return defaultSettings.language
  }
}
