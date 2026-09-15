import React, { useState } from 'react';
import { Search, X, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { DocumentItem } from '../types';

interface AISearchModalProps {
  documents: DocumentItem[];
  onClose: () => void;
  onSelectDocument: (doc: DocumentItem) => void;
}

export const AISearchModal: React.FC<AISearchModalProps> = ({ documents, onClose, onSelectDocument }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [matchedDocIds, setMatchedDocIds] = useState<string[]>([]);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSearch = async (qText?: string) => {
    const searchText = qText || query;
    if (!searchText.trim()) return;

    setIsSearching(true);
    setAnswer(null);

    try {
      const res = await fetch('/api/vault/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchText, documents }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.result) {
        setAnswer(data.result.directAnswer);
        setMatchedDocIds(data.result.matchingDocIds || []);
      }
    } catch (err) {
      console.error(err);
      // Fallback client filtering
      const match = documents.filter((d) =>
        d.name.toLowerCase().includes(searchText.toLowerCase()) ||
        d.category.toLowerCase().includes(searchText.toLowerCase()) ||
        d.tags.some((t) => t.toLowerCase().includes(searchText.toLowerCase()))
      );
      setMatchedDocIds(match.map((m) => m.id));
      setAnswer(`Found ${match.length} matching document(s) in your vault.`);
    } finally {
      setIsSearching(false);
    }
  };

  const matchedDocs = documents.filter((d) => matchedDocIds.includes(d.id));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5 shrink-0">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search vault or ask question (e.g. 'Show passport expiration')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            onClick={() => handleSearch()}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs shrink-0 cursor-pointer"
          >
            {isSearching ? <Sparkles className="w-4 h-4 animate-spin text-amber-300 shrink-0" /> : 'Search'}
          </button>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Answer Box */}
        {answer && (
          <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/50 border-b border-blue-200 dark:border-blue-800/80 text-xs text-blue-900 dark:text-blue-200 font-semibold flex items-start gap-2.5 shrink-0">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-bold uppercase tracking-wider text-[10px] text-blue-600 dark:text-blue-400 mb-0.5">
                Vault Document Search Results
              </div>
              <p>{answer}</p>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="p-3 sm:p-4 pb-10 flex-1 overflow-y-auto space-y-2">
          {matchedDocs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Type a search term or question to query your encrypted document vault.
            </div>
          ) : (
            matchedDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  onSelectDocument(doc);
                  onClose();
                }}
                className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {doc.category[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{doc.name}</div>
                    <div className="text-[10px] text-slate-400">{doc.category} • {doc.subCategory}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
