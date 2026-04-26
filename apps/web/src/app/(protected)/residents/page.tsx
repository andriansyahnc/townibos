'use client';

import { Ban, CheckCircle, MessageCircle, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getUser, residents, towns, type Resident, type Town } from '@/lib/api';

export default function ResidentsPage() {
  const currentUser = getUser();
  const isSuperadmin = currentUser?.role === 'superadmin';

  const [list, setList] = useState<Resident[]>([]);
  const [townList, setTownList] = useState<Town[]>([]);
  const [selectedTownId, setSelectedTownId] = useState<string>(currentUser?.townId ?? '');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(townId?: string) {
    setLoading(true);
    try {
      setList(await residents.list(townId));
    } catch {
      toast.error('Gagal memuat data penghuni');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isSuperadmin) {
      towns.list().then(setTownList).catch(() => {});
    }
    load(currentUser?.townId);
  }, []);

  function handleTownChange(townId: string | null) {
    const id = townId ?? '';
    setSelectedTownId(id);
    load(id || undefined);
  }

  async function handleToggleBlock(resident: Resident) {
    const action = resident.isActive ? 'blokir' : 'aktifkan';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} penghuni "${resident.name}"?`)) return;
    try {
      await residents.update(resident._id, { isActive: !resident.isActive });
      toast.success(`Penghuni berhasil di-${action}`);
      load(selectedTownId || undefined);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleDelete(resident: Resident) {
    if (!confirm(`Hapus penghuni "${resident.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await residents.remove(resident._id);
      toast.success('Penghuni dihapus');
      load(selectedTownId || undefined);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const filtered = list.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.phone.includes(q) || (r.email ?? '').toLowerCase().includes(q);
  });

  function unitLabel(r: Resident) {
    if (!r.unitId) return '—';
    const u = r.unitId;
    return [u.block, u.floor, u.number].filter(Boolean).join('-') || '—';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Penghuni</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola data penghuni perumahan</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {isSuperadmin && (
          <Select value={selectedTownId} onValueChange={handleTownChange}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Semua perumahan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua perumahan</SelectItem>
              {townList.map((t) => (
                <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, nomor HP, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {filtered.length} penghuni
        </span>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Telegram</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  {search ? 'Tidak ada hasil pencarian' : 'Belum ada penghuni'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((resident) => (
                <TableRow key={resident._id} className={!resident.isActive ? 'opacity-60' : ''}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{resident.name}</p>
                      {resident.email && (
                        <p className="text-xs text-muted-foreground">{resident.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{resident.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{unitLabel(resident)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {resident.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {resident.telegramChatId ? (
                      <MessageCircle className="size-4 text-blue-500" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={resident.isActive ? 'default' : 'destructive'}>
                      {resident.isActive ? 'Aktif' : 'Diblokir'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={resident.isActive ? 'Blokir' : 'Aktifkan'}
                        onClick={() => handleToggleBlock(resident)}
                      >
                        {resident.isActive
                          ? <Ban className="size-4 text-orange-500" />
                          : <CheckCircle className="size-4 text-green-500" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title="Hapus"
                        onClick={() => handleDelete(resident)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
