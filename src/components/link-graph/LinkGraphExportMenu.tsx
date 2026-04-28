import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { toBlob } from 'html-to-image'
import { ChevronDown } from 'lucide-react'
import type { RefObject } from 'react'
import { useCallback, useState } from 'react'
import {
  buildLinkGraphJsonPayload,
  buildLinkGraphMarkdown,
  downloadBlob,
  downloadTextFile,
  linkGraphExportFileBase,
} from '@/lib/linkGraphExport'
import type { PageLinkRow, PageRow } from '@/types/database.types'

type FeedbackVariant = 'success' | 'error'

type Props = {
  projectId: string
  projectName: string
  pages: PageRow[]
  pageLinks: PageLinkRow[]
  pngContainerRef: RefObject<HTMLElement | null>
  disabled?: boolean
  onFeedback?: (message: string, variant: FeedbackVariant) => void
}

export function LinkGraphExportMenu({
  projectId,
  projectName,
  pages,
  pageLinks,
  pngContainerRef,
  disabled = false,
  onFeedback,
}: Props) {
  const [busy, setBusy] = useState(false)

  const base = useCallback(() => linkGraphExportFileBase(projectId), [projectId])

  const runPng = useCallback(async () => {
    const el = pngContainerRef.current
    if (!el || disabled) return
    setBusy(true)
    try {
      const blob = await toBlob(el, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 2),
        type: 'image/png',
      })
      if (!blob) throw new Error('PNG konnte nicht erzeugt werden.')
      downloadBlob(`${base()}.png`, blob)
      onFeedback?.('Grafik exportiert.', 'success')
    } catch {
      onFeedback?.(
        'Grafik-Export fehlgeschlagen. Bitte Seite neu laden und erneut versuchen.',
        'error'
      )
    } finally {
      setBusy(false)
    }
  }, [pngContainerRef, disabled, base, onFeedback])

  const runJson = useCallback(() => {
    const payload = buildLinkGraphJsonPayload({
      exportedAt: new Date().toISOString(),
      projectId,
      projectName,
      pages,
      pageLinks,
    })
    const text = JSON.stringify(payload, null, 2)
    downloadTextFile(`${base()}.json`, text, 'application/json;charset=utf-8')
    onFeedback?.('JSON exportiert.', 'success')
  }, [projectId, projectName, pages, pageLinks, base, onFeedback])

  const runMd = useCallback(() => {
    const md = buildLinkGraphMarkdown({ projectName, pages, pageLinks })
    downloadTextFile(`${base()}.md`, md, 'text/markdown;charset=utf-8')
    onFeedback?.('Markdown exportiert.', 'success')
  }, [projectName, pages, pageLinks, base, onFeedback])

  const itemClass = (focus: boolean) =>
    `w-full text-left px-3 py-2 text-sm ${focus ? 'bg-slate-100 text-slate-900' : 'text-slate-700'}`

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton
        type="button"
        disabled={disabled || busy}
        title="PNG zeigt die aktuelle Ansicht · JSON und Markdown enthalten alle Seiten und Links dieses Projekts."
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:hover:bg-white disabled:cursor-not-allowed"
        aria-haspopup="menu"
      >
        {busy ? 'Export …' : 'Export'}
        <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-50 mt-1 w-56 origin-top-right rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
        modal={false}
      >
        <MenuItem>
          {({ focus }) => (
            <button
              type="button"
              className={itemClass(focus)}
              onClick={() => void runPng()}
            >
              Grafik exportieren (PNG)
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button type="button" className={itemClass(focus)} onClick={runJson}>
              Daten exportieren (JSON)
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button type="button" className={itemClass(focus)} onClick={runMd}>
              Link-Tabelle exportieren (Markdown)
            </button>
          )}
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}
