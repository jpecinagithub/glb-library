import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import ModelViewer from './components/ModelViewer.tsx'
import type { ModelViewerHandle, ViewerBackground } from './components/ModelViewer.tsx'
import { analyzeGlb, looksLikeGlb } from './lib/glb.ts'
import { deleteModel, getBlob, listModels, saveModel, updateMeta } from './lib/db.ts'
import { STRINGS } from './lib/i18n.ts'
import type { Lang, Strings } from './lib/i18n.ts'
import { CATEGORIES, MAX_FILE_SIZE } from './types.ts'
import type { Category, ModelMeta, ModelStats, SortKey } from './types.ts'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(ts: number, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ts))
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

interface UploadJob {
  name: string
  state: 'processing' | 'done' | 'error'
  message?: string
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('glb-library-lang') as Lang) || 'es'
    } catch {
      return 'es'
    }
  })
  const t: Strings = STRINGS[lang]
  const [models, setModels] = useState<ModelMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | Category>('all')
  const [sort, setSort] = useState<SortKey>('date-desc')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [jobs, setJobs] = useState<UploadJob[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [notice, setNotice] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    try {
      setModels(await listModels())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    try {
      localStorage.setItem('glb-library-lang', lang)
    } catch {
      /* storage unavailable: language just won't persist */
    }
  }, [lang])

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      if (list.length === 0) return
      for (const file of list) {
        const base = file.name.replace(/\.glb$/i, '') || file.name
        setJobs((prev) => [...prev, { name: file.name, state: 'processing', message: t.parsing(file.name) }])
        const fail = (message: string) => {
          setJobs((prev) => prev.map((j) => (j.name === file.name && j.state === 'processing' ? { ...j, state: 'error', message } : j)))
        }
        try {
          if (!/\.glb$/i.test(file.name)) throw new Error(t.errorNotGlb)
          if (file.size > MAX_FILE_SIZE) throw new Error(t.errorTooBig)
          const buf = await file.arrayBuffer()
          if (!looksLikeGlb(buf)) throw new Error(t.errorNotGlb)
          const { stats, thumbnail } = await analyzeGlb(buf)
          const meta: ModelMeta = {
            id: uid(),
            name: base,
            description: '',
            category: 'otro',
            tags: [],
            size: file.size,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            stats,
            thumbnail,
            thumbnailStatus: thumbnail ? 'ok' : 'failed',
          }
          await saveModel(meta, buf)
          setJobs((prev) => prev.map((j) => (j.name === file.name && j.state === 'processing' ? { ...j, state: 'done', message: t.savedOk } : j)))
          await refresh()
        } catch (err) {
          const msg = err instanceof Error ? err.message : t.errorGeneric
          // Distinguish a real parse failure from our own validation messages.
          fail(msg === t.errorNotGlb || msg === t.errorTooBig ? msg : t.errorParse)
        }
      }
    },
    [refresh, t],
  )

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    void handleFiles(e.dataTransfer.files)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = models.filter((m) => {
      if (category !== 'all' && m.category !== category) return false
      if (!q) return true
      const hay = [m.name, m.description, t.category[m.category], ...m.tags].join(' ').toLowerCase()
      return hay.includes(q)
    })
    const sorted = [...list]
    switch (sort) {
      case 'date-desc': sorted.sort((a, b) => b.createdAt - a.createdAt); break
      case 'date-asc': sorted.sort((a, b) => a.createdAt - b.createdAt); break
      case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name-desc': sorted.sort((a, b) => b.name.localeCompare(a.name)); break
      case 'size-desc': sorted.sort((a, b) => b.size - a.size); break
      case 'size-asc': sorted.sort((a, b) => a.size - b.size); break
    }
    return sorted
  }, [models, query, category, sort, t])

  const counts = useMemo(() => {
    const c = new Map<Category, number>()
    for (const m of models) c.set(m.category, (c.get(m.category) ?? 0) + 1)
    return c
  }, [models])

  const selected = models.find((m) => m.id === selectedId) ?? null

  const clearFilters = () => {
    setQuery('')
    setCategory('all')
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <button
          type="button"
          className="lang-toggle"
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          aria-label="Cambiar idioma / Switch language"
        >
          {lang === 'es' ? 'EN' : 'ES'}
        </button>
      </header>

      <section
        className={`upload ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        aria-label={t.uploadTitle}
      >
        <div className="upload-icon" aria-hidden="true">⬆</div>
        <h2>{t.uploadTitle}</h2>
        <p>{t.uploadDrop}</p>
        <p className="muted">{t.uploadOr}</p>
        <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
          {t.uploadButton}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb"
          multiple
          hidden
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) void handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <p className="muted small">{t.uploadHint}</p>
        {jobs.length > 0 && (
          <ul className="jobs" aria-live="polite">
            {jobs.slice(-5).map((j) => (
              <li key={`${j.name}-${j.state}`} className={`job job-${j.state}`}>
                <strong>{j.name}</strong> — {j.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      {notice && <div className="notice" role="status">{notice}</div>}

      <section className="toolbar">
        <input
          type="search"
          className="search"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t.searchPlaceholder}
        />
        <label className="sort">
          {t.sortLabel}
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="date-desc">{t.sortDateDesc}</option>
            <option value="date-asc">{t.sortDateAsc}</option>
            <option value="name-asc">{t.sortNameAsc}</option>
            <option value="name-desc">{t.sortNameDesc}</option>
            <option value="size-desc">{t.sortSizeDesc}</option>
            <option value="size-asc">{t.sortSizeAsc}</option>
          </select>
        </label>
      </section>

      <div className="chips" role="group" aria-label={t.categoryLabel}>
        <button type="button" className={`chip ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>
          {t.allCategories} ({models.length})
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {t.category[c]} ({counts.get(c) ?? 0})
          </button>
        ))}
      </div>

      <p className="count">{t.modelsCount(filtered.length)}</p>

      {loading ? (
        <div className="empty"><span className="spinner" aria-hidden="true" /> {t.processing}</div>
      ) : models.length === 0 ? (
        <div className="empty">
          <div className="empty-icon" aria-hidden="true">▦</div>
          <h2>{t.emptyTitle}</h2>
          <p>{t.emptyText}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <h2>{t.noResultsTitle}</h2>
          <p>{t.noResultsText}</p>
          <button type="button" className="btn" onClick={clearFilters}>{t.clearFilters}</button>
        </div>
      ) : (
        <main className="grid">
          {filtered.map((m) => (
            <article key={m.id} className="card" onClick={() => setSelectedId(m.id)}>
              <div className="thumb">
                {m.thumbnail ? (
                  <img src={m.thumbnail} alt={m.name} loading="lazy" />
                ) : (
                  <div className="thumb-placeholder">
                    <span aria-hidden="true">▦</span>
                    <small>{t.noThumbnail}</small>
                  </div>
                )}
              </div>
              <div className="card-body">
                <h3>{m.name}</h3>
                <p className="muted small">
                  {formatBytes(m.size)} · {formatDate(m.createdAt, lang)} · {t.category[m.category]}
                </p>
                <p className="muted small">
                  {m.stats.meshes} {t.meshes.toLowerCase()} · {m.stats.triangles.toLocaleString()} {t.triangles.toLowerCase()}
                  {m.stats.animations.length > 0 && ` · ${m.stats.animations.length} ${t.animations.toLowerCase()}`}
                </p>
                {m.tags.length > 0 && (
                  <div className="tags">
                    {m.tags.map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </main>
      )}

      {selected && (
        <DetailView
          model={selected}
          t={t}
          lang={lang}
          onClose={() => setSelectedId(null)}
          onChanged={async (updated) => {
            await updateMeta(updated)
            await refresh()
          }}
          onDeleted={async () => {
            await deleteModel(selected.id)
            setSelectedId(null)
            await refresh()
          }}
          onNotice={setNotice}
        />
      )}

      <footer className="footer">
        <p>{t.privacyNote}</p>
        <p>{t.footer}</p>
      </footer>
    </div>
  )
}

function DetailView({
  model, t, lang, onClose, onChanged, onDeleted, onNotice,
}: {
  model: ModelMeta
  t: Strings
  lang: Lang
  onClose: () => void
  onChanged: (m: ModelMeta) => Promise<void>
  onDeleted: () => Promise<void>
  onNotice: (s: string) => void
}) {
  const [blob, setBlob] = useState<ArrayBuffer | null>(null)
  const [blobError, setBlobError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(model.name)
  const [description, setDescription] = useState(model.description)
  const [category, setCategory] = useState<Category>(model.category)
  const [tagsText, setTagsText] = useState(model.tags.join(', '))
  const [autoRotate, setAutoRotate] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [background, setBackground] = useState<ViewerBackground>('dark')
  const [playing, setPlaying] = useState(false)
  const [clipIndex, setClipIndex] = useState(0)
  const [clipNames, setClipNames] = useState<string[]>(model.stats.animations)
  const [viewerReady, setViewerReady] = useState(false)
  const viewerRef = useRef<ModelViewerHandle>(null)
  const thumbRegeneratedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    getBlob(model.id)
      .then((b) => { if (!cancelled) setBlob(b) })
      .catch(() => { if (!cancelled) setBlobError(true) })
    return () => { cancelled = true }
  }, [model.id])

  // If the model has no thumbnail (render failed at upload), regenerate it
  // automatically from the detail viewer once it is ready — never silently
  // leave a broken thumbnail.
  useEffect(() => {
    if (!viewerReady || model.thumbnail || thumbRegeneratedRef.current) return
    thumbRegeneratedRef.current = true
    const timer = window.setTimeout(() => {
      const shot = viewerRef.current?.captureThumbnail()
      if (shot) {
        void onChanged({ ...model, thumbnail: shot, thumbnailStatus: 'ok', updatedAt: Date.now() })
        onNotice(t.thumbnailSaved)
      } else {
        onNotice(t.thumbnailFailed)
      }
    }, 600)
    return () => window.clearTimeout(timer)
  }, [viewerReady, model, onChanged, onNotice, t])

  const download = () => {
    if (!blob) return
    const url = URL.createObjectURL(new Blob([blob], { type: 'model/gltf-binary' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${model.name}.glb`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const saveEdits = () => {
    const tags = tagsText.split(',').map((s) => s.trim()).filter(Boolean)
    void onChanged({ ...model, name: name.trim() || model.name, description, category, tags, updatedAt: Date.now() })
    setEditing(false)
  }

  const useAsThumbnail = () => {
    const shot = viewerRef.current?.captureThumbnail()
    if (shot) {
      void onChanged({ ...model, thumbnail: shot, thumbnailStatus: 'ok', updatedAt: Date.now() })
      onNotice(t.thumbnailSaved)
    } else {
      onNotice(t.thumbnailFailed)
    }
  }

  const stats: ModelStats = model.stats

  return (
    <div className="detail-overlay" role="dialog" aria-modal="true" aria-label={model.name}>
      <div className="detail">
        <div className="detail-head">
          <button type="button" className="btn" onClick={onClose}>{t.backToLibrary}</button>
          <h2>{model.name}</h2>
          <button type="button" className="btn" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        <div className="detail-body">
          <div className="detail-viewer">
            {blob ? (
              <ModelViewer
                ref={viewerRef}
                data={blob}
                autoRotate={autoRotate}
                wireframe={wireframe}
                showGrid={showGrid}
                background={background}
                playing={playing}
                clipIndex={clipIndex}
                onLoaded={(names) => { setClipNames(names); setViewerReady(true) }}
              />
            ) : (
              <div className="viewer-wrap">
                <div className="viewer-overlay">
                  {blobError ? t.errorParse : <><span className="spinner" aria-hidden="true" /> {t.processing}</>}
                </div>
              </div>
            )}
            <div className="viewer-controls">
              <label><input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} /> {t.autoRotate}</label>
              <label><input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} /> {t.wireframe}</label>
              <label><input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> {t.grid}</label>
              <label>
                {t.background}
                <select value={background} onChange={(e) => setBackground(e.target.value as ViewerBackground)}>
                  <option value="dark">{t.bgDark}</option>
                  <option value="light">{t.bgLight}</option>
                  <option value="studio">{t.bgStudio}</option>
                </select>
              </label>
              <button type="button" className="btn btn-small" onClick={() => viewerRef.current?.resetView()}>{t.resetView}</button>
              <button type="button" className="btn btn-small" onClick={useAsThumbnail}>{t.useAsThumbnail}</button>
            </div>
            {clipNames.length > 0 && (
              <div className="viewer-controls">
                <label>
                  {t.animationLabel}
                  <select value={clipIndex} onChange={(e) => setClipIndex(Number(e.target.value))}>
                    {clipNames.map((n, i) => (
                      <option key={`${n}-${i}`} value={i}>{n || `clip ${i + 1}`}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="btn btn-small" onClick={() => setPlaying(!playing)}>
                  {playing ? t.pause : t.play}
                </button>
              </div>
            )}
            <p className="muted small">Arrastra para girar · rueda para zoom · clic derecho para desplazar</p>
          </div>

          <aside className="detail-side">
            <div className="stats-grid">
              <Stat label={t.meshes} value={stats.meshes} />
              <Stat label={t.triangles} value={stats.triangles.toLocaleString()} />
              <Stat label={t.vertices} value={stats.vertices.toLocaleString()} />
              <Stat label={t.materials} value={stats.materials} />
              <Stat label={t.textures} value={stats.textures} />
              <Stat label={t.animations} value={stats.animations.length} />
            </div>
            <dl className="meta-list">
              <dt>{t.sizeLabel}</dt><dd>{formatBytes(model.size)}</dd>
              <dt>{t.dimensions}</dt><dd>{stats.size.join(' × ')}</dd>
              <dt>{t.addedOn}</dt><dd>{formatDate(model.createdAt, lang)}</dd>
              <dt>{t.categoryLabel}</dt><dd>{t.category[model.category]}</dd>
            </dl>

            {editing ? (
              <div className="edit-form">
                <label>{t.nameLabel}<input value={name} onChange={(e) => setName(e.target.value)} /></label>
                <label>{t.descriptionLabel}<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></label>
                <label>{t.categoryLabel}
                  <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{t.category[c]}</option>
                    ))}
                  </select>
                </label>
                <label>{t.tagsLabel}<input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="etiqueta1, etiqueta2" /></label>
                <div className="row">
                  <button type="button" className="btn btn-primary" onClick={saveEdits}>{t.save}</button>
                  <button type="button" className="btn" onClick={() => setEditing(false)}>{t.cancel}</button>
                </div>
              </div>
            ) : (
              <>
                <p>{model.description || t.noDescription}</p>
                <div className="tags">
                  {model.tags.length > 0 ? model.tags.map((tag) => <span key={tag} className="tag">{tag}</span>) : <span className="muted small">{t.noTags}</span>}
                </div>
                <div className="row">
                  <button type="button" className="btn btn-primary" onClick={download} disabled={!blob}>{t.download}</button>
                  <button type="button" className="btn" onClick={() => setEditing(true)}>{t.edit}</button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => { if (window.confirm(t.confirmDelete)) void onDeleted() }}
                  >
                    {t.delete}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
