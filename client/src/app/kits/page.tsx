'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { kitApi } from '@/lib/api';
import { 
  Plus, Sparkles, LogOut, FileText, Clock, CheckCircle2, AlertCircle, Loader2,
  Search, Brain, Layers, BookOpen, BarChart3, Globe, ArrowRight, User
} from 'lucide-react';

export default function KitsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [kits, setKits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'generating' | 'failed'>('all');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      kitApi.list()
        .then((data: any) => setKits(data.kits || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs text-slate-400 font-mono">Loading Workspace...</span>
        </div>
      </div>
    );
  }

  // Filter kits
  const filteredKits = kits.filter((k) => {
    const matchesSearch = 
      (k.kit?.role?.title || k.kit?.source?.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.companyUrl || k.kit?.source?.company || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || k.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalQuestions = kits.reduce((acc, k) => acc + (k.kit?.questions?.length || 0), 0);
  const totalFlashcards = kits.reduce((acc, k) => acc + (k.kit?.flashcards?.length || 0), 0);
  const readyKitsCount = kits.filter((k) => k.status === 'ready').length;

  const statusConfig: Record<string, { bg: string; border: string; text: string; label: string; icon: any }> = {
    generating: { 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/20', 
      text: 'text-amber-400', 
      label: 'Generating',
      icon: Loader2 
    },
    ready: { 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20', 
      text: 'text-emerald-400', 
      label: 'Ready',
      icon: CheckCircle2 
    },
    failed: { 
      bg: 'bg-rose-500/10', 
      border: 'border-rose-500/20', 
      text: 'text-rose-400', 
      label: 'Failed',
      icon: AlertCircle 
    },
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 relative">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Navigation Header */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
              PrepKit <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">Workspace</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs text-slate-300 font-medium">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user.email}</span>
            </div>

            <button
              onClick={() => { logout(); router.push('/'); }}
              className="p-2 text-slate-400 hover:text-rose-400 transition-colors rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative">
        {/* Top Metric Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Total Prep Kits</span>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">{kits.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Questions Prepared</span>
              <div className="text-2xl font-extrabold text-indigo-300 mt-1 font-mono">{totalQuestions}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Flashcards Created</span>
              <div className="text-2xl font-extrabold text-cyan-300 mt-1 font-mono">{totalFlashcards}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Kits Ready</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">{readyKitsCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Prep Kits
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-white/10 text-slate-400 font-mono">
                {filteredKits.length}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select an interview kit to start practice flashcards or build custom questions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search role or company..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-white/10 p-1 rounded-xl text-xs">
              {(['all', 'ready', 'generating', 'failed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <Link
              href="/kits/new"
              className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Kit
            </Link>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 space-y-4">
                <div className="skeleton-dark h-6 w-3/4" />
                <div className="skeleton-dark h-4 w-1/2" />
                <div className="skeleton-dark h-4 w-full" />
              </div>
            ))}
          </div>
        ) : filteredKits.length === 0 ? (
          /* Empty Workspace State */
          <div className="glass-card p-12 text-center max-w-xl mx-auto border border-white/10 my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-6">
              <Brain className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2">No Prep Kits Found</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              {searchQuery || statusFilter !== 'all'
                ? 'No kits matched your current search or status filter criteria.'
                : 'You have not created any interview prep kits yet. Paste a job description and company URL to build your first tailored kit.'}
            </p>
            <Link
              href="/kits/new"
              className="btn-primary px-6 py-3 rounded-xl text-sm font-bold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Your First Kit
            </Link>
          </div>
        ) : (
          /* Kit Cards Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKits.map((kitItem: any) => {
              const statusKey = kitItem.status || 'generating';
              const status = statusConfig[statusKey] || statusConfig.generating;
              const StatusIcon = status.icon;

              const roleTitle = kitItem.kit?.role?.title || kitItem.kit?.source?.role || 'Untitled Kit';
              const companyDomain = kitItem.kit?.source?.company || kitItem.companyUrl || 'Unknown Company';
              const questionCount = kitItem.kit?.questions?.length || 0;
              const flashcardCount = kitItem.kit?.flashcards?.length || 0;
              const days = kitItem.daysAvailable || kitItem.kit?.schedule?.days_available || 7;

              return (
                <Link
                  key={kitItem._id}
                  href={`/kits/${kitItem._id}`}
                  className="glass-card p-6 glass-card-hover flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Top Status & Date */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${status.bg} ${status.border} ${status.text}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${statusKey === 'generating' ? 'animate-spin' : ''}`} />
                        <span>{status.label}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(kitItem.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Role Title */}
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
                      {roleTitle}
                    </h3>

                    {/* Company Domain */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="line-clamp-1 font-mono">{companyDomain}</span>
                    </div>
                  </div>

                  {/* Metadata Bar */}
                  <div>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-300 font-semibold">{questionCount} Qs</span>
                        <span>•</span>
                        <span className="font-mono text-slate-300 font-semibold">{flashcardCount} Cards</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{days}d plan</span>
                      </div>
                    </div>

                    <div className="mt-4 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center justify-end gap-1">
                      <span>Open Kit</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
