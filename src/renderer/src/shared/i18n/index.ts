import { ru } from './ru'

type TranslationTree = typeof ru

function getValueByPath(source: TranslationTree, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key]
    }

    return undefined
  }, source)

  return typeof value === 'string' ? value : undefined
}

export function t(key: string): string {
  return getValueByPath(ru, key) ?? key
}
