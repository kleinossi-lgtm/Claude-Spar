export type Plan = { turnId: string; model: string }

declare module 'claude-code' {
  interface PluginState {
    'spar-modus': {
      enabled: Shaped<boolean>
      last: Shaped<string>
      plan: Shaped<Plan | null>
      force: Shaped<boolean>
    }
  }
}
