import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, FileDown, Loader2, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/apiUrl';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'xassida_list' | 'pdf_request' | 'knowledge_answer' | 'error';
  xassidas?: XassidaResult[];
  references?: Reference[];
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
  "Montre-moi les xassidas de Seydi El Hadji Malick Sy",
  "Qu'est-ce que le Wird Tidiaan ?",
  "Explique-moi la Salat al-Fatihi",
  "Qui est Cheikh Ahmad Tijani ?",
  "Quelles sont les règles de la Tariqa Tijaniyya ?",
];

export default function ChatbotScreen({ onNavigateToXassida }: { onNavigateToXassida?: (id: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Assalamu Alaikum ! Je suis l\'assistant de la Tariqa Tijaniyya. Je peux répondre à vos questions sur les œuvres tidianes, l\'histoire de la voie, sa jurisprudence, et vous aider à trouver des xassidas. Comment puis-je vous aider ?',
      type: 'knowledge_answer',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfModal, setPdfModal] = useState<XassidaResult | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getHistory = () =>
    messages
      .filter(m => m.type !== 'xassida_list' && m.type !== 'pdf_request')
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }));

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
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

  async function downloadPdf(xassida: XassidaResult, language: PdfLanguage) {
    setGeneratingPdf(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/pdf/${xassida.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      if (!res.ok) throw new Error('Erreur génération PDF');
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
    <div className="flex flex-col h-screen bg-background pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 to-green-700 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <div className="w-9 h-9 bg-gold-500/20 rounded-full flex items-center justify-center border border-gold-400/40">
          <Bot className="w-5 h-5 text-gold-300" />
        </div>
        <div>
          <h1 className="font-bold text-sm">Assistant Tidiaan</h1>
          <p className="text-green-200 text-[10px]">Tariqa Tijaniyya • Œuvres & Jurisprudence</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            msg={msg}
            onPdfRequest={xassida => setPdfModal(xassida)}
            onNavigateToXassida={onNavigateToXassida}
          />
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 bg-green-800 rounded-full flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-gold-300" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Suggestions initiales */}
        {messages.length === 1 && !loading && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground text-center">Suggestions :</p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="w-full text-left text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2 text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center justify-between gap-2"
              >
                <span>{s}</span>
                <ChevronRight className="w-3 h-3 shrink-0 text-green-500" />
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-border bg-background">
        <div className="flex items-end gap-2 bg-muted rounded-2xl px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground max-h-24 leading-5"
            style={{ minHeight: '20px' }}
          />
          <Button
            size="icon"
            className="w-8 h-8 bg-green-700 hover:bg-green-800 rounded-xl shrink-0"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground text-center mt-1">
          Basé sur les œuvres de la Tariqa Tijaniyya • Les réponses peuvent nécessiter vérification
        </p>
      </div>

      {/* Modal PDF */}
      {pdfModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm">{pdfModal.title}</h3>
                {pdfModal.author_name && (
                  <p className="text-xs text-muted-foreground">{pdfModal.author_name}</p>
                )}
              </div>
              <button onClick={() => setPdfModal(null)} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Choisissez la langue du PDF :</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { lang: 'fr' as PdfLanguage, label: '🇫🇷 Français' },
                { lang: 'ar' as PdfLanguage, label: '🇸🇦 Arabe' },
                { lang: 'wo' as PdfLanguage, label: '🇸🇳 Wolof' },
              ].map(({ lang, label }) => (
                <button
                  key={lang}
                  onClick={() => downloadPdf(pdfModal, lang)}
                  disabled={generatingPdf}
                  className="flex flex-col items-center gap-1 border border-border rounded-xl py-3 px-2 text-xs hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 text-green-700" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  onPdfRequest,
  onNavigateToXassida,
}: {
  msg: ChatMessage;
  onPdfRequest: (x: XassidaResult) => void;
  onNavigateToXassida?: (id: string) => void;
}) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-start gap-2 max-w-[85%]">
          <div className="bg-green-700 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
            {msg.content}
          </div>
          <div className="w-7 h-7 bg-green-700 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 bg-green-900 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-gold-300" />
      </div>
      <div className="flex-1 space-y-2 max-w-[88%]">
        {/* Texte de réponse */}
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </div>

        {/* Liste de xassidas */}
        {msg.type === 'xassida_list' && msg.xassidas && msg.xassidas.length > 0 && (
          <div className="space-y-2">
            {msg.xassidas.map(x => (
              <div
                key={x.id}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-xs text-green-900 dark:text-green-100 truncate">{x.title}</p>
                  {x.author_name && (
                    <p className="text-[10px] text-green-600 dark:text-green-400">{x.author_name}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {onNavigateToXassida && (
                    <button
                      onClick={() => onNavigateToXassida(x.id)}
                      className="w-7 h-7 bg-green-700 rounded-lg flex items-center justify-center"
                      title="Voir le xassida"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                  <button
                    onClick={() => onPdfRequest(x)}
                    className="w-7 h-7 bg-gold-500 rounded-lg flex items-center justify-center"
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
      </div>
    </div>
  );
}
