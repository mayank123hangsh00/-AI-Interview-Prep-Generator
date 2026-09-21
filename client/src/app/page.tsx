'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { 
  Sparkles, Target, BookOpen, Calendar, ArrowRight, Brain, Shield, Zap, 
  Globe, CheckCircle2, Cpu, Layers, BarChart3, ChevronRight, PlayCircle
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden">
      {/* Background Ambient Glows & Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-radial-glow pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[60%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                PrepKit <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold tracking-wide uppercase font-mono">AI</span>
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/kits"
                className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="btn-primary px-5 py-2.5 rounded-xl text-sm"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 max-w-7xl mx-auto px-6 text-center">
        {/* Shimmer Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-8 backdrop-blur-md shadow-inner">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Gen AI Interview Intelligence</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Turn any job post into your{' '}
          <span className="gradient-text-primary block mt-1">
            personalized prep kit
          </span>
        </h1>

        <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Paste a job description and company URL. Our AI crawler researches company architecture, extracts requirements, and creates tailored technical questions, 3D flashcards, and a day-by-day study schedule.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link
            href={user ? '/kits/new' : '/register'}
            className="btn-primary px-8 py-4 rounded-xl text-base font-bold flex items-center gap-3 w-full sm:w-auto justify-center"
          >
            <Sparkles className="w-5 h-5 text-indigo-200" />
            Build Your Prep Kit Now
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#preview"
            className="btn-secondary px-6 py-4 rounded-xl text-base font-medium flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <PlayCircle className="w-5 h-5 text-slate-400" />
            See Live Demo
          </a>
        </div>

        {/* Interactive Live Preview Mockup Container */}
        <div id="preview" className="relative max-w-5xl mx-auto rounded-2xl p-2 bg-gradient-to-b from-indigo-500/20 via-slate-800/40 to-slate-900/80 border border-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="bg-[#0f172a] rounded-xl border border-white/5 overflow-hidden text-left shadow-2xl">
            {/* Window Top Bar */}
            <div className="bg-slate-900/90 px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">stripe.com/jobs/senior-backend-engineer</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Crawled & Verified</span>
              </div>
            </div>

            {/* Mockup Body Content */}
            <div className="p-6 grid md:grid-cols-3 gap-6">
              {/* Left Column: Role Details */}
              <div className="md:col-span-1 space-y-4 border-r border-white/5 pr-0 md:pr-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Target Role</span>
                  <h3 className="text-lg font-bold text-white mt-1">Senior Backend Engineer</h3>
                  <p className="text-xs text-slate-400">Financial Infrastructure Team @ Stripe</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Requirement Coverage</span>
                    <span className="text-indigo-400 font-mono font-bold">100%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-full rounded-full" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400">Detected Tech Stack</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Ruby', 'Go', 'Distributed Systems', 'PostgreSQL', 'Idempotency', 'Kafka'].map((tech) => (
                      <span key={tech} className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Generated Content Preview */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white bg-slate-800 px-3 py-1 rounded-lg border border-white/10">14 Tailored Questions</span>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1 rounded-lg">15 Flashcards</span>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1 rounded-lg">7-Day Study Schedule</span>
                  </div>
                  <span className="text-xs text-indigo-400 font-mono">3 Categories</span>
                </div>

                {/* Sample Question Cards */}
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-500/60 transition-all space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">System Design</span>
                      <span className="text-amber-400 font-medium">Hard</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      How would you design a fault-tolerant payment processing engine with zero double-charge guarantee under network partition?
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 opacity-80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">Technical Core</span>
                      <span className="text-indigo-400 font-medium">Medium</span>
                    </div>
                    <p className="text-sm font-medium text-slate-300">
                      Explain Stripe&apos;s API rate limiting strategy using sliding window counter vs token bucket algorithms.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 max-w-7xl mx-auto px-6 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
            Engineered for High-Stakes Tech Interviews
          </h2>
          <p className="text-slate-400 text-lg">
            Standard prep tools give generic questions. PrepKit crawls actual company data to build precision prep material.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Globe,
              title: 'Automated Web Crawling',
              desc: 'Crawls company websites, engineering blogs, and public interview experiences to extract precise architectural context.',
              color: 'from-cyan-500 to-blue-600',
              badge: 'Real-time Scraper',
            },
            {
              icon: Cpu,
              title: 'Requirement Coverage Engine',
              desc: 'Parses job descriptions line-by-line and performs 3-pass gap filling to guarantee 100% core requirement coverage.',
              color: 'from-indigo-500 to-purple-600',
              badge: 'Zero Gaps',
            },
            {
              icon: Calendar,
              title: 'Dynamic Day Allocator',
              desc: 'Distributes study material logically across your available prep days, front-loading harder system design concepts.',
              color: 'from-purple-500 to-pink-600',
              badge: 'Smart Schedule',
            },
          ].map((item) => (
            <div 
              key={item.title} 
              className="glass-card p-8 glass-card-hover relative group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center shadow-lg`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Step Process */}
      <section className="py-20 border-t border-white/5 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Workflow</span>
            <h2 className="text-3xl font-bold text-white mt-2">How PrepKit Builds Your Prep Kit</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Input Job Post', desc: 'Paste the job description & target company website URL.' },
              { step: '02', title: 'Deep Crawl', desc: 'AI scraper inspects site architecture and engineering culture.' },
              { step: '03', title: 'Synthesis', desc: 'Questions, flashcards, and schedule matrix are generated.' },
              { step: '04', title: 'Practice Studio', desc: 'Master concepts with 3D flashcards and confidence grading.' },
            ].map((step, idx) => (
              <div key={step.step} className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 relative">
                <div className="text-3xl font-black text-indigo-500/40 font-mono mb-4">{step.step}</div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">PrepKit Engine</span>
          </div>
          <p>© 2026 PrepKit. Enterprise Grade Preparation System.</p>
        </div>
      </footer>
    </div>
  );
}
