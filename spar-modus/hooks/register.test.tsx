import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'spar-modus',
  component: 'Pane',
  requestId: 'spar-modus',
  props: { title: 'Spar-Modus', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const


test('Pane zeigt Schalter und letztes Modell', async ($, on) => {
  on('command.register', () => ({ value: { command: 'spar' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.status', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /Spar-Modus: AN/ }))?.text).toBe('Spar-Modus: AN')
  expect(await ui.find({ type: 'Text', text: /noch keine Antwort/ })).toBeDefined()
  await ui.unmount()
})
