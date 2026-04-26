'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { domainTemplates, type DomainTemplate } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Plus, Trash2 } from 'lucide-react';

const DEFAULT_MODULES = ['residents', 'units', 'announcements', 'payments', 'regulations'];
const ALL_MODULES = [...DEFAULT_MODULES, 'scores', 'guardians'];
const MODULE_LABELS: Record<string, string> = {
  residents: 'Anggota', units: 'Unit', announcements: 'Pengumuman',
  payments: 'Tagihan', regulations: 'Peraturan', scores: 'Nilai', guardians: 'Wali Murid',
};

type FormState = Omit<DomainTemplate, '_id'>;

const empty: FormState = {
  name: '', slug: '', memberLabel: '', assetLabel: '',
  documentLabel: '', ragRole: '', portalTitle: '',
  enabledModules: [...DEFAULT_MODULES],
};

export default function DomainTemplatesPage() {
  const [list, setList] = useState<DomainTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DomainTemplate | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setList(await domainTemplates.list()); } catch { toast.error('Gagal memuat template'); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(t: DomainTemplate) {
    setEditing(t);
    setForm({ name: t.name, slug: t.slug, memberLabel: t.memberLabel, assetLabel: t.assetLabel, documentLabel: t.documentLabel, ragRole: t.ragRole, portalTitle: t.portalTitle, enabledModules: t.enabledModules });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await domainTemplates.update(editing._id, form);
        toast.success('Template diperbarui');
      } else {
        await domainTemplates.create(form);
        toast.success('Template dibuat');
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus template "${name}"?`)) return;
    try { await domainTemplates.remove(id); toast.success('Template dihapus'); load(); } catch (err) { toast.error((err as Error).message); }
  }

  function toggleModule(slug: string) {
    setForm((f) => ({
      ...f,
      enabledModules: f.enabledModules.includes(slug)
        ? f.enabledModules.filter((m) => m !== slug)
        : [...f.enabledModules, slug],
    }));
  }

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Template Domain</h1>
          <p className="text-muted-foreground text-sm mt-1">Definisikan tipe organisasi dan modul yang tersedia</p>
        </div>
        <Button onClick={openCreate}><Plus className="size-4" />Tambah Template</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Label Anggota</TableHead>
              <TableHead>Modul Aktif</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>))}</TableRow>
              ))
            ) : list.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada template</TableCell></TableRow>
            ) : list.map((t) => (
              <TableRow key={t._id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{t.slug}</TableCell>
                <TableCell>{t.memberLabel}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {t.enabledModules.map((m) => (
                      <Badge key={m} variant="secondary" className="text-xs">{MODULE_LABELS[m] ?? m}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(t._id, t.name)}><Trash2 className="size-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Template' : 'Tambah Template Domain'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nama</Label>
                <Input placeholder="Sekolah" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input placeholder="sekolah" value={form.slug} onChange={(e) => set('slug', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Label Anggota</Label>
                <Input placeholder="Siswa" value={form.memberLabel} onChange={(e) => set('memberLabel', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Label Aset</Label>
                <Input placeholder="Kelas" value={form.assetLabel} onChange={(e) => set('assetLabel', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Label Dokumen</Label>
                <Input placeholder="Peraturan Sekolah" value={form.documentLabel} onChange={(e) => set('documentLabel', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Judul Portal</Label>
                <Input placeholder="Portal Siswa" value={form.portalTitle} onChange={(e) => set('portalTitle', e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Peran RAG (persona asisten)</Label>
              <Input placeholder="asisten informasi sekolah" value={form.ragRole} onChange={(e) => set('ragRole', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Modul Aktif</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_MODULES.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => toggleModule(slug)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                      ${form.enabledModules.includes(slug)
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-brand-400'
                      }`}
                  >
                    {MODULE_LABELS[slug]}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
