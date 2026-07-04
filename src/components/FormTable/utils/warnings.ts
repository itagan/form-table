const warnedKeys = new Set<string>()

export function warnFormTableOnce(key: string, message: string) {
  if (!import.meta.env.DEV || warnedKeys.has(key)) {
    return
  }

  warnedKeys.add(key)
  console.warn(message)
}
