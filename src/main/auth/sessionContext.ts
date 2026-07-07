const authTokenByWebContentsId = new Map<number, string>()

export function rememberAuthTokenForWebContents(webContentsId: number, token: string): void {
  authTokenByWebContentsId.set(webContentsId, token)
}

export function forgetAuthTokenForWebContents(webContentsId: number): void {
  authTokenByWebContentsId.delete(webContentsId)
}

export function getAuthTokenForWebContents(webContentsId: number): string | null {
  return authTokenByWebContentsId.get(webContentsId) ?? null
}
