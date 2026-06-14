'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { guildWarsApi, guildApi } from '../../../../lib/api';
import clsx from 'clsx';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Хүлээгдэж байна', color: 'text-accent bg-accent/10 border-accent/30' },
  ACCEPTED:  { label: 'Хүлээн авсан',    color: 'text-accent-blue bg-accent-blue/10 border-accent-blue/30' },
  ACTIVE:    { label: 'Тулаан болж байна', color: 'text-accent-green bg-accent-green/10 border-accent-green/30' },
  FINISHED:  { label: 'Дууссан',          color: 'text-muted-foreground bg-surface-2 border-border' },
  CANCELLED: { label: 'Цуцлагдсан',       color: 'text-accent-red bg-accent-red/10 border-accent-red/30' },
};

export default function GuildWarsPage() {
  const queryClient = useQueryClient();

  const { data: myGuild } = useQuery({
    queryKey: ['my-guild'],
    queryFn: guildApi.getMyGuild,
    retry: false,
  });

  const { data: myWars = [], isLoading: myWarsLoading } = useQuery({
    queryKey: ['my-guild-wars'],
    queryFn: guildWarsApi.getMy,
    enabled: !!myGuild,
    refetchInterval: 30000,
  });

  const { data: activeWars = [] } = useQuery({
    queryKey: ['active-guild-wars'],
    queryFn: guildWarsApi.getActive,
    refetchInterval: 30000,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['guild-leaderboard'],
    queryFn: guildApi.getLeaderboard,
  });

  const challengeMutation = useMutation({
    mutationFn: (defenderGuildId: string) => guildWarsApi.challenge(defenderGuildId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guild-wars'] });
      toast.success('Дайны уриалга илгээгдлээ!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const acceptMutation = useMutation({
    mutationFn: (warId: string) => guildWarsApi.accept(warId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guild-wars'] });
      toast.success('Дайн хүлээн авлаа! Тулаан эхэллээ!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Алдаа гарлаа'),
  });

  const isLeader = myGuild?.members?.find((m: any) => m.role === 'LEADER')?.userId === myGuild?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-red/15 via-primary/10 to-surface-2 border border-accent-red/20 p-5">
        <div className="relative">
          <h2 className="text-xl font-black">⚔️ Guild Wars</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Guild-ийн хооронд тулалдах систем</p>
        </div>
      </div>

      {!myGuild ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🏰</p>
          <p className="font-bold">Guild-д нэгдсэний дараа дайн зарлах боломжтой</p>
        </div>
      ) : (
        <>
          {/* My wars */}
          {myWarsLoading ? (
            <div className="flex justify-center py-8"><div className="anime-spinner w-8 h-8" /></div>
          ) : (myWars as any[]).length > 0 ? (
            <div>
              <h3 className="font-bold text-lg mb-3">Миний Guild-ийн дайнууд</h3>
              <div className="space-y-3">
                {(myWars as any[]).map((war: any, i: number) => {
                  const isAttacker = war.attackerGuildId === myGuild.id;
                  const myScore = isAttacker ? war.attackerScore : war.defenderScore;
                  const oppScore = isAttacker ? war.defenderScore : war.attackerScore;
                  const oppGuild = isAttacker ? war.defenderGuild : war.attackerGuild;
                  const status = STATUS_LABEL[war.status] ?? STATUS_LABEL.CANCELLED;
                  const canAccept = war.status === 'PENDING' && !isAttacker;
                  return (
                    <motion.div
                      key={war.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="bg-surface border border-border rounded-2xl p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* My guild */}
                          <div className="text-center flex-1 min-w-0">
                            <p className="font-black text-sm truncate text-primary">{myGuild.name}</p>
                            {war.status === 'ACTIVE' || war.status === 'FINISHED' ? (
                              <p className="text-2xl font-black text-accent">{myScore}</p>
                            ) : null}
                          </div>
                          {/* VS */}
                          <div className="flex flex-col items-center flex-shrink-0">
                            <span className="font-black text-muted-foreground text-sm">VS</span>
                            <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-bold mt-1', status.color)}>{status.label}</span>
                          </div>
                          {/* Opp guild */}
                          <div className="text-center flex-1 min-w-0">
                            <p className="font-black text-sm truncate">{oppGuild?.name}</p>
                            {war.status === 'ACTIVE' || war.status === 'FINISHED' ? (
                              <p className="text-2xl font-black">{oppScore}</p>
                            ) : null}
                          </div>
                        </div>
                        {canAccept && (
                          <button
                            onClick={() => acceptMutation.mutate(war.id)}
                            disabled={acceptMutation.isPending}
                            className="px-4 py-2 text-sm bg-accent-green/20 text-accent-green border border-accent-green/30 rounded-xl font-bold hover:bg-accent-green/30 transition-colors flex-shrink-0"
                          >
                            ✅ Хүлээн авах
                          </button>
                        )}
                      </div>
                      {war.endTime && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Дуусах: {new Date(war.endTime).toLocaleString('mn-MN')}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Challenge other guilds */}
          <div>
            <h3 className="font-bold text-lg mb-3">⚔️ Guild сорьж дайн зарлах</h3>
            <div className="space-y-2">
              {(leaderboard as any[]).filter((g: any) => g.id !== myGuild.id).map((guild: any) => (
                <div key={guild.id} className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{guild.name}</p>
                    <p className="text-xs text-muted-foreground">👥 {guild.memberCount} гишүүн · ⭐ {guild.totalPoints} CP</p>
                  </div>
                  <button
                    onClick={() => challengeMutation.mutate(guild.id)}
                    disabled={challengeMutation.isPending}
                    className="px-3 py-1.5 text-xs bg-accent-red/20 text-accent-red border border-accent-red/30 rounded-lg font-bold hover:bg-accent-red/30 transition-colors disabled:opacity-50 active:scale-95 flex-shrink-0"
                  >
                    ⚔️ Дайн зарлах
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* All active wars */}
      {(activeWars as any[]).length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-3">🔥 Одоо болж буй дайнууд</h3>
          <div className="space-y-2">
            {(activeWars as any[]).filter((w: any) => w.status === 'ACTIVE').map((war: any) => (
              <div key={war.id} className="flex items-center gap-3 p-4 bg-surface border border-accent-red/20 rounded-xl">
                <div className="flex-1 text-sm">
                  <span className="font-bold text-primary">{war.attackerGuild?.name}</span>
                  <span className="text-muted-foreground mx-2">vs</span>
                  <span className="font-bold">{war.defenderGuild?.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-accent">{war.attackerScore}</span>
                  <span className="text-muted-foreground mx-1">:</span>
                  <span className="font-black">{war.defenderScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
