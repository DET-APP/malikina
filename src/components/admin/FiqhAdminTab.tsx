import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Trash2, ChevronLeft, Save, Loader2, FileText, Languages, Eye, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL as API_URL } from '@/lib/apiUrl';

interface FiqhBook {
  id: string;
  title: string;
  arabic_name: string;
  description: string;
  actual_verse_count: number;
  author_id: string;
  author_name: string;
}

interface Author { id: string; name: string; }

interface VerseRow {
  id?: number;
  verse_number: number;
  chapter_number?: number;
  text_arabic?: string;
  transcription?: string;
  translation_fr?: string;
  content?: string;
}

type View = 'list' | 'verses' | 'pdf-arabic' | 'pdf-french';

const BLANK_VERSE: Omit<VerseRow, 'id'> = {
  verse_number: 1,
  chapter_number: 1,
  text_arabic: '',
  transcription: '',
  translation_fr: '',
};

// ── JSON template the user can fill and re-upload ─────────────────────────
const JSON_TEMPLATE: VerseRow[] = [
  { verse_number: 1, chapter_number: 1, text_arabic: 'النص العربي', transcription: 'Translittération latine', translation_fr: 'Traduction française' },
  { verse_number: 2, chapter_number: 1, text_arabic: 'النص العربي', transcription: 'Translittération latine', translation_fr: 'Traduction française' },
];

