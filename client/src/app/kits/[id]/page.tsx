'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { kitApi } from '@/lib/api';
import {
  ArrowLeft, Sparkles, Loader2, CheckCircle2, AlertCircle, XCircle,
  Building2, Target, HelpCircle, BookOpen, Calendar, BarChart3,
  Edit3, Trash2, Plus, RefreshCw, GripVertical, ChevronDown, ChevronUp,
  Save, X, Play, Pin, Pencil, Brain, ExternalLink, ShieldCheck
} from 'lucide-react';

export default function KitPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const kitId = params.id as string;

  const [kitData, setKitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('brief');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['technical', 'behavioural', 'system-design', 'company-fit']));

  const loadKit = useCallback(async () => {
    try {
      const data = await kitApi.get(kitId);
      setKitData((data as any).kit);
    } catch (error) {
      console.error('Failed to load kit:', error);
    } finally {
      setLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadKit();
  }, [user, router, loadKit]);

  // Poll for progress while generating
  useEffect(() => {
    if (!kitData || kitData.status !== 'generating') return;
    const interval = setInterval(loadKit, 3000);
    return () => clearInterval(interval);
  }, [kitData, loadKit]);

  if (loading || !kitData) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-xs text-slate-400 font-mono">Loading Kit Workspace...</span>
      </div>
    );
  }

  const kit = kitData.kit;
  const editState = kitData.editState || {};

  // ─── Event Handlers ──────────────────────────────────────────

  const startEdit = (id: string, field: string, value: string) => {
    setEditingItem(`${id}.${field}`);
    setEditValues({ ...editValues, [`${id}.${field}`]: value });
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  const saveQuestionEdit = async (questionId: string, field: string) => {
    const value = editValues[`${questionId}.${field}`];
    try {
      await kitApi.updateQuestion(kitId, questionId, { [field]: value });
      await loadKit();
      setEditingItem(null);
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    await kitApi.deleteQuestion(kitId, questionId);
    await loadKit();
  };

  const addQuestion = async (category: string) => {
    await kitApi.addQuestion(kitId, {
      requirement_ids: [],
      category,
      prompt: 'New question — click to edit',
      answer_outline: 'Add your answer outline here',
      difficulty: 2,
    });
    await loadKit();
  };

  const saveFlashcardEdit = async (flashcardId: string, field: string) => {
    const value = editValues[`${flashcardId}.${field}`];
    await kitApi.updateFlashcard(kitId, flashcardId, { [field]: value });
    await loadKit();
    setEditingItem(null);
  };

  const deleteFlashcard = async (flashcardId: string) => {
    if (!confirm('Delete this flashcard?')) return;
    await kitApi.deleteFlashcard(kitId, flashcardId);
    await loadKit();
  };

  const addFlashcard = async () => {
    await kitApi.addFlashcard(kitId, {
      front: 'New flashcard — click to edit',
      back: 'Add the answer here',
      requirement_ids: [],
    });
    await loadKit();
  };

  const saveBriefEdit = async (field: string) => {
    const value = editValues[`brief.${field}`];
    await kitApi.updateCompanyBrief(kitId, { [field]: value });
    await loadKit();
    setEditingItem(null);
  };

  const regenerateSection = async (section: string) => {
    setRegenerating(section);
    try {
      await kitApi.regenerateSection(kitId, section);
      await loadKit();
    } catch (e) {
      console.error('Regeneration failed:', e);
    } finally {
      setRegenerating(null);
    }
  };

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    setExpandedCategories(next);
  };

  const getStateBadge = (itemId: string) => {
    const state = editState[itemId];
    if (state === 'pinned') return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"><Pin className="w-2.5 h-2.5" />Pinned</span>;
    if (state === 'edited') return <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"><Pencil className="w-2.5 h-2.5" />Edited</span>;
    return null;
  };

  const tabs = [
    { id: 'brief', label: 'Company Brief', icon: Building2 },
    { id: 'role', label: 'Role Context', icon: Target },
    { id: 'questions', label: 'Question Bank', icon: HelpCircle },
    { id: 'flashcards', label: '3D Flashcards', icon: BookOpen },
    { id: 'schedule', label: 'Study Schedule', icon: Calendar },
    { id: 'coverage', label: 'Coverage Matrix', icon: BarChart3 },
  ];

  // ─── Generating View ──────────────────────────────────────────
  if (kitData.status === 'generating') {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
        <header className="glass-nav sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
            <Link href="/kits" className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold">Building Kit Infrastructure...</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-16">
          <div className="glass-card p-8 border border-indigo-500/30 space-y-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Synthesizing Kit Materials</h2>
            </div>
            <div className="space-y-4">
              {(kitData.progress || []).map((step: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  {step.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : step.status === 'running' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400 shrink-0" />
                  ) : step.status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className={`font-medium ${step.status === 'done' ? 'text-slate-400' : 'text-white'}`}>
                      {step.label}
                    </span>
                    {step.detail && <span className="text-slate-500 ml-2 font-mono">{step.detail}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Failed View ──────────────────────────────────────────────
  if (kitData.status === 'failed') {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 text-slate-100">
        <div className="glass-card p-8 max-w-md text-center border border-rose-500/30">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Kit Generation Failed</h2>
          <p className="text-xs text-slate-400 mb-6">{kitData.errorMessage || 'An unexpected error occurred during pipeline execution.'}</p>
          <Link href="/kits/new" className="btn-primary px-6 py-3 rounded-xl text-xs font-bold inline-block">
            Try Building Again
          </Link>
        </div>
      </div>
    );
  }

  if (!kit) return null;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 relative">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Workspace Header */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/kits" className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-white tracking-tight">{kit.role?.title || 'Interview Kit'}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                    {kit.source?.company || 'Company'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {kit.questions?.length || 0} Questions • {kit.flashcards?.length || 0} Flashcards • {kit.schedule?.days_available || 7}-Day Schedule
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/kits/${kitId}/practice`}
                className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 border-none"
              >
                <Play className="w-4 h-4 fill-white" />
                Practice Studio
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-1 overflow-x-auto border-b border-white/5 pb-0" role="tablist">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'bg-slate-900/90 text-white border-indigo-500 shadow-sm'
                      : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'questions' && kit.questions && (
                    <span className="ml-1 px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                      {kit.questions.length}
                    </span>
                  )}
                  {tab.id === 'flashcards' && kit.flashcards && (
                    <span className="ml-1 px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                      {kit.flashcards.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Company Brief Tab */}
        {activeTab === 'brief' && kit.company_brief && (
          <div className="max-w-4xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Company Intelligence Brief</h2>
                <p className="text-xs text-slate-400">Scraped background context & architecture profile</p>
              </div>
              <button
                onClick={() => regenerateSection('company_brief')}
                disabled={!!regenerating}
                className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating === 'company_brief' ? 'animate-spin' : ''}`} />
                Regenerate Brief
              </button>
            </div>

            {['summary', 'what_they_do'].map((field) => (
              <div key={field} className="glass-card p-6 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">{field.replace(/_/g, ' ')}</h3>
                  <div className="flex items-center gap-2">
                    {getStateBadge('company_brief')}
                    <button
                      onClick={() => startEdit('brief', field, (kit.company_brief as any)[field])}
                      className="p-1 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {editingItem === `brief.${field}` ? (
                  <div className="space-y-3">
                    <textarea
                      value={editValues[`brief.${field}`] || ''}
                      onChange={(e) => setEditValues({ ...editValues, [`brief.${field}`]: e.target.value })}
                      className="w-full p-4 rounded-xl bg-slate-900 border border-indigo-500 text-xs text-white focus:outline-none"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveBriefEdit(field)} className="btn-primary px-3 py-1.5 rounded-lg text-xs font-bold"><Save className="w-3.5 h-3.5 inline mr-1" />Save</button>
                      <button onClick={cancelEdit} className="btn-secondary px-3 py-1.5 rounded-lg text-xs"><X className="w-3.5 h-3.5 inline mr-1" />Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">{(kit.company_brief as any)[field]}</p>
                )}
              </div>
            ))}

            {kit.company_brief.sources?.length > 0 && (
              <div className="glass-card p-6 border border-white/10 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Scraped Sources & Links</h3>
                <div className="space-y-2">
                  {kit.company_brief.sources.map((src: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-indigo-400 font-mono">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <a href={src} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{src}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Role Tab */}
        {activeTab === 'role' && kit.role && (
          <div className="max-w-4xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{kit.role.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-semibold">{kit.role.seniority || 'Mid-Senior'}</span>
                  <span className="px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-xs text-slate-400 font-mono">{kit.source?.location || 'Remote'}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border border-white/10 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Key Responsibilities</h3>
              <ul className="space-y-2.5">
                {kit.role.responsibilities?.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-6 border border-white/10 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Extracted Requirements ({kit.role.requirements?.length || 0})</h3>
              <div className="space-y-2.5">
                {kit.role.requirements?.map((req: any) => (
                  <div key={req.id} className="flex items-center gap-3 p-3.5 bg-slate-900/80 border border-white/5 rounded-xl text-xs">
                    <span className={`px-2 py-0.5 rounded font-mono uppercase font-bold text-[10px] ${
                      req.priority === 'must' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {req.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">{req.kind}</span>
                    <span className="text-slate-200 flex-1">{req.text}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{req.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="max-w-4xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Tailored Question Bank ({kit.questions?.length || 0})</h2>
                <p className="text-xs text-slate-400">Organized by category with difficulty ratings & answers</p>
              </div>

              <button
                onClick={() => regenerateSection('questions')}
                disabled={!!regenerating}
                className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating === 'questions' ? 'animate-spin' : ''}`} />
                Regenerate All Questions
              </button>
            </div>

            {['technical', 'behavioural', 'system-design', 'company-fit'].map((category) => {
              const catQuestions = kit.questions?.filter((q: any) => q.category === category) || [];
              if (catQuestions.length === 0 && !expandedCategories.has(category)) return null;

              return (
                <div key={category} className="glass-card border border-white/10 overflow-hidden">
                  <div
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white capitalize text-base">{category.replace('-', ' ')}</h3>
                      <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-mono font-semibold">
                        {catQuestions.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); regenerateSection(category); }}
                        disabled={!!regenerating}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                        title={`Regenerate ${category}`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${regenerating === category ? 'animate-spin' : ''}`} />
                      </button>
                      {expandedCategories.has(category) ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {expandedCategories.has(category) && (
                    <div className="px-5 pb-5 space-y-4">
                      {catQuestions.map((q: any) => (
                        <div key={q.id} className="p-4 rounded-xl bg-slate-900/80 border border-white/5 hover:border-indigo-500/40 transition-all space-y-3 group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                q.difficulty === 3 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                q.difficulty === 2 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                Difficulty {q.difficulty}
                              </span>
                              {getStateBadge(q.id)}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEdit(q.id, 'prompt', q.prompt)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteQuestion(q.id)} className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>

                          {editingItem === `${q.id}.prompt` ? (
                            <div className="space-y-2">
                              <textarea
                                value={editValues[`${q.id}.prompt`] || ''}
                                onChange={(e) => setEditValues({ ...editValues, [`${q.id}.prompt`]: e.target.value })}
                                className="w-full p-3 bg-slate-950 border border-indigo-500 rounded-xl text-xs text-white focus:outline-none"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button onClick={() => saveQuestionEdit(q.id, 'prompt')} className="btn-primary px-3 py-1 rounded-lg text-xs font-bold">Save</button>
                                <button onClick={cancelEdit} className="btn-secondary px-3 py-1 rounded-lg text-xs">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-slate-100 leading-relaxed">{q.prompt}</p>
                          )}

                          {editingItem === `${q.id}.answer_outline` ? (
                            <div className="space-y-2">
                              <textarea
                                value={editValues[`${q.id}.answer_outline`] || ''}
                                onChange={(e) => setEditValues({ ...editValues, [`${q.id}.answer_outline`]: e.target.value })}
                                className="w-full p-3 bg-slate-950 border border-indigo-500 rounded-xl text-xs text-white focus:outline-none"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button onClick={() => saveQuestionEdit(q.id, 'answer_outline')} className="btn-primary px-3 py-1 rounded-lg text-xs font-bold">Save Answer Outline</button>
                                <button onClick={cancelEdit} className="btn-secondary px-3 py-1 rounded-lg text-xs">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                              <button
                                onClick={() => startEdit(q.id, 'answer_outline', q.answer_outline)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-medium flex items-center gap-1"
                              >
                                View/Edit Answer Outline →
                              </button>

                              <div className="flex gap-1">
                                {q.requirement_ids?.map((rid: string) => (
                                  <span key={rid} className="px-1.5 py-0.5 bg-slate-950 rounded border border-white/5 text-[10px] font-mono text-slate-400">{rid}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => addQuestion(category)}
                        className="w-full py-3 border border-dashed border-white/10 rounded-xl text-xs text-slate-400 hover:text-white hover:border-indigo-500/50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Question to {category}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Flashcards Tab */}
        {activeTab === 'flashcards' && (
          <div className="max-w-4xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Interactive 3D Flashcards ({kit.flashcards?.length || 0})</h2>
                <p className="text-xs text-slate-400">Practice core concepts with automated SRS confidence grading</p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/kits/${kitId}/practice`}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Launch Practice Studio
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {kit.flashcards?.map((fc: any) => (
                <div key={fc.id} className="glass-card p-5 border border-white/10 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-mono text-slate-400">{fc.id}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(fc.id, 'front', fc.front)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteFlashcard(fc.id)} className="p-1 hover:bg-rose-500/10 rounded text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <p className="font-bold text-sm text-white mb-2">{fc.front}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{fc.back}</p>
                  </div>
                </div>
              ))}

              <button
                onClick={addFlashcard}
                className="p-6 border border-dashed border-white/10 rounded-2xl text-xs text-slate-400 hover:text-white hover:border-indigo-500/50 transition-colors flex items-center justify-center gap-2 min-h-[140px]"
              >
                <Plus className="w-5 h-5" /> Add New Flashcard
              </button>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && kit.schedule && (
          <div className="max-w-4xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{kit.schedule.days_available}-Day Tailored Study Schedule</h2>
                <p className="text-xs text-slate-400">Optimized allocation putting harder system design concepts earlier</p>
              </div>

              <button
                onClick={() => regenerateSection('schedule')}
                disabled={!!regenerating}
                className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating === 'schedule' ? 'animate-spin' : ''}`} />
                Regenerate Schedule
              </button>
            </div>

            <div className="space-y-4">
              {kit.schedule.days?.map((day: any) => (
                <div key={day.day} className="glass-card p-5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm font-mono shadow-md">
                        D{day.day}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{day.focus}</h3>
                        <p className="text-xs text-slate-400 font-mono">{day.minutes} minutes allocated</p>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-300 font-mono font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                      {day.question_ids?.length || 0} Questions
                    </span>
                  </div>

                  {day.question_ids?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                      {day.question_ids.map((qid: string) => {
                        const q = kit.questions?.find((q: any) => q.id === qid);
                        return q ? (
                          <div key={qid} className="px-2.5 py-1 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-300 hover:border-indigo-500/40 transition-colors" title={q.prompt}>
                            <span className="font-mono text-indigo-400 font-semibold mr-1.5">{qid}</span>
                            <span className="truncate max-w-[200px] inline-block align-bottom">{q.prompt}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coverage Tab */}
        {activeTab === 'coverage' && kit.coverage && (
          <div className="max-w-4xl space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-white">Requirement Coverage Matrix</h2>
              <p className="text-xs text-slate-400">Multi-pass verification results across extracted job requirements</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="glass-card p-6 border border-white/10 text-center space-y-1">
                <span className="text-xs text-slate-400">Coverage Passes</span>
                <p className="text-3xl font-extrabold text-indigo-400 font-mono">{kit.coverage.passes}</p>
              </div>

              <div className="glass-card p-6 border border-white/10 text-center space-y-1">
                <span className="text-xs text-slate-400">Covered Requirements</span>
                <p className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {(kit.role?.requirements?.length || 0) - (kit.coverage.uncovered_requirement_ids?.length || 0)}
                </p>
              </div>

              <div className="glass-card p-6 border border-white/10 text-center space-y-1">
                <span className="text-xs text-slate-400 font-medium">Uncovered Gaps</span>
                <p className={`text-3xl font-extrabold font-mono ${
                  (kit.coverage.uncovered_requirement_ids?.length || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {kit.coverage.uncovered_requirement_ids?.length || 0}
                </p>
              </div>
            </div>

            {(kit.coverage.uncovered_requirement_ids?.length || 0) === 0 ? (
              <div className="glass-card p-8 border border-emerald-500/30 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">100% Requirement Coverage Achieved</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Every single extracted job requirement has been mapped to at least one question or flashcard in this prep kit.
                </p>
              </div>
            ) : (
              <div className="glass-card p-6 border border-rose-500/30 space-y-3">
                <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  Uncovered Requirements ({kit.coverage.uncovered_requirement_ids.length})
                </h3>
                <div className="space-y-2">
                  {kit.coverage.uncovered_requirement_ids.map((rid: string) => {
                    const req = kit.role?.requirements?.find((r: any) => r.id === rid);
                    return (
                      <div key={rid} className="p-3 bg-slate-900 border border-white/5 rounded-xl text-xs flex items-center gap-3">
                        <span className="font-mono text-rose-400 font-bold">{rid}</span>
                        <span className="text-slate-300">{req?.text || 'Unknown requirement text'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
