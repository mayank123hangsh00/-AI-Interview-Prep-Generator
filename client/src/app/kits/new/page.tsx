'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { kitApi } from '@/lib/api';
import { 
  Sparkles, ArrowLeft, Upload, Plus, Loader2, Globe, FileText, Calendar, 
  CheckCircle2, Brain, Shield, Cpu, Zap, Layers, RefreshCw
} from 'lucide-react';

export default function NewKitPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [daysAvailable, setDaysAvailable] = useState(7);
  const [loading, setLoading] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Simulate pipeline steps animation during generation
  useEffect(() => {
    if (loading) {
      setGenerationStep(0);
      const step1 = setTimeout(() => setGenerationStep(1), 1500);
      const step2 = setTimeout(() => setGenerationStep(2), 3500);
      const step3 = setTimeout(() => setGenerationStep(3), 6000);
      const step4 = setTimeout(() => setGenerationStep(4), 8500);
      return () => {
        clearTimeout(step1);
        clearTimeout(step2);
        clearTimeout(step3);
        clearTimeout(step4);
      };
    }
  }, [loading]);

  if (!user) {
    return null;
  }

  const handleFillSample = () => {
    setJobDescription(`Senior Backend Engineer - Financial Platform

About the Role:
We are looking for an experienced Senior Backend Engineer to design, build, and scale our next-generation payment and billing infrastructure. You will work on high-throughput microservices, distributed transaction locks, and real-time ledger settlement systems.

Requirements & Core Competencies:
- 5+ years of software engineering experience in Go, Ruby, Java, or C++.
- Expertise in PostgreSQL, Redis caching, Kafka event streaming, and distributed locks.
- Strong knowledge of API design, rate-limiting, and microservices architecture.
- Demonstrated experience building high-availability, zero-downtime financial platforms.
- Deep understanding of system design tradeoffs, idempotency, and fault tolerance.`);
    setCompanyUrl('https://stripe.com');
    setDaysAvailable(7);
  };

  const extractDomain = (url: string) => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'single') {
        const data = await kitApi.create(jobDescription, companyUrl, daysAvailable);
        router.push(`/kits/${(data as any).kit._id}`);
      } else if (batchFile) {
        const text = await batchFile.text();
        const cases = JSON.parse(text);
        await kitApi.createBatch(
          cases.map((c: any) => ({
            jobDescription: c.jd || c.jobDescription,
            companyUrl: c.company_url || c.companyUrl,
            daysAvailable: c.days || c.daysAvailable || 7,
          }))
        );
        router.push('/kits');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create kit');
      setLoading(false);
    }
  };

  const pipelineSteps = [
    { label: 'Crawling site architecture & public interview logs...', icon: Globe },
    { label: 'Extracting technical competencies & behavioral requirements...', icon: Brain },
    { label: 'Generating tailored questions & 3D flashcards with Groq AI...', icon: Zap },
    { label: 'Checking requirement coverage matrix & filling gaps...', icon: Shield },
    { label: 'Building day-by-day study schedule...', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 relative">
      {/* Background Accent */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/kits" 
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight">Create Interview Prep Kit</h1>
              <p className="text-xs text-slate-400">AI crawler & requirement synthesis engine</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFillSample}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Load Sample JD
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 relative">
        {/* Loading Animated Pipeline Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 bg-[#090d16]/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="glass-card max-w-lg w-full p-8 border border-indigo-500/30 shadow-2xl space-y-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 mx-auto relative">
                <Brain className="w-8 h-8 text-white animate-pulse" />
                <div className="absolute -inset-1 rounded-2xl bg-indigo-500/30 blur-md animate-ping pointer-events-none" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-white">Generating Your Prep Kit</h2>
                <p className="text-xs text-slate-400 mt-1">Our AI crawler is analyzing the company site and engineering requirements.</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-700 rounded-full"
                  style={{ width: `${Math.min(100, (generationStep + 1) * 20)}%` }}
                />
              </div>

              {/* Pipeline Step List */}
              <div className="space-y-3 text-left">
                {pipelineSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isDone = idx < generationStep;
                  const isActive = idx === generationStep;

                  return (
                    <div 
                      key={step.label}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition-all ${
                        isDone 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                          : isActive 
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-white font-medium' 
                            : 'bg-slate-900/40 border-white/5 text-slate-500'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                      ) : (
                        <StepIcon className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className="line-clamp-1">{step.label}</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] font-mono text-slate-500">Please remain on this page • Estimated completion time ~10-15s</p>
            </div>
          </div>
        )}

        {/* Single vs Batch Segmented Toggle */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-900 border border-white/10 mb-8 max-w-xs">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
              mode === 'single'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            Single Kit
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
              mode === 'batch'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Batch Upload
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {mode === 'single' ? (
            <>
              {/* Job Description Card */}
              <div className="glass-card p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-sm">Job Description</h2>
                      <p className="text-xs text-slate-400">Paste full role posting with technical requirements</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{jobDescription.length} chars</span>
                </div>

                <textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={10}
                  className="w-full p-4 rounded-xl bg-slate-900/90 border border-white/10 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono leading-relaxed"
                  placeholder="Paste job description here... (e.g. Senior Backend Engineer...)"
                  required
                  minLength={10}
                />
              </div>

              {/* Company Website Card */}
              <div className="glass-card p-6 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-sm">Target Company Website</h2>
                      <p className="text-xs text-slate-400">Our scraper will research engineering culture & blog posts</p>
                    </div>
                  </div>

                  {companyUrl && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-mono text-cyan-300">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{extractDomain(companyUrl)}</span>
                    </div>
                  )}
                </div>

                <input
                  id="companyUrl"
                  type="url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="https://company.com"
                  required
                />
              </div>

              {/* Days Available Card */}
              <div className="glass-card p-6 border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm">Study Schedule Duration</h2>
                    <p className="text-xs text-slate-400">Select available days until your interview</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {[3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDaysAvailable(d)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        daysAvailable === d
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}

                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      id="daysAvailable"
                      type="number"
                      value={daysAvailable}
                      onChange={(e) => setDaysAvailable(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      max={365}
                      className="w-20 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm font-mono font-bold text-center text-white focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">custom days</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Batch Upload Card */
            <div className="glass-card p-10 border border-white/10 text-center space-y-4">
              <Upload className="w-12 h-12 text-indigo-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">Upload Batch JSON</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Upload a JSON array with <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">jd</code>,{' '}
                <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">company_url</code>, and{' '}
                <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">days</code> parameters.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary px-6 py-3 rounded-xl text-xs font-semibold"
              >
                {batchFile ? `📄 ${batchFile.name}` : 'Choose Batch File'}
              </button>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading || (mode === 'single' ? !jobDescription || !companyUrl : !batchFile)}
            className="w-full btn-primary py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 text-indigo-200" />
            {mode === 'single' ? 'Generate Custom Prep Kit' : 'Process Batch Upload'}
          </button>
        </form>
      </main>
    </div>
  );
}
