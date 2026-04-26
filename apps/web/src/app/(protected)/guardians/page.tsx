'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { guardians, residents, type Guardian, type Resident } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Plus, Trash2 } from 'lucide-react';

type FormState = {
  studentId: string; name: string; phone: string;
  email: string; relationship: string;
};
const empty: FormState = { studentId: '', name: '', phone: '', email: '', relationship: '' };

function studentName(g: Guardian): string {
  if (typeof g.studentId === 'object') return (g.studentId as any).name ?? '—';
  return g.studentId;
}

export default function GuardiansPage() {
  const [list, setList] = useState<Guardian[]>([]);
  const [residentList, setResidentList] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Guardian | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [g, r] = await Promise.all([guardians.list(), residents.list()]);
      setList(g); setResidentList(r);
    } catch { toast.error('Gagal memuat data'); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(empty); setOpen(true); }

  function openEdit(g: Guardian) {
    setEditing(g);
    setForm({
      studentId: typeof g.studentId === 'object' ? (g.studentId as any)._id : g.studentId,
      name: g.name, phone: g.phone, email: g.email ?? '', relationship: g.relationship,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const dto = { ...form, email: form.email || undefined };
      if (editing) { await guardians.update(editing._id, dto); toast.success('Wali diperbarui'); }
      else { await guardians.create(dto as any); toast.success('Wali ditambahkan'); }
      setOpen(false); load();
    } catch (err) { toast.error((err as Error).message); } finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus wali "${name}"?`)) return;
    try { await guardians.remove(id); toast.success('Wali dihapus'); load(); } catch (err) { toast.error((err as Error).message); }
  }

  function set(key: keyof FormState, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Wali Murid</h1>
          <p className="text-muted-foreground text-sm mt-1">Data wali/orang tua siswa</p>
        </div>
        <Button onClick={openCreate}><Plus className="size-4" />Tambah Wali</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Wali</TableHead>
              <TableHead>Hubungan</TableHead>
              <TableHead>Siswa</TableHead>
              <TableHead>Nomor HP</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
              ))
            ) : list.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada data wali murid</TableCell></TableRow>
            ) : list.map((g) => (
              <TableRow key={g._id}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell className="text-muted-foreground">{g.relationship}</TableCell>
                <TableCell>{studentName(g)}</TableCell>
                <TableCell>{g.phone}</TableCell>
                <TableCell className="text-muted-foreground">{g.email ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(g)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(g._id, g.name)}><Trash2 className="size-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Wali Murid' : 'Tambah Wali Murid'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Siswa</Label>
              <Select value={form.studentId} onValueChange={(v) => set('studentId', v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent>
                  {residentList.map((r) => <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nama Wali</Label>
                <Input placeholder="Budi Santoso" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Hubungan</Label>
                <Input placeholder="Ayah / Ibu / Wali" value={form.relationship} onChange={(e) => set('relationship', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Nomor HP</Label>
                <Input placeholder="08123456789" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email (opsional)</Label>
                <Input type="email" placeholder="budi@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
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
