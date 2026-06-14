'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { guildApi, characterApi } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/auth.store';
import clsx from 'clsx';

const GUILD_ICONS = ['⚔️', '🔥', '🌊', '⚡', '🌪️', '🌙', '☀️', '🎭', '🐉', '🦅'];
const guildIcon = (name: string) => GUILD_ICONS[Math.abs((name?.charCodeAt(0) ?? 0)) % GUILD_ICONS.length];

export default function GuildPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', animeId: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const { data: myGuild, isLoading: myGuildLoading } = useQuery({
    queryKey: ['my-guild'],
    queryFn: guildApi.getMyGuild,
    retry: false,
  });

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery({
    queryKey: ['guild-leaderboard'],
    queryFn: guildApi.getLeaderboard,
    refetchInterval: 60000,
  });

  const { data: animes = [] } = useQuery({
    queryKey: ['animes'],
    queryFn: characterApi.getAnimes,
    enabled: showCreate,
  });

  const joinMutation = useMutation({
    mutationFn: (guildId: string) => guildApi.joinGuild(guildId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guild'] });
      queryClient.invalidateQueries({ queryKey: ['guild-leaderboard'] });
      toast.success('Guild-д нэгдлээ!');
      setJoiningId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const leaveMutation = useMutation({
    mutationFn: guildApi.leaveGuild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guild'] });
      queryClient.invalidateQueries({ queryKey: ['guild-leaderboard'] });
      toast.success('Guild-аас гарлаа');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const createMutation = useMutation({
    mutationFn: () => guildApi.createGuild(createForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guild'] });
      queryClient.invalidateQueries({ queryKey: ['guild-leaderboard'] });
      toast.success('Guild амжилттай үүслээ!');
      setShowCreate(false);
      setCreateForm({ name: '', description: '', animeId: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const updateMutation = useMutation({
    mutationFn: () => guildApi.updateGuild(editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guild'] });
      toast.success('Guild шинэчлэгдлээ');
      setShowEdit(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const promoteMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      guildApi.promoteMember(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guild'] });
      toast.success('Гишүүний эрх шинэчлэгдлээ');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const myRole = myGuild?.members?.find((m: any) => m.userId === user?.id)?.role ?? myGuild?.role;
  const isLeader = myRole === 'LEADER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-blue/15 to-surface-2 border border-accent-blue/20 p-5">
        <div className="absolute inset-0 bg-gradient-radial from-accent-blue/5 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">🏰 Guild</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Guild-д нэгдэж хамтдаа тулалдаарай</p>
          </div>
          {!myGuild && !myGuildLoading && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-bold hover:bg-primary/30 transition-colors active:scale-95"
            >
              + Guild үүсгэх
            </button>
          )}
        </div>
      </div>

      {/* Create Guild Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-surface border border-primary/30 rounded-2xl p-6 shadow-glow-purple"
          >
            <h3 className="font-black text-lg mb-4">🏰 Шинэ Guild үүсгэх</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Guild-ийн нэр *</label>
                <input
                  className="w-full mt-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="Гойчин Guild"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Аниме сонгох *</label>
                <select
                  className="w-full mt-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  value={createForm.animeId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, animeId: e.target.value }))}
                >
                  <option value="">-- Аниме сонго --</option>
                  {(animes as any[]).map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Тайлбар</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                  rows={2}
                  placeholder="Guild-ийн тайлбар..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!createForm.name || !createForm.animeId || createMutation.isPending}
                  className="flex-1 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-bold hover:bg-primary/30 disabled:opacity-40 transition-colors active:scale-95"
                >
                  {createMutation.isPending ? '...' : '✓ Үүсгэх'}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-muted-foreground border border-border rounded-xl text-sm hover:bg-surface-2 transition-colors"
                >
                  Цуцлах
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Guild */}
      {myGuildLoading ? (
        <div className="flex justify-center py-8"><div className="anime-spinner w-8 h-8" /></div>
      ) : myGuild ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-primary/30 rounded-2xl p-6 shadow-glow-purple"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-4xl flex-shrink-0">
                {guildIcon(myGuild.name)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black">{myGuild.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full font-bold">Миний Guild</span>
                  {isLeader && <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent border border-accent/30 rounded-full font-bold">👑 Leader</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{myGuild.description}</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-sm font-bold text-accent">⭐ {myGuild.totalPoints ?? 0} CP</span>
                  <span className="text-sm text-muted-foreground">👥 {myGuild.memberCount ?? 0} гишүүн</span>
                  {myGuild.rank && <span className="text-sm font-bold text-accent-blue">#{myGuild.rank} байр</span>}
                </div>
              </div>
            </div>
            {isLeader && (
              <button
                onClick={() => { setEditForm({ name: myGuild.name, description: myGuild.description ?? '' }); setShowEdit(true); }}
                className="p-2 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-surface-2 transition-colors flex-shrink-0"
                title="Guild засах"
              >
                ✏️
              </button>
            )}
          </div>

          {/* Edit form */}
          <AnimatePresence>
            {showEdit && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 border-t border-border pt-4 space-y-3 overflow-hidden"
              >
                <h4 className="font-bold text-sm">✏️ Guild засах</h4>
                <input
                  className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="Guild нэр"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
                <textarea
                  className="w-full px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                  rows={2}
                  placeholder="Тайлбар"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    className="flex-1 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-bold hover:bg-primary/30 disabled:opacity-40 transition-colors"
                  >
                    {updateMutation.isPending ? '...' : '✓ Хадгалах'}
                  </button>
                  <button onClick={() => setShowEdit(false)} className="px-4 py-2 text-muted-foreground border border-border rounded-xl text-sm hover:bg-surface-2 transition-colors">Цуцлах</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Members */}
          {myGuild.members && myGuild.members.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <h4 className="font-bold text-sm mb-3 text-muted-foreground">Гишүүд</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {myGuild.members.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{member.role === 'LEADER' ? '👑' : member.role === 'OFFICER' ? '⭐' : '👤'}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{member.username}</p>
                        <p className="text-xs text-muted-foreground">{member.characterPoints ?? 0} CP</p>
                      </div>
                    </div>
                    {isLeader && member.userId !== user?.id && (
                      <select
                        className="text-xs bg-surface border border-border rounded px-1 py-0.5 focus:outline-none"
                        value={member.role}
                        onChange={(e) => promoteMutation.mutate({ userId: member.userId, role: e.target.value })}
                      >
                        <option value="MEMBER">Гишүүн</option>
                        <option value="OFFICER">⭐ Офицер</option>
                        <option value="LEADER">👑 Leader болгох</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLeader && (
            <button
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
              className="mt-4 px-4 py-2 text-sm text-accent-red border border-accent-red/30 rounded-lg hover:bg-accent-red/10 transition-colors disabled:opacity-50"
            >
              {leaveMutation.isPending ? 'Гарж байна...' : '← Guild-аас гарах'}
            </button>
          )}
        </motion.div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center">
          <p className="text-4xl mb-3">🏰</p>
          <h3 className="font-bold mb-1">Guild-д элссэнгүй байна</h3>
          <p className="text-sm text-muted-foreground">Доорх guild-уудаас нэгдэж, эсвэл шинэ guild үүсгэнэ үү</p>
        </div>
      )}

      {/* Guild leaderboard */}
      <div>
        <h3 className="font-bold text-lg mb-3">🏆 Guild Леадерборд</h3>
        {lbLoading ? (
          <div className="flex justify-center py-8"><div className="anime-spinner w-8 h-8" /></div>
        ) : (leaderboard as any[]).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-3xl mb-2">🏰</p>
            <p>Guild байхгүй байна</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(leaderboard as any[]).map((guild: any, i: number) => {
              const isMyGuild = guild.id === myGuild?.id;
              return (
                <motion.div
                  key={guild.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={clsx(
                    'flex items-center gap-3 p-4 rounded-xl border transition-colors',
                    isMyGuild ? 'border-primary/40 bg-primary/10' : 'border-border bg-surface hover:bg-surface-2',
                  )}
                >
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0',
                    i === 0 ? 'bg-accent text-background' : i === 1 ? 'bg-surface-2 border border-muted-foreground text-muted-foreground' : i === 2 ? 'bg-amber-800/40 text-amber-400' : 'bg-surface-2 text-muted-foreground text-xs',
                  )}>
                    {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-2xl flex-shrink-0">
                    {guildIcon(guild.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">
                      {guild.name}
                      {isMyGuild && <span className="text-primary ml-1.5 text-sm">(Миний)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">👥 {guild.memberCount} гишүүн</p>
                  </div>
                  <div className="text-right flex-shrink-0 text-sm">
                    <p className="font-bold text-accent">⭐ {guild.totalPoints?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">CP</p>
                  </div>
                  {!myGuild && (
                    <button
                      onClick={() => { setJoiningId(guild.id); joinMutation.mutate(guild.id); }}
                      disabled={joinMutation.isPending}
                      className="px-3 py-1.5 text-xs bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50 flex-shrink-0 font-medium active:scale-95"
                    >
                      {joinMutation.isPending && joiningId === guild.id ? '...' : '+ Нэгдэх'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
