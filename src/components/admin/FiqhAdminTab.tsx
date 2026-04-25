import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, BookOpen, Trash2, ChevronLeft, Save, Loader2, FileText, Languages,
  Eye, Download, Upload, Pencil, ChevronDown, Mic, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL as API_URL } from '@/lib/apiUrl';

interface ChapterMeta { name: string; icon: string; arabic?: string; }

interface FiqhBook {
  id: string;
  title: string;
  arabic_name: string;
  description: string;
  actual_verse_count: number;
  author_id: string;
  author_name: string;
  categorie?: string;
  chapters_json?: Record<string, ChapterMeta>;
}

interface Author { id: string; name: string; }

interface VerseRow {
  id?: number;
  verse_number: number;
  chapter_number?: number;
  text_arabic?: string;
  transcription?: string;
  translation_fr?: string;
  translation_en?: string;
  translation_wo?: string;
  audio_url?: string;
  content?: string;
}

type View = 'list' | 'chapters' | 'pdf-arabic' | 'pdf-french';

const BLANK_VERSE: Omit<VerseRow, 'id'> = {
  verse_number: 1,
  chapter_number: 1,
  text_arabic: '',
  transcription: '',
  translation_fr: '',
  translation_wo: '',
  audio_url: '',
};

const JSON_TEMPLATE: VerseRow[] = [
  { verse_number: 1, chapter_number: 1, text_arabic: 'النص العربي', transcription: 'Translittération latine', translation_fr: 'Traduction française', translation_wo: 'Traduction wolof' },
  { verse_number: 2, chapter_number: 1, text_arabic: 'النص العربي', transcription: 'Translittération latine', translation_fr: 'Traduction française', translation_wo: 'Traduction wolof' },
];

