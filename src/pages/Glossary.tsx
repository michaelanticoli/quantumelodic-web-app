import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, BookOpen, Music, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import glossaryData from '@/data/glossary.json';

interface GlossaryEntry {
  term: string;
  definition: string;
  math: string;
  music: string;
}

const entries = glossaryData as GlossaryEntry[];

const CATEGORIES = ['All', 'A-F', 'G-L', 'M-R', 'S-Z'] as const;

function getCategory(term: string): typeof CATEGORIES[number] {
  const c = term[0]?.toUpperCase() ?? 'A';
  if (c <= 'F') return 'A-F';
  if (c <= 'L') return 'G-L';
  if (c <= 'R') return 'M-R';
  return 'S-Z';
}

export default function Glossary() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return entries.filter(e => {
      if (category !== 'All' && getCategory(e.term) !== category) return false;
      if (!q) return true;
      return e.term.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q) ||
        e.music.toLowerCase().includes(q);
    });
  }, [search, category]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/30">
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-5 py-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-semibold tracking-tight">Quantumelodic Codex</h1>
          <span className="ml-auto text-xs text-muted-foreground">{entries.length} terms</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-5 py-8 space-y-6">
        {/* Search & filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search terms, definitions, or musical equivalents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card/50 border-border/40"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'term' : 'terms'} found
        </p>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((entry, i) => (
              <motion.div
                key={entry.term}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-3 hover:border-primary/30 transition-colors"
              >
                <h3 className="font-display font-semibold text-sm text-primary">{entry.term}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{entry.definition}</p>

                {entry.music && (
                  <div className="flex items-start gap-2 text-xs">
                    <Music className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground/70">{entry.music}</span>
                  </div>
                )}

                {entry.math && (
                  <div className="flex items-start gap-2 text-xs">
                    <Calculator className="w-3.5 h-3.5 text-highlight shrink-0 mt-0.5" />
                    <span className="text-foreground/50 font-mono text-[10px]">{entry.math}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No terms match your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}
