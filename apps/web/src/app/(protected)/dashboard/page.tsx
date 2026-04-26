'use client';

import { Building2, FileText, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { towns, users, type Town, type AdminUser } from '@/lib/api';

export default function DashboardPage() {
  const [townList, setTownList] = useState<Town[]>([]);
  const [userList, setUserList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([towns.list(), users.list()])
      .then(([t, u]) => {
        setTownList(t);
        setUserList(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      title: 'Total Perumahan',
      value: townList.length,
      sub: `${townList.filter((t) => t.isActive).length} aktif`,
      icon: Building2,
    },
    {
      title: 'Admin',
      value: userList.filter((u) => u.role === 'admin').length,
      sub: `${userList.length} total pengguna`,
      icon: Users,
    },
    {
      title: 'Regulasi',
      value: '—',
      sub: 'Lihat per perumahan',
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Ringkasan sistem Townibos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perumahan Terdaftar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : townList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada perumahan terdaftar.</p>
          ) : (
            <div className="divide-y">
              {townList.map((town) => (
                <div key={town._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">{town.name}</p>
                    <p className="text-xs text-muted-foreground">{town.slug}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    town.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {town.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
