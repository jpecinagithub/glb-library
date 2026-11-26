import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { ModelStats } from '../types'

/** A valid GLB starts with the ASCII magic "glTF" (0x46546C67). */
export function looksLikeGlb(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 12) return false
  const view = new DataView(buf)
  return view.getUint32(0, true) === 0x46546c67
}

async function parseScene(buf: ArrayBuffer) {
  const loader = new GLTFLoader()
  // parseAsync clones nothing: it reads from the buffer we pass in.
  return loader.parseAsync(buf, '')
}

function disposeScene(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.isMesh) {
      mesh.geometry?.dispose()
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const m of mats) {
        const mat = m as THREE.MeshStandardMaterial
        for (const key of Object.keys(mat) as (keyof THREE.MeshStandardMaterial)[]) {
          const v = mat[key]
          if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose()
        }
        mat.dispose()
      }
    }
  })
}

export function computeStats(gltf: Awaited<ReturnType<typeof parseScene>>): ModelStats {
  let meshes = 0
  let triangles = 0
  let vertices = 0
  const materials = new Set<string>()
  const textures = new Set<string>()

  gltf.scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    meshes++
    const geo = mesh.geometry
    if (geo) {
      const pos = geo.getAttribute('position')
      if (pos) vertices += pos.count
      if (geo.index) triangles += geo.index.count / 3
      else if (pos) triangles += pos.count / 3
    }
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const m of mats) {
      if (!m) continue
      materials.add(m.uuid)
      const mat = m as THREE.MeshStandardMaterial
      for (const key of Object.keys(mat) as (keyof THREE.MeshStandardMaterial)[]) {
        const v = mat[key]
        if (v && (v as THREE.Texture).isTexture) textures.add((v as THREE.Texture).uuid)
      }
    }
  })

  const box = new THREE.Box3().setFromObject(gltf.scene)
  const size = new THREE.Vector3()
  box.getSize(size)
  const round = (n: number) => Math.round(n * 1000) / 1000

  return {
    meshes,
    triangles: Math.round(triangles),
    vertices,
    materials: materials.size,
    textures: textures.size,
    animations: gltf.animations.map((a) => a.name || 'clip'),
    size: [round(size.x), round(size.y), round(size.z)],
  }
}

/** Render the model once into an offscreen canvas and return a JPEG data URL. */
export function renderThumbnail(
  scene: THREE.Object3D,
  width = 480,
  height = 360,
): string {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  })
  try {
    renderer.setSize(width, height, false)
    renderer.setPixelRatio(1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping

    const renderScene = new THREE.Scene()
    renderScene.background = new THREE.Color(0xe8eef5)
    renderScene.add(scene)

    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a94a6, 1.4)
    renderScene.add(hemi)
    const dir = new THREE.DirectionalLight(0xffffff, 2.2)
    dir.position.set(4, 6, 5)
    renderScene.add(dir)
    const fill = new THREE.DirectionalLight(0xffffff, 0.7)
    fill.position.set(-5, 2, -4)
    renderScene.add(fill)

    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z, 0.001)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 1000)
    const dist = (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(20)))) * 1.5
    camera.position.set(center.x + dist * 0.7, center.y + dist * 0.5, center.z + dist * 0.9)
    camera.lookAt(center)

    renderer.render(renderScene, camera)
    return renderer.domElement.toDataURL('image/jpeg', 0.85)
  } finally {
    renderer.dispose()
  }
}

export interface AnalyzedGlb {
  stats: ModelStats
  /** JPEG data URL, or null if the offscreen render failed. */
  thumbnail: string | null
}

/**
 * Parse a GLB buffer, compute real stats and try to render a thumbnail.
 * Throws when the file cannot be parsed. The thumbnail is best-effort:
 * a parse success with a failed render still returns stats + null.
 */
export async function analyzeGlb(buf: ArrayBuffer): Promise<AnalyzedGlb> {
  const gltf = await parseScene(buf)
  try {
    const stats = computeStats(gltf)
    let thumbnail: string | null = null
    try {
      thumbnail = renderThumbnail(gltf.scene)
    } catch {
      thumbnail = null
    }
    return { stats, thumbnail }
  } finally {
    disposeScene(gltf.scene)
  }
}
