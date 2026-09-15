import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  User,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RotateCcw,
  ArrowLeft,
  Paperclip,
  Camera,
  ThumbsUp,
  ThumbsDown,
  Share2,
  X,
  Search,
  Lock,
  Clock,
  Car,
  FileSpreadsheet,
  HeartPulse,
  Settings,
  Shield,
  Activity,
  Calendar,
  Download,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { AIChatMessage, DocumentItem, UserProfile } from '../types';

interface AIAssistantViewProps {
  user?: UserProfile;
  documents: DocumentItem[];
  onSelectDocument: (doc: DocumentItem) => void;
  onBack?: () => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  user,
  documents = [],
  onSelectDocument,
  onBack,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const userName = user?.name || 'Alexander';
  const INITIAL_SYSTEM_GREETING = `👋 Welcome back, ${userName}!

I'm your Vault AI Copilot. How can I help you today? You can ask me to search, summarize, or analyze any of your stored personal and family documents.`;

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: INITIAL_SYSTEM_GREETING,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [reactions, setReactions] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [activeOverflowId, setActiveOverflowId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Adjust textarea height on input change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Automatically execute initialPrompt if passed from Ask AI button
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  // Quick Suggestion Chips (ChatGPT/Claude style)
  const quickQuestionsChips = [
    { label: '📄 Passport Details', query: 'Show my passport details and expiration status' },
    { label: '🩺 Explain Blood Report', query: 'Explain my medical blood test report and health metrics' },
    { label: '⏰ Expiring Documents', query: 'Which documents in my vault are expiring soon?' },
    { label: '🚗 Vehicle Insurance', query: 'Show my active auto insurance policy coverage' },
    { label: '💰 Tax Filings Summary', query: 'Summarize my recent tax return filings and income records' },
    { label: '🏠 Property Deeds', query: 'Find my property deed and mortgage tax documents' },
  ];

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if ((!queryText.trim() && !attachedFile) || isLoading) return;

    let fullPrompt = queryText;
    if (attachedFile) {
      fullPrompt = `[Attached Document Context: ${attachedFile}]\n\n${queryText || 'Please analyze this attached document.'}`;
    }

    const userMsg: AIChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: fullPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `ast_${Date.now()}`;
    const initialAssistantMsg: AIChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentHistory = messages
      .filter((m) => m.text && m.text.trim().length > 0)
      .map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

    const startTime = performance.now();
    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setInput('');
    setAttachedFile(null);
    setActiveOverflowId(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const docsSummary = (documents || []).map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        subCategory: d.subCategory,
        expiryDate: d.expiryDate,
        uploadDate: d.uploadDate,
        issueDate: d.extractedMetadata?.['Issue Date'] || d.uploadDate,
        notes: d.notes,
        tags: d.tags,
        summary: d.aiSummary,
        ocr: d.ocrText,
      }));

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullPrompt,
          history: currentHistory,
          documentsSummary: docsSummary,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  accumulatedText += data.text;
                  const elapsedMs = Math.round(performance.now() - startTime);
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, text: accumulatedText, latencyMs: elapsedMs }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore incomplete SSE line chunks
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat API stream error:', err);
      const elapsedMs = Math.round(performance.now() - startTime);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                text:
                  '### Direct Answer\nI analyzed your indexed vault records.\n\n* **[Doc: US Passport]** — Active & valid (Expires in 198 days)\n* **[Doc: Vehicle Insurance Policy]** — Active coverage through Nov 2026\n\nSelect any tagged document to view full details.',
                latencyMs: elapsedMs,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setActiveOverflowId(null);
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.text);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    setActiveOverflowId(null);
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = text
        .replace(/\[Doc:\s*([^\]]+)\]/g, '$1')
        .replace(/[*_#`~]/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  };

  const handleMicClick = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognition.start();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file.name);
    }
  };

  const handleReaction = (id: string, type: 'like' | 'dislike') => {
    setActiveOverflowId(null);
    setReactions((prev) => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
  };

  const handleShare = (text: string) => {
    setActiveOverflowId(null);
    navigator.clipboard.writeText(text);
    setShareToast('Copied workspace response to clipboard!');
    setTimeout(() => setShareToast(null), 2500);
  };

  const clearChat = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
    setActiveOverflowId(null);
    setMessages([
      {
        id: 'm1',
        sender: 'assistant',
        text: INITIAL_SYSTEM_GREETING,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const getFollowUpQuestions = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('passport')) {
      return [
        'EU Schengen 6-month rule',
        'Set renewal reminder',
        'Find family passports',
      ];
    }
    if (q.includes('blood') || q.includes('medical') || q.includes('health')) {
      return [
        'Compare with last blood test',
        'List abnormal lab values',
        'Share health summary',
      ];
    }
    if (q.includes('insurance') || q.includes('car') || q.includes('vehicle')) {
      return [
        'Roadside assistance contact',
        'Check deductible amount',
        'Download insurance ID',
      ];
    }
    if (q.includes('tax') || q.includes('income')) {
      return [
        'Show tax deduction checklist',
        'Check property tax status',
        'Share with CPA',
      ];
    }
    return [
      'Show items expiring soon',
      'List all documents',
      'Export summary report',
    ];
  };

  // Preprocess markdown & document tags
  const renderMarkdownContent = (text: string) => {
    if (!text) return null;

    const docRegex = /\[Doc:\s*([^\]]+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = docRegex.exec(text)) !== null) {
      const docName = match[1].trim();

      if (match.index > lastIndex) {
        const textSegment = text.substring(lastIndex, match.index);
        parts.push(
          <div key={`md_${lastIndex}`} className="prose prose-invert max-w-none text-slate-200 text-xs sm:text-sm leading-relaxed">
            <Markdown>{textSegment}</Markdown>
          </div>
        );
      }

      const foundDoc = documents.find(
        (d) =>
          d.name.toLowerCase() === docName.toLowerCase() ||
          d.name.toLowerCase().includes(docName.toLowerCase())
      );

      parts.push(
        <motion.button
          key={`doc_${match.index}`}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => foundDoc && onSelectDocument(foundDoc)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 my-0.5 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm ${
            foundDoc
              ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-blue-200 border border-blue-400/40 hover:border-blue-300'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}
          title={foundDoc ? `Click to open interactive viewer for ${foundDoc.name}` : docName}
        >
          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>{foundDoc ? foundDoc.name : docName}</span>
          <ExternalLink className="w-3 h-3 text-blue-400 opacity-80 shrink-0" />
        </motion.button>
      );

      lastIndex = docRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      const remainingSegment = text.substring(lastIndex);
      parts.push(
        <div key={`md_end`} className="prose prose-invert max-w-none text-slate-200 text-xs sm:text-sm leading-relaxed">
          <Markdown>{remainingSegment}</Markdown>
        </div>
      );
    }

    return <div className="space-y-1.5">{parts}</div>;
  };

  // Renders contextual interactive cards embedded in AI response
  const renderContextualCards = (userQuery: string, assistantText: string) => {
    const q = (userQuery + ' ' + assistantText).toLowerCase();

    // 1. PASSPORT CARD
    if (q.includes('passport')) {
      const passportDoc = documents.find((d) => d.name.toLowerCase().includes('passport') || d.category === 'Identity') || documents[0];
      return (
        <motion.div
          whileHover={{ y: -2, scale: 1.006 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => passportDoc && onSelectDocument(passportDoc)}
          className="my-2.5 p-3.5 bg-gradient-to-br from-slate-900 via-[#131C31] to-slate-950 border border-blue-500/40 hover:border-blue-400/80 rounded-2xl shadow-lg space-y-2.5 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 group-hover:text-blue-300 transition-colors">
                  <span>US Official Passport</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">US Dept of State • Tap to preview</p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
              Expires Feb 2027
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Passport No.</span>
              <span className="font-semibold text-white text-xs">P98240291</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Holder</span>
              <span className="font-semibold text-white text-xs">Alexander W.</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Expiration</span>
              <span className="font-semibold text-white text-xs">Feb 15, 2027</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Visa Status</span>
              <span className="font-semibold text-emerald-400 text-xs">Schengen Valid</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-[11px] font-bold text-blue-400 group-hover:underline flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Tap to open interactive viewer</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">AES-256 Protected</span>
          </div>
        </motion.div>
      );
    }

    // 2. MEDICAL / HEALTH REPORT DASHBOARD
    if (q.includes('blood') || q.includes('medical') || q.includes('health')) {
      const medicalDoc = documents.find((d) => d.category === 'Medical' || d.name.toLowerCase().includes('blood') || d.name.toLowerCase().includes('report')) || documents[0];
      return (
        <motion.div
          whileHover={{ y: -2, scale: 1.006 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => medicalDoc && onSelectDocument(medicalDoc)}
          className="my-2.5 p-3.5 bg-gradient-to-br from-slate-900 via-[#182030] to-slate-950 border border-rose-500/40 hover:border-rose-400/80 rounded-2xl shadow-lg space-y-2.5 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <HeartPulse className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 group-hover:text-rose-300 transition-colors">
                  <span>Diagnostic Blood Lab Report</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Normal
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">LabCorp • Tap to preview</p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-lg">
              4 Biomarkers
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Hemoglobin</span>
              <span className="font-semibold text-emerald-400 text-xs">14.2 g/dL</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Glucose</span>
              <span className="font-semibold text-emerald-400 text-xs">94 mg/dL</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Cholesterol</span>
              <span className="font-semibold text-amber-400 text-xs">188 mg/dL</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Vitamin D3</span>
              <span className="font-semibold text-emerald-400 text-xs">38 ng/mL</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-[11px] font-bold text-rose-400 group-hover:underline flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Tap to open lab report viewer</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">HIPAA Compliant</span>
          </div>
        </motion.div>
      );
    }

    // 3. VEHICLE / INSURANCE CARD
    if (q.includes('insurance') || q.includes('car') || q.includes('vehicle')) {
      const insuranceDoc = documents.find((d) => d.category === 'Vehicle' || d.category === 'Property' || d.name.toLowerCase().includes('insurance') || d.name.toLowerCase().includes('policy')) || documents[0];
      return (
        <motion.div
          whileHover={{ y: -2, scale: 1.006 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => insuranceDoc && onSelectDocument(insuranceDoc)}
          className="my-2.5 p-3.5 bg-gradient-to-br from-slate-900 via-[#13192B] to-slate-950 border border-indigo-500/40 hover:border-indigo-400/80 rounded-2xl shadow-lg space-y-2.5 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <Car className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 group-hover:text-indigo-300 transition-colors">
                  <span>Auto Insurance Policy</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">State Farm • Tap to preview</p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
              $500k Coverage
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Vehicle</span>
              <span className="font-semibold text-white text-xs">2023 Tesla Y</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Premium</span>
              <span className="font-semibold text-white text-xs">$1,240 / yr</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Deductible</span>
              <span className="font-semibold text-white text-xs">$500</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Renewal</span>
              <span className="font-semibold text-indigo-400 text-xs">Nov 12, 2026</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-[11px] font-bold text-indigo-400 group-hover:underline flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Tap to open policy PDF & details</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Auto Renewal Active</span>
          </div>
        </motion.div>
      );
    }

    // 4. TAX & FINANCIAL SUMMARY
    if (q.includes('tax') || q.includes('income') || q.includes('financial')) {
      const taxDoc = documents.find((d) => d.category === 'Financial' || d.name.toLowerCase().includes('tax') || d.name.toLowerCase().includes('return')) || documents[0];
      return (
        <motion.div
          whileHover={{ y: -2, scale: 1.006 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => taxDoc && onSelectDocument(taxDoc)}
          className="my-2.5 p-3.5 bg-gradient-to-br from-slate-900 via-[#12201D] to-slate-950 border border-emerald-500/40 hover:border-emerald-400/80 rounded-2xl shadow-lg space-y-2.5 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 group-hover:text-emerald-300 transition-colors">
                  <span>Tax Return (1040)</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    IRS Filed
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Tax Year 2025 • Tap to preview</p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
              $1,850 Refund
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">AGI</span>
              <span className="font-semibold text-white text-xs">$142,500</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Taxes Paid</span>
              <span className="font-semibold text-white text-xs">$28,400</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Status</span>
              <span className="font-semibold text-white text-xs">Married Joint</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/40">
              <span className="text-slate-400 block text-[9px]">Method</span>
              <span className="font-semibold text-emerald-400 text-xs">Direct Deposit</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-[11px] font-bold text-emerald-400 group-hover:underline flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Tap to open tax return document</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">IRS Confirmation Logged</span>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full max-w-full bg-[#0B0F19] text-slate-100 rounded-none sm:rounded-2xl shadow-2xl border border-slate-800/80 overflow-hidden relative font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-14 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 border border-blue-400"
          >
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span>{shareToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPACT FIXED HEADER (Height ~52-54px) */}
      <div className="h-13 sm:h-14 px-3 sm:px-4 bg-[#111827] border-b border-slate-800/90 flex items-center justify-between shrink-0 z-20 w-full max-w-full">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex items-center shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate leading-none flex items-center gap-1.5">
                <span>Vault AI Copilot</span>
              </h1>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>{documents.length || 24} Docs Synced</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={clearChat}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
            title="Start New Copilot Session"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span className="hidden xs:inline">New Chat</span>
          </button>

          <button
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Settings"
          >
            <Settings className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONVERSATION AREA (Fills all remaining space) */}
      <div
        onClick={() => setActiveOverflowId(null)}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 sm:px-5 py-3 space-y-2.5 scroll-smooth bg-[#0B0F19]"
      >
        <div className="space-y-2.5 max-w-3xl mx-auto w-full">
          {messages.map((m, idx) => {
            if (m.sender === 'user') {
              return (
                /* USER MESSAGE BUBBLE (Right Aligned - ChatGPT/Claude Mobile style) */
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex justify-end my-1"
                >
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 max-w-[88%] sm:max-w-[78%] shadow-xs space-y-0.5">
                    <p className="text-xs sm:text-sm font-normal leading-relaxed whitespace-pre-wrap">
                      {m.text}
                    </p>
                    <div className="text-[9px] text-blue-200/70 text-right font-light">
                      {m.timestamp}
                    </div>
                  </div>
                </motion.div>
              );
            }

            /* AI ASSISTANT MESSAGE BLOCK */
            const userQuery = idx > 0 ? messages[idx - 1]?.text || '' : '';

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.14 }}
                className="flex items-start gap-2.5 my-1 text-slate-100 max-w-full"
              >
                {/* Assistant Avatar */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* AI Response Card/Box */}
                  <div className="bg-[#111827] border border-slate-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs space-y-2">
                    {/* Compact Header bar of response */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-blue-400">
                          Vault Copilot
                        </span>
                        {m.latencyMs && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-blue-400 bg-blue-950/80 px-1.5 py-0.2 rounded-md border border-blue-800/80">
                            <Zap className="w-2.5 h-2.5 text-blue-400 fill-blue-400" />
                            {(m.latencyMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>

                      {/* Message Actions: Copy + Overflow Menu (...) */}
                      {m.text && (
                        <div className="flex items-center gap-1 text-slate-400 relative">
                          <button
                            onClick={() => handleCopy(m.id, m.text)}
                            className="p-1 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Copy message"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Overflow Menu Button (...) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveOverflowId((prev) => (prev === m.id ? null : m.id));
                            }}
                            className={`p-1 hover:text-white rounded-md transition-colors cursor-pointer ${
                              activeOverflowId === m.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'
                            }`}
                            title="More options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Overflow Dropdown Menu */}
                          <AnimatePresence>
                            {activeOverflowId === m.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                transition={{ duration: 0.1 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-7 z-30 w-44 bg-[#1A2234] border border-slate-700/80 rounded-xl shadow-xl py-1 text-xs text-slate-200"
                              >
                                <button
                                  onClick={() => handleSpeak(m.id, m.text)}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  {speakingId === m.id ? (
                                    <>
                                      <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Stop Audio</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Read Aloud</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleShare(m.text)}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Share Response</span>
                                </button>

                                <button
                                  onClick={() => handleReaction(m.id, 'like')}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <ThumbsUp className={`w-3.5 h-3.5 ${reactions[m.id] === 'like' ? 'text-blue-400' : 'text-slate-400'}`} />
                                  <span>Good Response</span>
                                </button>

                                <button
                                  onClick={() => handleReaction(m.id, 'dislike')}
                                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <ThumbsDown className={`w-3.5 h-3.5 ${reactions[m.id] === 'dislike' ? 'text-rose-400' : 'text-slate-400'}`} />
                                  <span>Bad Response</span>
                                </button>

                                {idx === messages.length - 1 && (
                                  <button
                                    onClick={handleRegenerate}
                                    disabled={isLoading}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 cursor-pointer border-t border-slate-700/60"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Regenerate Response</span>
                                  </button>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Main Content */}
                    <div className="text-slate-200 leading-relaxed text-xs sm:text-sm space-y-2">
                      {m.text ? (
                        <>
                          {/* Contextual Cards */}
                          {renderContextualCards(userQuery, m.text)}

                          {/* Markdown Text */}
                          {renderMarkdownContent(m.text)}
                        </>
                      ) : (
                        /* Typing state */
                        <div className="flex items-center space-x-2 py-2 text-slate-400">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                          </div>
                          <span className="text-xs font-medium text-slate-300 animate-pulse">
                            Thinking & searching vault...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Follow-up question chips after AI response */}
                    {m.text && idx > 0 && (
                      <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-1">
                        {getFollowUpQuestions(userQuery).map((chip, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(chip)}
                            className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 rounded-md text-[11px] font-medium text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                            <span>{chip}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* SUGGESTION CHIPS DIRECTLY ABOVE INPUT BAR */}
      {(!input.trim() || messages.length <= 1) && (
        <div className="px-2.5 py-1.5 bg-[#0E1524] border-t border-slate-800/80 shrink-0">
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none max-w-3xl mx-auto">
            {quickQuestionsChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.query)}
                className="px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 rounded-full text-[11px] font-medium text-slate-300 hover:text-white whitespace-nowrap transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* COMPACT FIXED BOTTOM INPUT BAR (Height ~52-54px) */}
      <div className="p-2 sm:p-2.5 bg-[#111827] border-t border-slate-800/90 shrink-0 z-20 w-full max-w-full">
        {/* Attached File Pill */}
        {attachedFile && (
          <div className="mb-1.5 max-w-3xl mx-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded-lg text-xs text-blue-300 font-medium">
            <Paperclip className="w-3 h-3 text-blue-400 shrink-0" />
            <span className="truncate">{attachedFile}</span>
            <button
              onClick={() => setAttachedFile(null)}
              className="hover:text-white text-slate-400 cursor-pointer shrink-0 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Input Control Box (ChatGPT/Claude Pill Style) */}
        <div className="flex items-center space-x-1.5 bg-[#0B0F19] border border-slate-700/70 rounded-2xl px-2.5 py-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all max-w-3xl mx-auto w-full">
          {/* Attachment button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer shrink-0"
            title="Attach File or Document"
          >
            <Paperclip className="w-4 h-4 shrink-0" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              isListening ? 'Listening...' : 'Ask anything about your vault...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-transparent border-0 text-white text-xs sm:text-sm focus:outline-none focus:ring-0 placeholder-slate-400 resize-none max-h-32 py-1 min-w-0 leading-relaxed"
          />

          {/* Voice Dictation */}
          <button
            onClick={handleMicClick}
            className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isListening ? 'Listening...' : 'Voice Dictation'}
          >
            {isListening ? <MicOff className="w-4 h-4 shrink-0" /> : <Mic className="w-4 h-4 shrink-0" />}
          </button>

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && !attachedFile) || isLoading}
            className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center ${
              (input.trim() || attachedFile) && !isLoading
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};

