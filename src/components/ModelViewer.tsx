import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export type ViewerBackground = 'dark' | 'light' | 'studio'

export interface ModelViewerHandle {
  /** Render the current view and return a JPEG data URL, or null on failure. */
  captureThumbnail: () => string | null
  resetView: () => void
}

interface Props {
  data: ArrayBuffer
  autoRotate: boolean
  wireframe: boolean
  showGrid: boolean
  background: ViewerBackground
  playing: boolean
  clipIndex: number
  onLoaded?: (clipNames: string[]) => void
  onError?: (message: string) => void
}

const BG_COLORS: Record<ViewerBackground, number> = {
  dark: 0x111827,
  light: 0xe8eef5,
  studio: 0x2b3442,
}

interface ViewerRefs {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  mixer: THREE.AnimationMixer | null
  clips: THREE.AnimationClip[]
  model: THREE.Object3D | null
  grid: THREE.GridHelper
  frame: () => void
}

const ModelViewer = forwardRef<ModelViewerHandle, Props>(function ModelViewer(
  { data, autoRotate, wireframe, showGrid, background, playing, clipIndex, onLoaded, onError },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<ViewerRefs | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  // Latest props for the render loop / imperative handle, without re-creating the scene.
  const propsRef = useRef({ autoRotate, wireframe, showGrid, background, playing, clipIndex })
  propsRef.current = { autoRotate, wireframe, showGrid, background, playing, clipIndex }
  const onLoadedRef = useRef(onLoaded)
  onLoadedRef.current = onLoaded
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    let raf = 0

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(BG_COLORS[propsRef.current.background])

    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000)
    camera.position.set(3, 2, 4)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08

    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a94a6, 1.2)
    scene.add(hemi)
    const dir = new THREE.DirectionalLight(0xffffff, 2.4)
    dir.position.set(4, 6, 5)
    scene.add(dir)
    const fill = new THREE.DirectionalLight(0xffffff, 0.6)
    fill.position.set(-5, 2, -4)
    scene.add(fill)

    const grid = new THREE.GridHelper(10, 20, 0x888888, 0xcccccc)
    grid.visible = propsRef.current.showGrid
    scene.add(grid)

    const resize = () => {
      const w = container.clientWidth || 800
      const h = container.clientHeight || 500
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    const frame = () => {
      const v = viewerRef.current
      if (!v || !v.model) return
      const box = new THREE.Box3().setFromObject(v.model)
      if (box.isEmpty()) return
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z, 0.001)
      const dist = (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(22.5)))) * 1.4
      v.camera.position.set(center.x + dist * 0.6, center.y + dist * 0.45, center.z + dist * 0.85)
      v.controls.target.copy(center)
      v.controls.update()
    }

    viewerRef.current = {
      renderer,
      scene,
      camera,
      controls,
      mixer: null,
      clips: [],
      model: null,
      grid,
      frame,
    }

    const clock = new THREE.Clock()
    let currentAction: THREE.AnimationAction | null = null
    let lastClipIndex = -1

    const animate = () => {
      if (cancelled) return
      raf = requestAnimationFrame(animate)
      const v = viewerRef.current
      if (!v) return
      const p = propsRef.current
      const delta = clock.getDelta()
      if (v.mixer && v.clips.length > 0) {
        const idx = Math.min(p.clipIndex, v.clips.length - 1)
        if (idx !== lastClipIndex) {
          lastClipIndex = idx
          currentAction?.stop()
          currentAction = v.mixer.clipAction(v.clips[idx])
          currentAction.reset()
          if (p.playing) currentAction.play()
        }
        if (p.playing && currentAction && !currentAction.isRunning()) currentAction.play()
        if (!p.playing && currentAction?.isRunning()) currentAction.stop()
        v.mixer.update(p.playing ? delta : 0)
      }
      v.controls.autoRotate = p.autoRotate
      v.controls.update()
      v.renderer.render(v.scene, v.camera)
    }

    const applyWireframe = (on: boolean) => {
      viewerRef.current?.model?.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.isMesh) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          for (const m of mats) (m as THREE.MeshStandardMaterial).wireframe = on
        }
      })
    }

    const loader = new GLTFLoader()
    loader
      .parseAsync(data, '')
      .then((gltf) => {
        if (cancelled) return
        const v = viewerRef.current
        if (!v) return
        v.model = gltf.scene
        v.clips = gltf.animations
        v.mixer = gltf.animations.length > 0 ? new THREE.AnimationMixer(gltf.scene) : null
        scene.add(gltf.scene)
        applyWireframe(propsRef.current.wireframe)
        frame()
        setStatus('ready')
        onLoadedRef.current?.(gltf.animations.map((a) => a.name || 'clip'))
        animate()
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Error al cargar el modelo'
        setErrorMsg(msg)
        setStatus('error')
        onErrorRef.current?.(msg)
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      currentAction?.stop()
      viewerRef.current?.mixer?.stopAllAction()
      viewerRef.current?.model?.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.isMesh) {
          mesh.geometry?.dispose()
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          for (const m of mats) m.dispose()
        }
      })
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
      viewerRef.current = null
    }
    // Re-create the viewer only when the model data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Apply toggle props without reloading the scene.
  useEffect(() => {
    const v = viewerRef.current
    if (!v) return
    v.scene.background = new THREE.Color(BG_COLORS[background])
    v.grid.visible = showGrid
    v.model?.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        for (const m of mats) (m as THREE.MeshStandardMaterial).wireframe = wireframe
      }
    })
  }, [background, showGrid, wireframe])

  useImperativeHandle(ref, () => ({
    captureThumbnail() {
      const v = viewerRef.current
      if (!v || status !== 'ready') return null
      try {
        v.renderer.render(v.scene, v.camera)
        return v.renderer.domElement.toDataURL('image/jpeg', 0.85)
      } catch {
        return null
      }
    },
    resetView() {
      viewerRef.current?.frame()
    },
  }))

  return (
    <div className="viewer-wrap">
      <div ref={containerRef} className="viewer-canvas" aria-label="Visor 3D" />
      {status === 'loading' && (
        <div className="viewer-overlay">
          <span className="spinner" aria-hidden="true" /> Cargando modelo 3D…
        </div>
      )}
      {status === 'error' && (
        <div className="viewer-overlay viewer-error" role="alert">
          No se pudo cargar el modelo: {errorMsg}
        </div>
      )}
    </div>
  )
})

export default ModelViewer
