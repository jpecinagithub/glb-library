import type { Category } from '../types'

export type Lang = 'es' | 'en'

export interface Strings {
  title: string
  subtitle: string
  uploadTitle: string
  uploadDrop: string
  uploadOr: string
  uploadButton: string
  uploadHint: string
  searchPlaceholder: string
  allCategories: string
  sortLabel: string
  sortDateDesc: string
  sortDateAsc: string
  sortNameAsc: string
  sortNameDesc: string
  sortSizeDesc: string
  sortSizeAsc: string
  emptyTitle: string
  emptyText: string
  noResultsTitle: string
  noResultsText: string
  clearFilters: string
  modelsCount: (n: number) => string
  meshes: string
  triangles: string
  vertices: string
  materials: string
  textures: string
  animations: string
  sizeLabel: string
  dimensions: string
  addedOn: string
  categoryLabel: string
  tagsLabel: string
  descriptionLabel: string
  nameLabel: string
  noDescription: string
  noTags: string
  noThumbnail: string
  noThumbnailHint: string
  openViewer: string
  download: string
  edit: string
  delete: string
  save: string
  cancel: string
  close: string
  backToLibrary: string
  confirmDelete: string
  useAsThumbnail: string
  thumbnailSaved: string
  thumbnailFailed: string
  autoRotate: string
  wireframe: string
  grid: string
  background: string
  bgDark: string
  bgLight: string
  bgStudio: string
  play: string
  pause: string
  animationLabel: string
  noAnimations: string
  resetView: string
  processing: string
  parsing: (name: string) => string
  errorNotGlb: string
  errorTooBig: string
  errorParse: string
  errorGeneric: string
  savedOk: string
  privacyNote: string
  category: Record<Category, string>
  footer: string
}

