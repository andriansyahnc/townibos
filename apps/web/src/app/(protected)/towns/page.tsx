'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { towns, type Town } from '@/lib/api';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi').regex(/^[a-z0-9-]+$/, 'Hanya huruf kecil, angka, dan tanda hubung'),
  address: z.string().optional(),
  isActive: z.boolean(),
  notionDatabaseId: z.string().optional(),
  notionApiKey: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TownsPage() {
  const [list, setList] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Town | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  async function load() {
    setLoading(true);
    try {
      setList(await towns.list());
    } catch {
      toast.error('Gagal memuat data perumahan');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    form.reset({ name: '', slug: '', address: '', isActive: true, notionDatabaseId: '', notionApiKey: '' });
    setOpen(true);
  }

  function openEdit(town: Town) {
    setEditing(town);
    form.reset({
      name: town.name,
      slug: town.slug,
      address: town.address ?? '',
      isActive: town.isActive,
      notionDatabaseId: town.notionDatabaseId ?? '',
      notionApiKey: '',
    });
    setOpen(true);
  }

  async function onSubmit(values: FormValues) {
    try {
      const dto = {
        ...values,
        notionApiKey: values.notionApiKey || undefined,
        notionDatabaseId: values.notionDatabaseId || undefined,
      };
      if (editing) {
        await towns.update(editing._id, dto);
        toast.success('Perumahan diperbarui');
      } else {
        await towns.create(dto);
        toast.success('Perumahan ditambahkan');
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus perumahan "${name}"?`)) return;
    try {
      await towns.remove(id);
      toast.success('Perumahan dihapus');
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleSync(id: string) {
    setSyncing(id);
    try {
      const result = await towns.syncNotion(id);
      toast.success(`Sync selesai: ${result.synced} halaman disinkronkan`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Perumahan</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola data perumahan</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Tambah Perumahan
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notion</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Belum ada perumahan
                </TableCell>
              </TableRow>
            ) : (
              list.map((town) => (
                <TableRow key={town._id}>
                  <TableCell className="font-medium">{town.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{town.slug}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{town.address ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={town.isActive ? 'default' : 'secondary'}>
                      {town.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {town.notionDatabaseId ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(town._id)}
                        disabled={syncing === town._id}
                      >
                        <RefreshCw className={`size-3 ${syncing === town._id ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Belum dikonfigurasi</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(town)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(town._id, town.name)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Perumahan' : 'Tambah Perumahan'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl><Input placeholder="Griya Indah" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl><Input placeholder="griya-indah" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl><Input placeholder="Jl. Contoh No. 1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(v === 'true')}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Aktif</SelectItem>
                      <SelectItem value="false">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="notionDatabaseId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notion Database ID</FormLabel>
                  <FormControl><Input placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notionApiKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notion API Key {editing && <span className="text-muted-foreground font-normal">(kosongkan jika tidak diubah)</span>}</FormLabel>
                  <FormControl><Input type="password" placeholder="secret_..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
