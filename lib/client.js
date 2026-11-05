// dsh-litman, browser half. Plain JS, no build step: DSH's module loader
// hands us its shared React through `require`.
//
// Adds a "litman" row to the left sidebar. Its page lists the litman vaults
// (from the Host half, which asks `lit`) and opens one in a new session.

window.__ModuleLoader__.load({
  // Must equal the npm package name.
  id: 'dsh-litman',
  factory: (require) => {
    const React = require('react')
    const { useState, useEffect, useCallback, useSyncExternalStore } = React
    const h = React.createElement

    const NS = 'dsh-litman'
    const PANEL_ID = 'litman'
    const zh = {
      panel: 'litman',
      title: 'litman 文献库',
      subtitle: '选一个库，在新会话里打开。litman 的 skill 会自动加载。',
      open: '新会话',
      opening: '正在打开…',
      active: '当前库',
      papers: '{n} 篇',
      refresh: '刷新',
      loading: '正在读取库列表…',
      notFound: '没有找到 litman。在任意会话里说「帮我装 litman」就行。',
      noVaults: '还没有文献库。在会话里说「帮我建一个 litman 文献库」就行。',
      failed: '读取库列表失败：{msg}',
      openFailed: '打不开这个库：{msg}',
      about: 'litman 是本地文献管理工具',
    }
    const en = {
      panel: 'litman',
      title: 'litman vaults',
      subtitle: 'Pick a vault to open it in a new session. litman’s skills load automatically.',
      open: 'New session',
      opening: 'Opening…',
      active: 'Active',
      papers: '{n} papers',
      refresh: 'Refresh',
      loading: 'Reading your vaults…',
      notFound: 'litman is not installed. Ask in any session: “install litman for me”.',
      noVaults: 'No vault yet. Ask in a session: “create a litman vault for me”.',
      failed: 'Could not read your vaults: {msg}',
      openFailed: 'Could not open this vault: {msg}',
      about: 'litman is a local literature manager',
    }

    const S = {
      page: { height: '100%', overflow: 'auto', boxSizing: 'border-box', padding: '32px 40px', color: 'var(--dsw-alias-label-primary)' },
      inner: { maxWidth: 720, margin: '0 auto' },
      head: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 },
      title: { fontSize: 20, fontWeight: 600, margin: 0 },
      subtitle: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)', margin: '6px 0 0' },
      list: { display: 'flex', flexDirection: 'column', gap: 8 },
      row: { display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 10, border: '1px solid var(--dsw-alias-border-l1)', background: 'var(--dsw-alias-bg-layer-1)' },
      rowMain: { flex: 1, minWidth: 0 },
      name: { fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 },
      badge: { fontSize: 11, fontWeight: 500, padding: '1px 6px', borderRadius: 6, color: 'var(--dsw-alias-label-action-primary)', border: '1px solid var(--dsw-alias-border-l1)' },
      meta: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
      primary: { flexShrink: 0, fontSize: 13, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--dsw-alias-button-primary-fill)', color: 'var(--dsw-alias-label-primary-foreground)' },
      ghost: { flexShrink: 0, fontSize: 13, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--dsw-alias-label-secondary)', border: '1px solid var(--dsw-alias-border-l1)' },
      note: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)', padding: '16px 0' },
      error: { fontSize: 13, color: 'var(--dsw-alias-state-error-primary)', padding: '8px 0' },
      foot: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', marginTop: 24 },
      link: { color: 'inherit' },
    }

    function fill(text, vars) {
      return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
    }

    function LitmanIcon({ size }) {
      const s = size ?? 16
      return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
        h('path', { d: 'M4 19.5V5a2 2 0 0 1 2-2h4v18H6a2 2 0 0 1-2-1.5z' }),
        h('path', { d: 'M10 3h4v18h-4' }),
        h('path', { d: 'M15.5 4.2l3.9-1 2.6 16.6-3.9 1z' }),
      )
    }

    function createPage(ctx, t) {
      const subscribeLocale = (onChange) => ctx.locale.subscribe(onChange)
      const localeSnapshot = () => ctx.locale.getSnapshot()
      return function LitmanPage() {
        // Re-render when the user switches DSH's language. Chinese shows the
        // zh texts; every other language falls back to en.
        useSyncExternalStore(subscribeLocale, localeSnapshot)
        const [state, setState] = useState({ phase: 'loading' })
        const [opening, setOpening] = useState(null)
        const [openError, setOpenError] = useState(null)

        const load = useCallback(async () => {
          setState({ phase: 'loading' })
          try {
            const r = await fetch('/litman/api/vaults', { credentials: 'same-origin' })
            const body = await r.json()
            setState(body.ok ? { phase: 'ready', vaults: body.vaults } : { phase: 'error', code: body.code, message: body.message })
          } catch (error) {
            setState({ phase: 'error', code: 'internal', message: String(error?.message ?? error) })
          }
        }, [])
        useEffect(() => { void load() }, [load])

        const open = useCallback(async (vault) => {
          setOpening(vault.path)
          setOpenError(null)
          try {
            const { workspaceId } = await ctx.workspaces.create({ path: vault.path })
            // Without an id, startSession falls back to the current Workspace
            // and opens the wrong vault without any error.
            if (!workspaceId) throw new Error('DSH returned no workspace id')
            // Back to the conversation first: selecting a panel aborts any
            // navigation in flight, including the one startSession begins.
            ctx.layout.selectPanel(null)
            ctx.uiWorkspace.startSession(workspaceId)
          } catch (error) {
            setOpenError(fill(t('openFailed'), { msg: String(error?.message ?? error) }))
          } finally {
            setOpening(null)
          }
        }, [])

        let body
        if (state.phase === 'loading') {
          body = h('div', { style: S.note }, t('loading'))
        } else if (state.phase === 'error') {
          body = state.code === 'lit-not-found'
            ? h('div', { style: S.note }, t('notFound'))
            : h('div', { style: S.error }, fill(t('failed'), { msg: state.message || state.code }))
        } else if (state.vaults.length === 0) {
          body = h('div', { style: S.note }, t('noVaults'))
        } else {
          body = h('div', { style: S.list }, state.vaults.map(v => h('div', { key: v.path, style: S.row },
            h('div', { style: S.rowMain },
              h('div', { style: S.name }, v.name, v.active ? h('span', { style: S.badge }, t('active')) : null),
              h('div', { style: S.meta, title: v.path },
                typeof v.papers === 'number' ? fill(t('papers'), { n: v.papers }) + ' · ' : '', v.path),
            ),
            h('button', { type: 'button', style: S.primary, disabled: opening !== null, onClick: () => { void open(v) } },
              opening === v.path ? t('opening') : t('open')),
          )))
        }

        return h('div', { style: S.page, 'data-dsh-litman-page': '' },
          h('div', { style: S.inner },
            h('div', { style: S.head },
              h('div', null,
                h('h1', { style: S.title }, t('title')),
                h('p', { style: S.subtitle }, t('subtitle')),
              ),
              h('button', { type: 'button', style: S.ghost, onClick: () => { void load() } }, t('refresh')),
            ),
            openError ? h('div', { style: S.error }, openError) : null,
            body,
            h('div', { style: S.foot },
              t('about'), ' · ', h('a', { href: 'https://litman.dev', target: '_blank', rel: 'noreferrer', style: S.link }, 'litman.dev')),
          ),
        )
      }
    }

    return {
      inject: ['slots', 'locale', 'layout', 'uiWorkspace', 'workspaces'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-litman: dicts')
        const t = ctx.locale.bind(NS)
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 50,
          label: () => t('panel'),
          locale: NS,
        }, LitmanIcon))
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
        }, createPage(ctx, t)))
      },
    }
  },
})