export const STRINGS: Record<Lang, Strings> = {
  es: {
    title: 'Biblioteca GLB',
    subtitle: 'Tu librería personal de modelos 3D. Todo se guarda en tu navegador, nada se sube a ningún servidor.',
    uploadTitle: 'Añadir modelos GLB',
    uploadDrop: 'Arrastra archivos .glb aquí',
    uploadOr: 'o',
    uploadButton: 'Elegir archivos .glb',
    uploadHint: 'Solo .glb · máx. 200 MB por archivo · se procesan en tu navegador',
    searchPlaceholder: 'Buscar por nombre, descripción, categoría o etiqueta…',
    allCategories: 'Todas',
    sortLabel: 'Ordenar',
    sortDateDesc: 'Más recientes',
    sortDateAsc: 'Más antiguos',
    sortNameAsc: 'Nombre (A–Z)',
    sortNameDesc: 'Nombre (Z–A)',
    sortSizeDesc: 'Mayor tamaño',
    sortSizeAsc: 'Menor tamaño',
    emptyTitle: 'Tu biblioteca está vacía',
    emptyText: 'Sube tu primer archivo .glb para verlo aquí. Se guardará en este navegador (IndexedDB) y podrás buscarlo, filtrarlo y abrirlo en el visor 3D.',
    noResultsTitle: 'Sin resultados',
    noResultsText: 'Ningún modelo coincide con esa búsqueda o filtro. Prueba con otro término o limpia los filtros.',
    clearFilters: 'Limpiar filtros',
    modelsCount: (n: number) => (n === 1 ? '1 modelo' : `${n} modelos`),
    meshes: 'Mallas',
    triangles: 'Triángulos',
    vertices: 'Vértices',
    materials: 'Materiales',
    textures: 'Texturas',
    animations: 'Animaciones',
    sizeLabel: 'Tamaño',
    dimensions: 'Dimensiones',
    addedOn: 'Añadido',
    categoryLabel: 'Categoría',
    tagsLabel: 'Etiquetas',
    descriptionLabel: 'Descripción',
    nameLabel: 'Nombre',
    noDescription: 'Sin descripción',
    noTags: 'Sin etiquetas',
    noThumbnail: 'Sin miniatura',
    noThumbnailHint: 'Abre el detalle para regenerarla',
    openViewer: 'Abrir visor',
    download: 'Descargar GLB',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    backToLibrary: '← Biblioteca',
    confirmDelete: '¿Eliminar este modelo de tu biblioteca? Esta acción no se puede deshacer.',
    useAsThumbnail: 'Usar esta vista como miniatura',
    thumbnailSaved: 'Miniatura actualizada',
    thumbnailFailed: 'No se pudo generar la miniatura en este navegador',
    autoRotate: 'Rotación automática',
    wireframe: 'Alambre',
    grid: 'Rejilla',
    background: 'Fondo',
    bgDark: 'Oscuro',
    bgLight: 'Claro',
    bgStudio: 'Estudio',
    play: 'Reproducir',
    pause: 'Pausar',
    animationLabel: 'Animación',
    noAnimations: 'Sin animaciones',
    resetView: 'Restablecer vista',
    processing: 'Procesando…',
    parsing: (name: string) => `Analizando ${name}…`,
    errorNotGlb: 'El archivo no es un .glb válido',
    errorTooBig: 'El archivo supera los 200 MB',
    errorParse: 'No se pudo leer el archivo GLB (¿dañado o con compresión Draco/KTX2 no soportada?)',
    errorGeneric: 'No se pudo añadir el archivo',
    savedOk: 'Modelo guardado en tu biblioteca',
    privacyNote: 'Privado por diseño: los archivos nunca salen de tu navegador. Borrar los datos del sitio borra también la biblioteca.',
    category: {
      personaje: 'Personaje',
      vehiculo: 'Vehículo',
      edificio: 'Edificio',
      objeto: 'Objeto',
      naturaleza: 'Naturaleza',
      otro: 'Otro',
    } as Record<Category, string>,
    footer: 'por jpecina',
  },
  en: {
    title: 'GLB Library',
    subtitle: 'Your personal 3D model library. Everything is stored in your browser — nothing is uploaded to any server.',
    uploadTitle: 'Add GLB models',
    uploadDrop: 'Drop .glb files here',
    uploadOr: 'or',
    uploadButton: 'Choose .glb files',
    uploadHint: 'Only .glb · max 200 MB per file · processed in your browser',
    searchPlaceholder: 'Search by name, description, category or tag…',
    allCategories: 'All',
    sortLabel: 'Sort',
    sortDateDesc: 'Newest first',
    sortDateAsc: 'Oldest first',
    sortNameAsc: 'Name (A–Z)',
    sortNameDesc: 'Name (Z–A)',
    sortSizeDesc: 'Largest first',
    sortSizeAsc: 'Smallest first',
    emptyTitle: 'Your library is empty',
    emptyText: 'Upload your first .glb file to see it here. It will be saved in this browser (IndexedDB) so you can search, filter and open it in the 3D viewer.',
    noResultsTitle: 'No results',
    noResultsText: 'No model matches that search or filter. Try another term or clear the filters.',
    clearFilters: 'Clear filters',
    modelsCount: (n: number) => (n === 1 ? '1 model' : `${n} models`),
    meshes: 'Meshes',
    triangles: 'Triangles',
    vertices: 'Vertices',
    materials: 'Materials',
    textures: 'Textures',
    animations: 'Animations',
    sizeLabel: 'Size',
    dimensions: 'Dimensions',
    addedOn: 'Added',
    categoryLabel: 'Category',
    tagsLabel: 'Tags',
    descriptionLabel: 'Description',
    nameLabel: 'Name',
    noDescription: 'No description',
    noTags: 'No tags',
    noThumbnail: 'No thumbnail',
    noThumbnailHint: 'Open the detail view to regenerate it',
    openViewer: 'Open viewer',
    download: 'Download GLB',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    backToLibrary: '← Library',
    confirmDelete: 'Delete this model from your library? This cannot be undone.',
    useAsThumbnail: 'Use this view as thumbnail',
    thumbnailSaved: 'Thumbnail updated',
    thumbnailFailed: 'Could not generate a thumbnail in this browser',
    autoRotate: 'Auto-rotate',
    wireframe: 'Wireframe',
    grid: 'Grid',
    background: 'Background',
    bgDark: 'Dark',
    bgLight: 'Light',
    bgStudio: 'Studio',
    play: 'Play',
    pause: 'Pause',
    animationLabel: 'Animation',
    noAnimations: 'No animations',
    resetView: 'Reset view',
    processing: 'Processing…',
    parsing: (name: string) => `Analyzing ${name}…`,
    errorNotGlb: 'The file is not a valid .glb',
    errorTooBig: 'The file is over 200 MB',
    errorParse: 'Could not read the GLB file (corrupt, or Draco/KTX2 compression not supported?)',
    errorGeneric: 'Could not add the file',
    savedOk: 'Model saved to your library',
    privacyNote: 'Private by design: files never leave your browser. Clearing site data also clears the library.',
    category: {
      personaje: 'Character',
      vehiculo: 'Vehicle',
      edificio: 'Building',
      objeto: 'Object',
      naturaleza: 'Nature',
      otro: 'Other',
    } as Record<Category, string>,
    footer: 'by jpecina',
  },
}