function downloadJson(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const VERSES_PER_PAGE = 20;

// ─────────────────────────────────────────────────────────────────────────────

const FiqhAdminTab = () => {
  const { token } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const queryClient = useQueryClient();

  const [view, setView] = useState<View>('list');
  const [selectedBook, setSelectedBook] = useState<FiqhBook | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddVerseModal, setShowAddVerseModal] = useState(false);
  const [newVerse, setNewVerse] = useState<Omit<VerseRow, 'id'>>(BLANK_VERSE);
  const [pdfExtracted, setPdfExtracted] = useState<VerseRow[]>([]);
  const [pdfFilename, setPdfFilename] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isJsonLoading, setIsJsonLoading] = useState(false);
  const [versePage, setVersePage] = useState(1);

  const [createForm, setCreateForm] = useState({ title: '', arabic_name: '', author_id: '', description: '' });

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
    enabled: !!selectedBook && view === 'verses',
  });

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

  // Add a single verse (append mode)
  const addVerseMutation = useMutation({
    mutationFn: async (verse: Omit<VerseRow, 'id'>) => {
      const res = await fetch(`${API_URL}/xassidas/${selectedBook!.id}/verses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ verses: [verse] }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiqh-verses', selectedBook?.id] });
      queryClient.invalidateQueries({ queryKey: ['fiqh-books-admin'] });
      setShowAddVerseModal(false);
      setNewVerse(BLANK_VERSE);
    },
  });

  // Save batch verses (PDF preview or JSON import)
  const saveVersesMutation = useMutation({
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
      setPdfExtracted([]); setView('verses');
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
      setPdfExtracted([]); setView('verses');
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
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
      if (!parsed[0].verse_number) throw new Error('Chaque vers doit avoir un "verse_number"');
      await saveVersesMutation.mutateAsync({ bookId: selectedBook.id, verses: parsed });
    } catch (e: any) { alert(`Erreur: ${e.message}`); }
    finally { setIsJsonLoading(false); }
  };

  const pagedVerses = useMemo(() => {
    const src = view === 'verses' ? bookVerses : pdfExtracted;
    const start = (versePage - 1) * VERSES_PER_PAGE;
    return src.slice(start, start + VERSES_PER_PAGE);
  }, [view, bookVerses, pdfExtracted, versePage]);

  const totalPages = Math.ceil((view === 'verses' ? bookVerses.length : pdfExtracted.length) / VERSES_PER_PAGE);

  // ── Verse list view ───────────────────────────────────────────────────────
  if (view === 'verses' || view === 'pdf-arabic' || view === 'pdf-french') {
    const isPdfPreview = view === 'pdf-arabic' || view === 'pdf-french';
    const isFrench = view === 'pdf-french';
    const sourceVerses = isPdfPreview ? pdfExtracted : bookVerses;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
            onClick={() => { setView('list'); setVersePage(1); setPdfExtracted([]); }}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{selectedBook?.title}</h2>
            <p className="text-xs text-muted-foreground">
              {isPdfPreview
                ? `Aperçu PDF: ${pdfFilename} — ${sourceVerses.length} vers extraits`
                : `${sourceVerses.length} vers enregistrés`}
            </p>
          </div>
        </div>

        {/* Actions bar */}
        {!isPdfPreview ? (
          <div className="flex flex-wrap gap-2">
            {/* Add single verse */}
            <Button size="sm" onClick={() => {
              const next = bookVerses.length > 0 ? Math.max(...bookVerses.map(v => v.verse_number)) + 1 : 1;
              setNewVerse({ ...BLANK_VERSE, verse_number: next });
              setShowAddVerseModal(true);
            }}>
              <Plus className="w-4 h-4 mr-1.5" /> Ajouter un vers
            </Button>

            {/* Download JSON template */}
            <Button variant="outline" size="sm"
              onClick={() => downloadJson(JSON_TEMPLATE, `modele-vers-fiqh.json`)}>
              <Download className="w-4 h-4 mr-1.5" /> Modèle JSON
            </Button>

            {/* Import JSON */}
            <label className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors cursor-pointer">
              {isJsonLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Importer JSON
              <input type="file" accept=".json,application/json" className="hidden" disabled={isJsonLoading}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleJsonImport(f); e.target.value = ''; }} />
            </label>

            {/* PDF Arabic */}
            <label className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors cursor-pointer">
              {isPdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              PDF Arabe
              <input type="file" accept="application/pdf" className="hidden" disabled={isPdfLoading}
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f, 'arabic'); e.target.value = ''; }} />
            </label>

            {/* PDF French */}
            <label className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent transition-colors cursor-pointer">
              {isPdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
              PDF Français
              <input type="file" accept="application/pdf" className="hidden" disabled={isPdfLoading}
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f, 'french'); e.target.value = ''; }} />
            </label>
          </div>
        ) : (
          /* PDF preview actions */
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setPdfExtracted([]); setView('verses'); }}>
              Annuler
            </Button>
            <Button size="sm"
              disabled={saveVersesMutation.isPending || importTranslationsMutation.isPending}
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
                  saveVersesMutation.mutate({ bookId: selectedBook!.id, verses: pdfExtracted });
                }
              }}>
              {(saveVersesMutation.isPending || importTranslationsMutation.isPending)
                ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                : <Save className="w-4 h-4 mr-1" />}
              {isFrench ? 'Importer traductions' : 'Sauvegarder les vers'}
            </Button>
          </div>
        )}

        {/* JSON format hint */}
        {!isPdfPreview && (
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-mono font-semibold mb-1">Format fichier JSON attendu :</p>
            <pre className="overflow-x-auto">{`[
  { "verse_number": 1, "chapter_number": 1, "text_arabic": "...", "transcription": "...", "translation_fr": "..." },
  { "verse_number": 2, "chapter_number": 1, ... }
]`}</pre>
            <p className="mt-1 opacity-70">Téléchargez le modèle JSON pour partir d'un fichier pré-rempli.</p>
          </div>
        )}

        {/* Verse list */}
        {view === 'verses' && versesLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {pagedVerses.map((verse, idx) => (
                <div key={verse.id ?? idx} className="p-4 space-y-1.5">
                  <Badge variant="outline" className="text-xs">
                    Vers {verse.verse_number || (versePage - 1) * VERSES_PER_PAGE + idx + 1}
                    {verse.chapter_number && verse.chapter_number > 1 ? ` · Chapitre ${verse.chapter_number}` : ''}
                  </Badge>
                  {verse.text_arabic && (
                    <p className="text-right font-arabic text-lg leading-loose">{verse.text_arabic}</p>
                  )}
                  {verse.transcription && (
                    <p className="text-sm text-muted-foreground italic">{verse.transcription}</p>
                  )}
                  {(verse.translation_fr || verse.content) && (
                    <p className="text-sm text-foreground">« {verse.translation_fr || verse.content} »</p>
                  )}
                </div>
              ))}
              {sourceVerses.length === 0 && (
                <div className="flex flex-col items-center py-12 gap-3">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Aucun vers. Ajoutez-en un ou importez un fichier JSON.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={versePage === 1} onClick={() => setVersePage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {versePage} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={versePage === totalPages} onClick={() => setVersePage(p => p + 1)}>
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </Button>
          </div>
        )}

        {/* Add single verse modal */}
        <Dialog open={showAddVerseModal} onOpenChange={setShowAddVerseModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajouter un vers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">N° du vers *</label>
                  <Input type="number" min={1} value={newVerse.verse_number}
                    onChange={e => setNewVerse(v => ({ ...v, verse_number: parseInt(e.target.value) || 1 }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">N° chapitre</label>
                  <Input type="number" min={1} value={newVerse.chapter_number ?? 1}
                    onChange={e => setNewVerse(v => ({ ...v, chapter_number: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Texte arabe</label>
                <Textarea placeholder="النص العربي..." value={newVerse.text_arabic}
                  onChange={e => setNewVerse(v => ({ ...v, text_arabic: e.target.value }))}
                  className="text-right font-arabic text-lg leading-loose" dir="rtl" rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Translittération</label>
                <Input placeholder="Lecture en lettres latines..." value={newVerse.transcription}
                  onChange={e => setNewVerse(v => ({ ...v, transcription: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Traduction française</label>
                <Textarea placeholder="Traduction en français..." value={newVerse.translation_fr}
                  onChange={e => setNewVerse(v => ({ ...v, translation_fr: e.target.value }))}
                  rows={2} />
              </div>
              <Button className="w-full" disabled={!newVerse.verse_number || addVerseMutation.isPending}
                onClick={() => addVerseMutation.mutate(newVerse)}>
                {addVerseMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  : <Plus className="w-4 h-4 mr-1.5" />}
                Enregistrer le vers
              </Button>
              {addVerseMutation.isError && (
                <p className="text-xs text-destructive text-center">{(addVerseMutation.error as Error).message}</p>
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
            <p className="text-sm text-muted-foreground text-center">Aucun livre. Créez Fakihatou Tullab pour commencer.</p>
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
                        <CardTitle className="text-base">{book.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs">Fiqh</Badge>
                      </div>
                      {book.arabic_name && <p className="font-arabic text-lg text-muted-foreground">{book.arabic_name}</p>}
                      {book.author_name && <p className="text-xs text-muted-foreground mt-0.5">par {book.author_name}</p>}
                      {book.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{book.description}</p>}
                    </div>
                    <Badge variant="outline">{book.actual_verse_count} vers</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm"
                    onClick={() => { setSelectedBook(book); setVersePage(1); setView('verses'); }}>
                    <Eye className="w-4 h-4 mr-1.5" /> Gérer les vers
                  </Button>
                  <Button variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={deleteMutation.isPending}
                    onClick={() => { if (confirm(`Supprimer "${book.title}" et tous ses vers ?`)) deleteMutation.mutate(book.id); }}>
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
              <Input placeholder="ex: Fakihatou Tullab" value={createForm.title}
                onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nom arabe</label>
              <Input placeholder="ex: فاكهة الطلاب" value={createForm.arabic_name}
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
