'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { towns, users, type AdminUser, type Town } from '@/lib/api';

const createSchema = z.object({
  username: z.string().min(3, 'Minimal 3 karakter'),
  password: z.string().min(6, 'Minimal 6 karakter'),
  role: z.enum(['superadmin', 'admin']),
  townId: z.string().optional(),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Minimal 6 karakter'),
});

type CreateValues = z.infer<typeof createSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function UsersPage() {
  const [list, setList] = useState<AdminUser[]>([]);
  const [townList, setTownList] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openPassword, setOpenPassword] = useState<AdminUser | null>(null);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'admin' },
  });
  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const watchRole = createForm.watch('role');

  async function load() {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([users.list(), towns.list()]);
      setList(u);
      setTownList(t);
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function getTownName(townId?: string) {
    if (!townId) return '—';
    return townList.find((t) => t._id === townId)?.name ?? townId;
  }

  async function onCreateSubmit(values: CreateValues) {
    try {
      await users.create(values);
      toast.success('Pengguna dibuat');
      setOpenCreate(false);
      createForm.reset();
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    if (!openPassword) return;
    try {
      await users.changePassword(openPassword._id, values.newPassword);
      toast.success('Password diperbarui');
      setOpenPassword(null);
      passwordForm.reset();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Hapus pengguna "${username}"?`)) return;
    try {
      await users.remove(id);
      toast.success('Pengguna dihapus');
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pengguna</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola admin perumahan</p>
        </div>
        <Button onClick={() => { createForm.reset({ role: 'admin' }); setOpenCreate(true); }}>
          <Plus className="size-4" />
          Tambah Pengguna
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Perumahan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Belum ada pengguna
                </TableCell>
              </TableRow>
            ) : (
              list.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getTownName(user.townId)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Ganti password"
                        onClick={() => { setOpenPassword(user); passwordForm.reset(); }}
                      >
                        <KeyRound className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(user._id, user.username)}
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

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField control={createForm.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl><Input placeholder="admin@griyaindah" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={createForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={createForm.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              {watchRole === 'admin' && (
                <FormField control={createForm.control} name="townId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perumahan</FormLabel>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih perumahan" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {townList.map((t) => (
                          <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Batal</Button>
                <Button type="submit" disabled={createForm.formState.isSubmitting}>
                  {createForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={!!openPassword} onOpenChange={(v) => { if (!v) setOpenPassword(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ganti Password — {openPassword?.username}</DialogTitle>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenPassword(null)}>Batal</Button>
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>Simpan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
