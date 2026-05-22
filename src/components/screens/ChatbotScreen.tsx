import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, FileDown, Loader2, ChevronRight, X, ThumbsDown, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/apiUrl';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'xassida_list' | 'pdf_request' | 'knowledge_answer' | 'error';
  xassidas?: XassidaResult[];
  references?: Reference[];
  reported?: boolean;
}

interface XassidaResult {
  id: string;
  title: string;
  author_name?: string;
  description?: string;
}

interface Reference {
  source: string;
  title: string;
  similarity: number;
}

type PdfLanguage = 'fr' | 'ar' | 'wo';

const SUGGESTIONS = [
  "Qu'est-ce que le Wird Tidiaan ?",
  "Explique-moi la Salat al-Fatihi",
  "Qui est Cheikh Ahmad Tijani ?",
  "Montre-moi les xassidas de Seydi Malick Sy",
  "Quelles sont les règles de la Tariqa ?",
];

export default function ChatbotScreen({ onNavigateToXassida }: { onNavigateToXassida?: (id: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Assalamu Alaikum ! Je suis l\'assistant de la Tariqa Tijaniyya. Posez-moi vos questions sur les œuvres tidianes, l\'histoire de la voie, sa jurisprudence ou les xassidas.',
      type: 'knowledge_answer',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfModal, setPdfModal] = useState<XassidaResult | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px';
  }, [input]);

  const getHistory = () =>
    messages
      .filter(m => m.type !== 'xassida_list' && m.type !== 'pdf_request')
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }));

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: getHistory() }),
      });

      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          type: data.type,
          xassidas: data.xassidas,
          references: data.references,
          reported: false,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Une erreur s\'est produite. Veuillez réessayer.', type: 'error' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function reportMessage(msgIndex: number) {
    const botMsg = messages[msgIndex];
    const userMsg = [...messages].slice(0, msgIndex).reverse().find(m => m.role === 'user');
    if (!userMsg) return;

    try {
      await fetch(`${API_BASE_URL}/chat/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, bot_answer: botMsg.content }),
      });
    } catch { /* fire-and-forget */ }

    setMessages(prev => prev.map((m, i) => (i === msgIndex ? { ...m, reported: true } : m)));
  }

  async function downloadPdf(xassida: XassidaResult, language: PdfLanguage) {
    setGeneratingPdf(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/pdf/${xassida.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${xassida.title}_${language}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setPdfModal(null);
    } catch {
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    // Le conteneur prend toute la hauteur dispo. pb-16 = espace pour la bottom nav
    <div className="flex flex-col bg-[#f5f0e8] dark:bg-gray-950" style={{ height: '100dvh', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="shrink-0 bg-gradient-to-r from-green-900 to-green-700 text-white px-4 pt-3 pb-3 flex items-center gap-3 shadow-lg">
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shrink-0">
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm leading-tight">Assistant Tidiaan</h1>
          <p className="text-green-200 text-[10px] truncate">Tariqa Tijaniyya • Œuvres & Jurisprudence</p>
        </div>
        <div className="flex items-center gap-1.5 bg-green-800/50 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] text-green-200">En ligne</span>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 overscroll-contain">

        {/* Suggestions initiales */}
        {messages.length === 1 && !loading && (
          <div className="space-y-2 pb-2">
            <p className="text-[11px] text-center text-muted-foreground font-medium">Suggestions</p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left text-xs bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-2.5 text-green-900 dark:text-green-100 hover:bg-green-50 dark:hover:bg-green-900/40 active:scale-[0.98] transition-all flex items-center justify-between gap-2 shadow-sm"
                >
                  <span>{s}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-green-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            msg={msg}
            msgIndex={i}
            onPdfRequest={xassida => setPdfModal(xassida)}
            onNavigateToXassida={onNavigateToXassida}
            onReport={reportMessage}
          />
        ))}

        {/* Indicateur de frappe */}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '160ms' }} />
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '320ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Zone de saisie ───────────────────────────────────────── */}
      <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-3 py-2.5">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-3.5 py-2.5 flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-5 max-h-24"
              style={{ minHeight: '20px' }}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-green-700 hover:bg-green-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-sm"
          >
            {loading
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </button>
        </div>
        <p className="text-[9px] text-gray-400 text-center mt-1.5">
          Basé sur les œuvres de la Tariqa Tijaniyya • Vérifiez auprès d'un Cheikh pour les questions de jurisprudence
        </p>
      </div>

      {/* ── Modal PDF ────────────────────────────────────────────── */}
      {pdfModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm">{pdfModal.title}</h3>
                {pdfModal.author_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{pdfModal.author_name}</p>
                )}
              </div>
              <button onClick={() => setPdfModal(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Choisissez la langue du PDF :</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { lang: 'fr' as PdfLanguage, flag: '🇫🇷', label: 'Français' },
                { lang: 'ar' as PdfLanguage, flag: '🇸🇦', label: 'Arabe' },
                { lang: 'wo' as PdfLanguage, flag: '🇸🇳', label: 'Wolof' },
              ]).map(({ lang, flag, label }) => (
                <button
                  key={lang}
                  onClick={() => downloadPdf(pdfModal, lang)}
                  disabled={generatingPdf}
                  className="flex flex-col items-center gap-1.5 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 px-2 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {generatingPdf
                    ? <Loader2 className="w-5 h-5 animate-spin text-green-700" />
                    : <span className="text-xl">{flag}</span>
                  }
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  msgIndex,
  onPdfRequest,
  onNavigateToXassida,
  onReport,
}: {
  msg: ChatMessage;
  msgIndex: number;
  onPdfRequest: (x: XassidaResult) => void;
  onNavigateToXassida?: (id: string) => void;
  onReport: (index: number) => void;
}) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end items-end gap-2">
        <div className="max-w-[80%] bg-green-700 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm">
          {msg.content}
        </div>
        <div className="w-7 h-7 bg-green-700 rounded-full flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    );
  }

  const isError = msg.type === 'error';

  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-yellow-300" />
      </div>
      <div className="flex-1 space-y-2 max-w-[84%]">

        {/* Bulle de texte */}
        <div className={`rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
          isError
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100'
        }`}>
          {msg.content}
        </div>

        {/* Liste de xassidas */}
        {msg.type === 'xassida_list' && msg.xassidas && msg.xassidas.length > 0 && (
          <div className="space-y-1.5">
            {msg.xassidas.map(x => (
              <div
                key={x.id}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-green-900 dark:text-green-100 truncate">{x.title}</p>
                  {x.author_name && (
                    <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">{x.author_name}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {onNavigateToXassida && (
                    <button
                      onClick={() => onNavigateToXassida(x.id)}
                      className="w-7 h-7 bg-green-700 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                      title="Voir le xassida"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                  <button
                    onClick={() => onPdfRequest(x)}
                    className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
                    title="Générer PDF"
                  >
                    <FileDown className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Références RAG */}
        {msg.references && msg.references.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {msg.references.map((ref, i) => (
              <span
                key={i}
                className="text-[9px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full px-2 py-0.5 border border-green-200 dark:border-green-700"
              >
                📖 {ref.source}
              </span>
            ))}
          </div>
        )}

        {/* Bouton signalement */}
        {msg.type === 'knowledge_answer' && !isError && (
          <div className="flex justify-end pt-0.5">
            {msg.reported ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                <Check className="w-3 h-3" />
                Signalé
              </span>
            ) : (
              <button
                onClick={() => onReport(msgIndex)}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 active:scale-95 transition-all py-0.5 px-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Signaler une mauvaise réponse"
              >
                <ThumbsDown className="w-3 h-3" />
                Signaler
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
