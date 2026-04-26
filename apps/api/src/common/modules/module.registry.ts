export interface ModuleDefinition {
  slug: string;
  name: string;
  availableFor: string[] | '*';
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  { slug: 'residents',     name: 'Anggota',     availableFor: '*' },
  { slug: 'units',         name: 'Unit',        availableFor: '*' },
  { slug: 'announcements', name: 'Pengumuman',  availableFor: '*' },
  { slug: 'payments',      name: 'Tagihan',     availableFor: '*' },
  { slug: 'regulations',   name: 'Peraturan',   availableFor: '*' },
  { slug: 'scores',        name: 'Nilai',       availableFor: ['sekolah'] },
  { slug: 'guardians',     name: 'Wali Murid',  availableFor: ['sekolah'] },
];

export const MODULE_SLUGS = MODULE_REGISTRY.map((m) => m.slug);