function downloadJson(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────

const FiqhAdminTab = () => {
  const { token } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const queryClient = useQueryClient();
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<View>('list');
  const [selectedBook, setSelectedBook] = useState<FiqhBook | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [editingVerseId, setEditingVerseId] = useState<number | null>(null);
  const [verseForm, setVerseForm] = useState<Omit<VerseRow, 'id'>>(BLANK_VERSE);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [pdfExtracted, setPdfExtracted] = useState<VerseRow[]>([]);
  const [pdfFilename, setPdfFilename] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isJsonLoading, setIsJsonLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', arabic_name: '', author_id: '', description: '' });
  const [editableChapters, setEditableChapters] = useState<Record<string, { name: string; icon: string; arabic: string }>>({});
  const [showChapterNamesPanel, setShowChapterNamesPanel] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: books = [], isLoading } = useQuery<FiqhBook[]>({
    queryKey: ['fiqh-books-admin'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/xassidas?fiqh=true&admin=true`, { headers: authHeaders });
      if (!res.ok) throw new Error('Erreur chargement livres');
      return res.json();
    },
  });

  const { data: authors = [] } = useQuery<Author[]>({
    queryKey: ['authors'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/authors`, { headers: authHeaders });
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const { data: bookVerses = [], isLoading: versesLoading } = useQuery<VerseRow[]>({
    queryKey: ['fiqh-verses', selectedBook?.id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/xassidas/${selectedBook!.id}/verses`, { headers: authHeaders });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!selectedBook && view === 'chapters',
  });

  // ── Chapter groups ────────────────────────────────────────────────────────
  const chapterGroups = useMemo(() => {
    const groups = new Map<number, VerseRow[]>();
    for (const verse of bookVerses) {
      const ch = verse.chapter_number ?? 1;
      if (!groups.has(ch)) groups.set(ch, []);
      groups.get(ch)!.push(verse);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a - b);
  }, [bookVerses]);

  const nextChapterNumber = chapterGroups.length > 0
    ? Math.max(...chapterGroups.map(([n]) => n)) + 1
    : 1;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const res = await fetch(`${API_URL}/xassidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...data, is_fiqh: true, categorie: 'Fiqh' }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur création'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiqh-books-admin'] });
      setShowCreateModal(false);
      setCreateForm({ title: '', arabic_name: '', author_id: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/xassidas/${id}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) throw new Error('Erreur suppression');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fiqh-books-admin'] }),
  });

  const saveVerseMutation = useMutation({
    mutationFn: async (verse: Omit<VerseRow, 'id'>) => {
      if (editingVerseId) {
        // Update existing
        const res = await fetch(`${API_URL}/xassidas/${selectedBook!.id}/verses/${editingVerseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(verse),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur'); }
        return res.json();
      } else {
        // Create new
        const res = await fetch(`${API_URL}/xassidas/${selectedBook!.id}/verses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ verses: [verse] }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur'); }
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiqh-verses', selectedBook?.id] });
      queryClient.invalidateQueries({ queryKey: ['fiqh-books-admin'] });
      setShowVerseModal(false);
      setVerseForm(BLANK_VERSE);
      setEditingVerseId(null);
    },
  });

  const deleteVerseMutation = useMutation({
    mutationFn: async (verseId: number) => {
      const res = await fetch(`${API_URL}/xassidas/${selectedBook!.id}/verses/${verseId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Erreur suppression');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiqh-verses', selectedBook?.id] });
      queryClient.invalidateQueries({ queryKey: ['fiqh-books-admin'] });
    },
  });

  const saveVersesBatch = useMutation({
    mutationFn: async ({ bookId, verses }: { bookId: string; verses: VerseRow[] }) => {
      const CHUNK = 50;
      for (let i = 0; i < verses.length; i += CHUNK) {
        const res = await fetch(`${API_URL}/xassidas/${bookId}/verses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ verses: verses.slice(i, i + CHUNK) }),
        });
        if (!res.ok) throw new Error(`Erreur chunk ${i}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiqh-books-admin'] });
      queryClient.invalidateQueries({ queryKey: ['fiqh-verses', selectedBook?.id] });
      setPdfExtracted([]); setView('chapters');
    },
  });

  const importTranslationsMutation = useMutation({
    mutationFn: async ({ bookId, translations }: { bookId: string; translations: { verse_number: number; translation_fr: string }[] }) => {
      const res = await fetch(`${API_URL}/xassidas/admin/import-translations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ translations: translations.map(t => ({ ...t, xassida_id: bookId })) }),
      });
      if (!res.ok) throw new Error('Erreur import traductions');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiqh-verses', selectedBook?.id] });
      setPdfExtracted([]); setView('chapters');
    },
  });

  const saveChaptersMutation = useMutation({
    mutationFn: async (chaptersJson: Record<string, ChapterMeta>) => {
      const res = await fetch(`${API_URL}/xassidas/${selectedBook!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ chapters_json: chaptersJson }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur sauvegarde'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiqh-books-admin'] });
    },
  });

  // Populate editableChapters from chapterGroups once loaded
  useEffect(() => {
    if (view !== 'chapters' || chapterGroups.length === 0) return;
    setEditableChapters(prev => {
      const next = { ...prev };
      chapterGroups.forEach(([num]) => {
        const key = String(num);
        if (!next[key]) next[key] = { name: `Chapitre ${num}`, icon: '📖', arabic: '' };
      });
      return next;
    });
  }, [chapterGroups, view]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openAddVerse = (chapterNumber: number) => {
    const chapterVerses = bookVerses.filter(v => v.chapter_number === chapterNumber);
    const nextVerse = chapterVerses.length > 0 ? Math.max(...chapterVerses.map(v => v.verse_number)) + 1 : 1;
    setEditingVerseId(null);
    setVerseForm({ ...BLANK_VERSE, chapter_number: chapterNumber, verse_number: nextVerse });
    setShowVerseModal(true);
  };

  const openEditVerse = (verse: VerseRow) => {
    setEditingVerseId(verse.id ?? null);
    setVerseForm({
      verse_number: verse.verse_number,
      chapter_number: verse.chapter_number ?? 1,
      text_arabic: verse.text_arabic ?? '',
      transcription: verse.transcription ?? '',
      translation_fr: verse.translation_fr ?? '',
      translation_wo: verse.translation_wo ?? '',
      audio_url: verse.audio_url ?? '',
    });
    setShowVerseModal(true);
  };

  const handleAudioUpload = async (file: File) => {
    if (!selectedBook) return;
    setIsAudioUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/xassidas/${selectedBook.id}/upload-audio`, {
        method: 'POST', headers: authHeaders, body: formData,
      });
      if (!res.ok) throw new Error('Erreur upload audio');
      const data = await res.json();
      setVerseForm(f => ({ ...f, audio_url: data.audioUrl }));
    } catch (e: any) { alert(e.message); }
    finally { setIsAudioUploading(false); }
  };

  const handlePdfUpload = async (file: File, type: 'arabic' | 'french') => {
    if (!selectedBook) return;
    setIsPdfLoading(true); setPdfFilename(file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/xassidas/${selectedBook.id}/upload-pdf`, {
        method: 'POST', headers: authHeaders, body: formData,
      });
      if (!res.ok) throw new Error('Erreur upload PDF');
      const data = await res.json();
      setPdfExtracted(data.verses || []);
      setView(type === 'arabic' ? 'pdf-arabic' : 'pdf-french');
    } catch (e: any) { alert(e.message); }
    finally { setIsPdfLoading(false); }
  };

  const handleJsonImport = async (file: File) => {
    if (!selectedBook) return;
    setIsJsonLoading(true);
    try {
      const text = await file.text();
      const parsed: VerseRow[] = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Le fichier doit contenir un tableau JSON');
      if (parsed.length === 0) throw new Error('Le fichier est vide');
      if (!parsed[0].verse_number) throw new Error('Chaque règle doit avoir un "verse_number"');
      await saveVersesBatch.mutateAsync({ bookId: selectedBook.id, verses: parsed });
    } catch (e: any) { alert(`Erreur: ${e.message}`); }
    finally { setIsJsonLoading(false); }
  };

  const toggleChapter = (chapterNum: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterNum)) next.delete(chapterNum);
      else next.add(chapterNum);
      return next;
    });
  };

  // ── PDF preview view ──────────────────────────────────────────────────────
  if (view === 'pdf-arabic' || view === 'pdf-french') {
    const isFrench = view === 'pdf-french';
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
            onClick={() => { setView('chapters'); setPdfExtracted([]); }}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{selectedBook?.title}</h2>
            <p className="text-xs text-muted-foreground">Aperçu PDF: {pdfFilename} — {pdfExtracted.length} règles extraites</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setPdfExtracted([]); setView('chapters'); }}>Annuler</Button>
          <Button size="sm"
            disabled={saveVersesBatch.isPending || importTranslationsMutation.isPending}
            onClick={() => {
              if (isFrench) {
                importTranslationsMutation.mutate({
                  bookId: selectedBook!.id,
                  translations: pdfExtracted.map((v, i) => ({
                    verse_number: v.verse_number || i + 1,
                    translation_fr: v.translation_fr || v.content || '',
                  })),
                });
              } else {
                saveVersesBatch.mutate({ bookId: selectedBook!.id, verses: pdfExtracted });
              }
            }}>
            {(saveVersesBatch.isPending || importTranslationsMutation.isPending)
              ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
              : <Save className="w-4 h-4 mr-1" />}
            {isFrench ? 'Importer traductions' : 'Sauvegarder les règles'}
          </Button>
        </div>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {pdfExtracted.map((verse, idx) => (
              <div key={idx} className="p-4 space-y-1.5">
                <Badge variant="outline" className="text-xs">
                  Règle {verse.verse_number || idx + 1}
                  {verse.chapter_number && verse.chapter_number > 1 ? ` · Chapitre ${verse.chapter_number}` : ''}
                </Badge>
                {verse.text_arabic && <p className="text-right font-arabic text-lg leading-loose">{verse.text_arabic}</p>}
                {verse.transcription && <p className="text-sm text-muted-foreground italic">{verse.transcription}</p>}
                {(verse.translation_fr || verse.content) && <p className="text-sm">« {verse.translation_fr || verse.content} »</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Chapters view ─────────────────────────────────────────────────────────
  if (view === 'chapters') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
            onClick={() => { setView('list'); setExpandedChapters(new Set()); }}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{selectedBook?.title}</h2>
            <p className="text-xs text-muted-foreground">
              {chapterGroups.length} chapitre{chapterGroups.length !== 1 ? 's' : ''} · {bookVerses.length} règles
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => openAddVerse(nextChapterNumber)}>
            <Plus className="w-4 h-4 mr-1.5" /> Nouveau chapitre
          </Button>
          <Button variant="outline" size="sm"
            onClick={() => downloadJson(JSON_TEMPLATE, 'modele-fiqh.json')}>
            <Download className="w-4 h-4 mr-1.5" /> Modèle JSON
          </Button>
          <label className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors cursor-pointer">
            {isJsonLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Importer JSON
            <input type="file" accept=".json,application/json" className="hidden" disabled={isJsonLoading}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleJsonImport(f); e.target.value = ''; }} />
          </label>
          <label className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors cursor-pointer">
            {isPdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            PDF Arabe
            <input type="file" accept="application/pdf" className="hidden" disabled={isPdfLoading}
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f, 'arabic'); e.target.value = ''; }} />
          </label>
          <label className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors cursor-pointer">
            {isPdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
            PDF Français
            <input type="file" accept="application/pdf" className="hidden" disabled={isPdfLoading}
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f, 'french'); e.target.value = ''; }} />
          </label>
        </div>

        {/* Chapter names editor */}
        {chapterGroups.length > 0 && (
          <Card>
            <CardHeader
              className="cursor-pointer select-none py-3 px-4"
              onClick={() => setShowChapterNamesPanel(p => !p)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-primary" />
                  <p className="font-semibold text-sm">Noms des chapitres</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showChapterNamesPanel ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
            <AnimatePresence initial={false}>
              {showChapterNamesPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <CardContent className="pt-0 space-y-3 px-4 pb-4">
                    <div className="border-t border-border pt-3 space-y-2">
                      {chapterGroups.map(([num]) => {
                        const key = String(num);
                        const ch = editableChapters[key] ?? { name: `Chapitre ${num}`, icon: '📖', arabic: '' };
                        return (
                          <div key={num} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-5 shrink-0 text-center">{num}</span>
                            <Input
                              className="w-14 text-center px-1"
                              placeholder="📖"
                              value={ch.icon}
                              onChange={e => setEditableChapters(p => ({ ...p, [key]: { ...ch, icon: e.target.value } }))}
                            />
                            <Input
                              placeholder={`Chapitre ${num}`}
                              value={ch.name}
                              onChange={e => setEditableChapters(p => ({ ...p, [key]: { ...ch, name: e.target.value } }))}
                              className="flex-1"
                            />
                            <Input
                              placeholder="اسم عربي"
                              value={ch.arabic}
                              onChange={e => setEditableChapters(p => ({ ...p, [key]: { ...ch, arabic: e.target.value } }))}
                              className="w-28 text-right font-arabic"
                              dir="rtl"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={saveChaptersMutation.isPending}
                      onClick={() => saveChaptersMutation.mutate(editableChapters)}
                    >
                      {saveChaptersMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        : <Save className="w-4 h-4 mr-1.5" />}
                      Sauvegarder les noms
                    </Button>
                    {saveChaptersMutation.isSuccess && (
                      <p className="text-xs text-green-600 text-center">✓ Noms sauvegardés</p>
                    )}
                    {saveChaptersMutation.isError && (
                      <p className="text-xs text-destructive text-center">{(saveChaptersMutation.error as Error).message}</p>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        {/* Chapter cards */}
        {versesLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : chapterGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 gap-4">
              <BookOpen className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground text-center">Aucune règle. Créez le premier chapitre.</p>
              <Button size="sm" onClick={() => openAddVerse(1)}>
                <Plus className="w-4 h-4 mr-1.5" /> Ajouter une règle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {chapterGroups.map(([chapterNum, verses]) => {
              const isExpanded = expandedChapters.has(chapterNum);
              return (
                <motion.div key={chapterNum} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    {/* Chapter header */}
                    <CardHeader
                      className="cursor-pointer select-none py-3 px-4"
                      onClick={() => toggleChapter(chapterNum)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{chapterNum}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">
                            {editableChapters[String(chapterNum)]?.icon && (
                              <span className="mr-1">{editableChapters[String(chapterNum)].icon}</span>
                            )}
                            {editableChapters[String(chapterNum)]?.name || `Chapitre ${chapterNum}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{verses.length} règle{verses.length !== 1 ? 's' : ''}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>

                    {/* Expanded verse list */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <CardContent className="pt-0 px-4 pb-4">
                            <div className="border-t border-border divide-y divide-border mb-3">
                              {verses.map((verse) => (
                                <div key={verse.id} className="py-3 space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <Badge variant="outline" className="text-xs shrink-0">
                                      Règle {verse.verse_number}
                                    </Badge>
                                    <div className="flex gap-1 ml-auto">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() => openEditVerse(verse)}
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        disabled={deleteVerseMutation.isPending}
                                        onClick={() => {
                                          if (verse.id && confirm(`Supprimer la règle ${verse.verse_number} ?`)) {
                                            deleteVerseMutation.mutate(verse.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  {verse.text_arabic && (
                                    <p className="text-right font-arabic text-xl leading-loose">{verse.text_arabic}</p>
                                  )}
                                  {verse.transcription && (
                                    <p className="text-sm text-muted-foreground italic">{verse.transcription}</p>
                                  )}
                                  {verse.translation_fr && (
                                    <p className="text-sm text-foreground">« {verse.translation_fr} »</p>
                                  )}
                                  {verse.translation_wo && (
                                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                                      {verse.translation_wo}
                                    </p>
                                  )}
                                  {verse.audio_url && (
                                    <audio controls src={verse.audio_url} className="w-full h-8 mt-1" />
                                  )}
                                </div>
                              ))}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => openAddVerse(chapterNum)}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1.5" /> Ajouter une règle au chapitre {chapterNum}
                            </Button>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add/Edit verse modal */}
        <Dialog open={showVerseModal} onOpenChange={open => { if (!open) { setShowVerseModal(false); setEditingVerseId(null); setVerseForm(BLANK_VERSE); } }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVerseId ? 'Modifier la règle' : 'Ajouter une règle'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Chapter + Verse number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Chapitre</label>
                  <Input type="number" min={1}
                    value={verseForm.chapter_number ?? 1}
                    onChange={e => setVerseForm(f => ({ ...f, chapter_number: parseInt(e.target.value) || 1 }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">N° Règle *</label>
                  <Input type="number" min={1}
                    value={verseForm.verse_number}
                    onChange={e => setVerseForm(f => ({ ...f, verse_number: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>

              {/* Arabic */}
              <div>
                <label className="text-sm font-medium mb-1 block">Texte arabe</label>
                <Textarea
                  placeholder="النص العربي..."
                  value={verseForm.text_arabic}
                  onChange={e => setVerseForm(f => ({ ...f, text_arabic: e.target.value }))}
                  className="text-right font-arabic text-xl leading-loose"
                  dir="rtl"
                  rows={3}
                />
              </div>

              {/* Transcription */}
              <div>
                <label className="text-sm font-medium mb-1 block">Translittération</label>
                <Input
                  placeholder="Lecture en lettres latines..."
                  value={verseForm.transcription}
                  onChange={e => setVerseForm(f => ({ ...f, transcription: e.target.value }))}
                />
              </div>

              {/* French */}
              <div>
                <label className="text-sm font-medium mb-1 block">Traduction française</label>
                <Textarea
                  placeholder="Traduction en français..."
                  value={verseForm.translation_fr}
                  onChange={e => setVerseForm(f => ({ ...f, translation_fr: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Wolof */}
              <div>
                <label className="text-sm font-medium mb-1 block">Traduction wolof</label>
                <Textarea
                  placeholder="Traduction en wolof..."
                  value={verseForm.translation_wo}
                  onChange={e => setVerseForm(f => ({ ...f, translation_wo: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Audio */}
              <div>
                <label className="text-sm font-medium mb-1 block">Audio</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="URL audio..."
                    value={verseForm.audio_url}
                    onChange={e => setVerseForm(f => ({ ...f, audio_url: e.target.value }))}
                    className="flex-1"
                  />
                  <label className="inline-flex items-center gap-1.5 h-10 px-3 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors cursor-pointer shrink-0">
                    {isAudioUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      disabled={isAudioUploading}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAudioUpload(f); e.target.value = ''; }}
                    />
                  </label>
                </div>
                {verseForm.audio_url && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <audio controls src={verseForm.audio_url} className="flex-1 h-8" />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground shrink-0"
                      onClick={() => setVerseForm(f => ({ ...f, audio_url: '' }))}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                disabled={!verseForm.verse_number || saveVerseMutation.isPending}
                onClick={() => saveVerseMutation.mutate(verseForm)}
              >
                {saveVerseMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  : <Save className="w-4 h-4 mr-1.5" />}
                {editingVerseId ? 'Enregistrer les modifications' : 'Ajouter la règle'}
              </Button>
              {saveVerseMutation.isError && (
                <p className="text-xs text-destructive text-center">{(saveVerseMutation.error as Error).message}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Books list view ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-foreground text-lg">Livres de Fiqh</h2>
          <p className="text-xs text-muted-foreground">{books.length} livre{books.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Créer un livre
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : books.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 gap-4">
            <BookOpen className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground text-center">Aucun livre. Créez Al-Akhdari pour commencer.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Créer un livre
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {books.map(book => (
            <motion.div key={book.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-base text-foreground">{book.title}</p>
                        <Badge variant="secondary" className="text-xs">Fiqh</Badge>
                      </div>
                      {book.arabic_name && <p className="font-arabic text-lg text-muted-foreground">{book.arabic_name}</p>}
                      {book.author_name && <p className="text-xs text-muted-foreground mt-0.5">par {book.author_name}</p>}
                      {book.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{book.description}</p>}
                    </div>
                    <Badge variant="outline">{book.actual_verse_count} règles</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm"
                    onClick={() => {
                      setSelectedBook(book);
                      setExpandedChapters(new Set());
                      setShowChapterNamesPanel(false);
                      const initial: Record<string, { name: string; icon: string; arabic: string }> = {};
                      if (book.chapters_json) {
                        Object.entries(book.chapters_json).forEach(([k, v]) => {
                          initial[k] = { name: v.name ?? '', icon: v.icon ?? '📖', arabic: v.arabic ?? '' };
                        });
                      }
                      setEditableChapters(initial);
                      setView('chapters');
                    }}>
                    <Eye className="w-4 h-4 mr-1.5" /> Gérer les chapitres
                  </Button>
                  <Button variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={deleteMutation.isPending}
                    onClick={() => { if (confirm(`Supprimer "${book.title}" et toutes ses règles ?`)) deleteMutation.mutate(book.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create book modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Créer un livre de Fiqh</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Titre (français) *</label>
              <Input placeholder="ex: Al-Akhdari" value={createForm.title}
                onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nom arabe</label>
              <Input placeholder="ex: مختصر الأخضري" value={createForm.arabic_name}
                onChange={e => setCreateForm(f => ({ ...f, arabic_name: e.target.value }))}
                className="text-right font-arabic" dir="rtl" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Auteur *</label>
              <Select value={createForm.author_id} onValueChange={v => setCreateForm(f => ({ ...f, author_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un auteur" /></SelectTrigger>
                <SelectContent>
                  {authors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea placeholder="Brève description..." value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <Button className="w-full" disabled={!createForm.title || !createForm.author_id || createMutation.isPending}
              onClick={() => createMutation.mutate(createForm)}>
              {createMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                : <Plus className="w-4 h-4 mr-1.5" />}
              Créer le livre
            </Button>
            {createMutation.isError && (
              <p className="text-xs text-destructive text-center">{(createMutation.error as Error).message}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FiqhAdminTab;
