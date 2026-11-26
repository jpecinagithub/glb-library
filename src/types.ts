export type Category = 'personaje' | 'vehiculo' | 'edificio' | 'objeto' | 'naturaleza' | 'otro'

export const CATEGORIES: Category[] = [
  'personaje',
  'vehiculo',
  'edificio',
  'objeto',
  'naturaleza',
  'otro',
]

export interface ModelStats {
  meshes: number
  triangles: number
  vertices: number
  materials: number
  textures: number
  animations: string[]
  /** Bounding-box size in model units (x, y, z), rounded to 3 decimals. */
  size: [number, number, number]
}

export interface ModelMeta {
  id: string
  name: string
  description: string
  category: Category
  tags: string[]
  /** File size in bytes. */
  size: number
  createdAt: number
  updatedAt: number
  stats: ModelStats
  /** JPEG data URL (480x360) or null when no thumbnail could be rendered. */
  thumbnail: string | null
  thumbnailStatus: 'ok' | 'failed' | 'pending'
}

export type SortKey = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc'

export const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200 MB, like Meshy
