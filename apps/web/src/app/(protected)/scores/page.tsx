'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { scores, residents, type Score, type Resident } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus, Trash2 } from 'lucide-react';

type FormState = {
  residentId: string; subject: string; period: string;
  score: string; type: string; notes: string;
};
const empty: FormState = { residentId: '', subject: '', period: '', score: '', type: 'daily', notes: '' };

const typeLabels: Record<string, string> = { daily: 'Harian', mid: 'UTS', final: 'UAS' };

function residentName(s: Score): string {
  if (typeof s.residentId === 'object') return (s.residentId as any).name ?? '—';
  return s.residentId;
}

export default function ScoresPage() {
  const [list, setList] = useState<Score[]>([]);
  const [residentList, setResidentList] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Score | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([scores.list(), residents.list()]);
      setList(s); setResidentList(r);
    } catch { toast.error('Gagal memuat data'); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null); setForm(empty); setOpen(true);
  }

  function openEdit(s: Score) {
    setEditing(s);
    setForm({
      residentId: typeof s.residentId === 'object' ? (s.residentId as any)._id : s.residentId,
      subject: s.subject, period: s.period, score: String(s.score),
      type: s.type, notes: s.notes ?? '',
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const dto = { ...form, score: Number(form.score), type: form.type as Score['type'] };
      if (editing) { await scores.update(editing._id, dto); toast.success('Nilai diperbarui'); }
      else { await scores.create(dto as any); toast.success('Nilai ditambahkan'); }
      setOpen(false); load();
    } catch (err) { toast.error((err as Error).message); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus nilai ini?')) return;
    try { await scores.remove(id); toast.success('Nilai dihapus'); load(); } catch (err) { toast.error((err as Error).message); }
  }

  function set(key: keyof FormState, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nilai</h1>
          <p className="text-muted-foreground text-sm mt-1">Rekap nilai siswa per mata pelajaran dan periode</p>
        </div>
        <Button onClick={openCreate}><Plus className="size-4" />Tambah Nilai</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>Mata Pelajaran</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Nilai</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
              ))
            ) : list.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada nilai</TableCell></TableRow>
            ) : list.map((s) => (
              <TableRow key={s._id}>
                <TableCell className="font-medium">{residentName(s)}</TableCell>
                <TableCell>{s.subject}</TableCell>
                <TableCell className="text-muted-foreground">{s.period}</TableCell>
                <TableCell><Badge variant="outline">{typeLabels[s.type] ?? s.type}</Badge></TableCell>
                <TableCell className="text-right font-semibold">{s.score}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(s._id)}><Trash2 className="size-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Nilai' : 'Tambah Nilai'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Siswa</Label>
              <Select value={form.residentId} onValueChange={(v) => set('residentId', v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent>
                  {residentList.map((r) => <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Mata Pelajaran</Label>
                <Input placeholder="Matematika" value={form.subject} onChange={(e) => set('subject', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Periode</Label>
                <Input placeholder="2025-1" value={form.period} onChange={(e) => set('period', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Nilai (0–100)</Label>
                <Input type="number" min={0} max={100} value={form.score} onChange={(e) => set('score', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Tipe</Label>
                <Select value={form.type as string} onValueChange={(v) => set('type', v ?? 'daily')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="mid">UTS</SelectItem>
                    <SelectItem value="final">UAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Input placeholder="..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
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
