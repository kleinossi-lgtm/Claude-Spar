import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Plan } from '../types'

const PANE = 'spar-modus'

// Wird eine Form geändert, den Tag hochzählen: alte Werte gelten dann als leer.
const enabled = atom({ plugin: 'spar-modus', key: 'enabled' } as const, true, { shape: 'enabled-1' })
const last = atom({ plugin: 'spar-modus', key: 'last' } as const, '', { shape: 'last-1' })
const plan = atom({ plugin: 'spar-modus', key: 'plan' } as const, null, { shape: 'plan-1' })
const force = atom({ plugin: 'spar-modus', key: 'force' } as const, false, { shape: 'force-1' })

type Tier = 'haiku' | 'sonnet' | 'opus'

const LONG = 300 // ab hier gilt ein Prompt als richtige Arbeit
const HUGE = 1500 // ab hier schwere Aufgabe
const FORCE_PREFIX = '++' // erzwingt Opus für diesen Prompt

const OPUS_WORDS =
  /refactor|architektur|migrier|debug|fehlersuche|analysier|review|sicherheit|komplett|gesamte|optimier|redesign|root cause|ursache/i
const WORK_WORDS =
  /\bbau|implementier|programmier|schreib\w* (mir )?(ein|eine|den|das|code|skript)|\bcode\b|skript|script|funktion|klasse|datei|repo|commit|branch|\btest|\bfix|behebe|erstelle|erzeuge|änder|lösche|installier|deploy|\bbuild|\bhtml\b|\bapi\b|\bbug\b|fehler|implement|refactor|write (a|the)/i
const CODE_MARKS = /```|[\w/-]+\.(py|js|ts|tsx|jsx|html|css|json|md|sh|yml|yaml)\b/i
const CONTINUE = /^\s*(ja|jo|ok|okay|go|weiter|mach|mach weiter|passt|los|yes|do it|continue|proceed)\b/i

function tierOf(text: string, previous: string): Tier {
  const t = text.trim()
  if (t === '') return 'sonnet'
  if (t.length >= HUGE || OPUS_WORDS.test(t)) return 'opus'
  // Kurze Zustimmung ("go", "ja"): bei der Arbeit bleiben, nicht auf Haiku fallen.
  if (CONTINUE.test(t) && t.length < LONG) {
    return previous.includes('opus') ? 'opus' : 'sonnet'
  }
  if (t.length >= LONG || WORK_WORDS.test(t) || CODE_MARKS.test(t) || t.split('\n').length > 5) {
    return 'sonnet'
  }
  return 'haiku'
}

function label(model: string): string {
  const m = model.toLowerCase()
  if (m.includes('haiku')) return 'Haiku'
  if (m.includes('sonnet')) return 'Sonnet'
  if (m.includes('opus')) return 'Opus'
  return model || '–'
}

function line(isOn: boolean, text: string): string {
  return `Spar-Modus ${isOn ? 'AN' : 'AUS'} · ${text}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'spar',
      description: 'Spar-Modus ein-/ausschalten (/spar an | aus | status)',
    })
    void $.ui.open({ id: PANE, title: 'Spar-Modus' })
    $.ui.status(line(await read($, enabled), 'noch keine Antwort'))

    return next(e)
  })

  on('command.run', { command: 'spar' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Spar-Modus' })
    return { text: 'Spar-Modus: Feld geöffnet.' }
  })

  // "++ frage" erzwingt Opus für diesen einen Prompt.
  on('prompt.submit', async ($, e, next) => {
    if (!e.command && e.text.startsWith(FORCE_PREFIX)) {
      await update($, force, () => true)
      return next({ ...e, text: e.text.slice(FORCE_PREFIX.length).trimStart() })
    }
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)

    const isOn = await read($, enabled)
    if (isOn) {
      const forced = await read($, force)
      const tier = forced ? 'opus' : tierOf(e.text, await read($, last))
      await update($, plan, () => ({ turnId: e.turnId, model: tier }) as Plan)
      $.ui.status(line(true, `antwortet: ${label(tier)} …`))
    }
    await update($, force, () => false)

    return next(e)
  })

  // Das ganze Turn bleibt beim gewählten Modell, auch in Tool-Ketten.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined || !(await read($, enabled))) {
      return yield* next(e)
    }
    const p = await read($, plan)
    if (p === null || p.turnId !== e.turnId) {
      return yield* next(e)
    }
    return yield* next({ ...e, model: p.model })
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)

    const p = await read($, plan)
    const used = e.usage?.model ?? (p?.turnId === e.turnId ? p.model : '')
    if (used !== '') {
      await update($, last, () => used)
      $.ui.status(line(await read($, enabled), `letzte Antwort: ${label(used)}`))
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const isOn = await read($, enabled)
    const model = await read($, last)

    return (
      <Box flexDirection="column">
        <Text bold>Spar-Modus: {isOn ? 'AN' : 'AUS'}</Text>
        <Button
          key="toggle"
          label={isOn ? 'Ausschalten' : 'Einschalten'}
          onPress={async () => {
            const next = !isOn
            await update($, enabled, () => next)
            $.ui.status(line(next, model ? `letzte Antwort: ${label(model)}` : 'noch keine Antwort'))
          }}
        />
        <Text> </Text>
        <Text>Zuletzt geantwortet:</Text>
        <Text bold>{model ? label(model) : 'noch keine Antwort'}</Text>
        <Text> </Text>
        <Text dimColor>Haiku: einfache Fragen</Text>
        <Text dimColor>Sonnet: normale Arbeit</Text>
        <Text dimColor>Opus: schwere Aufgaben</Text>
        <Text dimColor>++ vor dem Prompt erzwingt Opus.</Text>
      </Box>
    )
  })
}
