import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Upload, Trash2, ChevronLeft, Save, Loader2, FileText, Languages, Eye } from 'lucide-react';
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

interface Author {
  id: string;
  name: string;
}

interface ExtractedVerse {
  verse_number: number;
  chapter_number?: number;
  text_arabic?: string;
  transcription?: string;
  translation_fr?: string;
  content?: string;
}

type View = 'list' | 'verses' | 'pdf-arabic' | 'pdf-french';

const FiqhAdminTab = () => {
  const { authHeaders } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>('list');
  const [selectedBook, setSelectedBook] = useState<FiqhBook | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pdfExtracted, setPdfExtracted] = useState<ExtractedVerse[]>([]);
  const [pdfFilename, setPdfFilename] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [versePage, setVersePage] = useState(1);
  const VERSES_PER_PAGE = 20;

  const [createForm, setCreateForm] = useState({
    title: '',
    arabic_name: '',
    author_id: '',
    description: '',
  });

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
      if (!res.ok) throw new Error('Erreur chargement auteurs');
      return res.json();
    },
  });

  const { data: bookVerses = [], isLoading: versesLoading } = useQuery<ExtractedVerse[]>({
    queryKey: ['fiqh-verses', selectedBook?.id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/xassidas/${selectedBook!.id}/verses`, { headers: authHeaders });
      if (!res.ok) throw new Error('Erreur chargement vers');
      return res.json();
    },
    enabled: !!selectedBook && view === 'verses',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const res = await fetch(`${API_URL}/xassidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...data, is_fiqh: true, categorie: 'Fiqh' }),
      });
      if (!res.ok) throw new Error('Erreur création');
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
      const res = await fetch(`${API_URL}/xassidas/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Erreur suppression');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fiqh-books-admin'] }),
  });

  const saveVersesMutation = useMutation({
    mutationFn: async ({ bookId, verses }: { bookId: string; verses: ExtractedVerse[] }) => {
      const CHUNK = 50;
      for (let i = 0; i < verses.length; i += CHUNK) {
        const chunk = verses.slice(i, i + CHUNK);
        const res = await fetch(`${API_URL}/xassidas/${bookId}/verses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ verses: chunk, append: i > 0 }),
        });
        if (!res.ok) throw new Error(`Erreur sauvegarde chunk ${i}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiqh-books-admin'] });
      queryClient.invalidateQueries({ queryKey: ['fiqh-verses', selectedBook?.id] });
      setPdfExtracted([]);
      setView('verses');
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
      setPdfExtracted([]);
      setView('verses');
    },
  });

  const handlePdfUpload = async (file: File, type: 'arabic' | 'french') => {
    if (!selectedBook) return;
    setIsPdfLoading(true);
    setPdfFilename(file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/xassidas/${selectedBook.id}/upload-pdf`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });
      if (!res.ok) throw new Error('Erreur upload PDF');
      const data = await res.json();
      setPdfExtracted(data.verses || []);
      setView(type === 'arabic' ? 'pdf-arabic' : 'pdf-french');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const pagedVerses = useMemo(() => {
    const src = view === 'verses' ? bookVerses : pdfExtracted;
    const start = (versePage - 1) * VERSES_PER_PAGE;
    return src.slice(start, start + VERSES_PER_PAGE);
  }, [view, bookVerses, pdfExtracted, versePage]);

  const totalPages = Math.ceil((view === 'verses' ? bookVerses.length : pdfExtracted.length) / VERSES_PER_PAGE);

  // ── Verse list view (existing or PDF preview) ──────────────────────────
  if (view === 'verses' || view === 'pdf-arabic' || view === 'pdf-french') {
    const isPdfPreview = view === 'pdf-arabic' || view === 'pdf-french';
    const isFrench = view === 'pdf-french';
    const sourceVerses = isPdfPreview ? pdfExtracted : bookVerses;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setView('list'); setVersePage(1); }}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{selectedBook?.title}</h2>
            <p className="text-xs text-muted-foreground">
              {isPdfPreview
                ? `PDF extrait: ${pdfFilename} — ${sourceVerses.length} vers`
                : `${sourceVerses.length} vers enregistrés`}
            </p>
          </div>
          {isPdfPreview && (
            <Button
              size="sm"
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
              }}
            >
              {(saveVersesMutation.isPending || importTranslationsMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {isFrench ? 'Importer traductions' : 'Sauvegarder les vers'}
            </Button>
          )}
        </div>

        {/* Verse list */}
        {(view === 'verses' && versesLoading) ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {pagedVerses.map((verse, idx) => (
                <div key={idx} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Vers {verse.verse_number || (versePage - 1) * VERSES_PER_PAGE + idx + 1}
                      {verse.chapter_number ? ` · Ch. ${verse.chapter_number}` : ''}
                    </Badge>
                  </div>
                  {verse.text_arabic && (
                    <p className="text-right font-arabic text-base leading-loose">{verse.text_arabic}</p>
                  )}
                  {verse.transcription && (
                    <p className="text-sm text-muted-foreground italic">{verse.transcription}</p>
                  )}
                  {(verse.translation_fr || verse.content) && (
                    <p className="text-sm text-foreground">"{verse.translation_fr || verse.content}"</p>
                  )}
                </div>
              ))}
              {sourceVerses.length === 0 && (
                <p className="text-center text-muted-foreground py-12 text-sm">Aucun vers</p>
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
            <span className="text-sm text-muted-foreground">Page {versePage}/{totalPages}</span>
            <Button variant="outline" size="sm" disabled={versePage === totalPages} onClick={() => setVersePage(p => p + 1)}>
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Books list view ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-foreground text-lg">Livres de Fiqh</h2>
          <p className="text-xs text-muted-foreground">{books.length} livre{books.length !== 1 ? 's' : ''} enregistré{books.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Créer un livre
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : books.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <BookOpen className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm text-center">
              Aucun livre de Fiqh.<br />Créez Fakihatou Tullab pour commencer.
            </p>
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
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{book.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs">Fiqh</Badge>
                      </div>
                      {book.arabic_name && (
                        <p className="font-arabic text-lg text-muted-foreground">{book.arabic_name}</p>
                      )}
                      {book.author_name && (
                        <p className="text-xs text-muted-foreground mt-1">par {book.author_name}</p>
                      )}
                    </div>
                    <Badge variant="outline">{book.actual_verse_count} vers</Badge>
                  </div>
                  {book.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{book.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {/* View verses */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedBook(book); setVersePage(1); setView('verses'); }}
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> Voir les vers
                    </Button>

                    {/* Upload Arabic PDF */}
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild disabled={isPdfLoading}>
                        <span>
                          <FileText className="w-4 h-4 mr-1.5" />
                          {isPdfLoading && selectedBook?.id === book.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : 'PDF Arabe'}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) { setSelectedBook(book); handlePdfUpload(file, 'arabic'); }
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {/* Upload French PDF (translations) */}
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild disabled={isPdfLoading}>
                        <span>
                          <Languages className="w-4 h-4 mr-1.5" />
                          {isPdfLoading && selectedBook?.id === book.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : 'PDF Français'}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) { setSelectedBook(book); handlePdfUpload(file, 'french'); }
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Supprimer "${book.title}" et tous ses vers ?`)) {
                          deleteMutation.mutate(book.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Book Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un livre de Fiqh</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Titre (français)</label>
              <Input
                placeholder="ex: Fakihatou Tullab"
                value={createForm.title}
                onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nom arabe</label>
              <Input
                placeholder="ex: فاكهة الطلاب"
                value={createForm.arabic_name}
                onChange={e => setCreateForm(f => ({ ...f, arabic_name: e.target.value }))}
                className="text-right font-arabic"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Auteur</label>
              <Select value={createForm.author_id} onValueChange={v => setCreateForm(f => ({ ...f, author_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un auteur" />
                </SelectTrigger>
                <SelectContent>
                  {authors.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                placeholder="Brève description du livre..."
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              disabled={!createForm.title || !createForm.author_id || createMutation.isPending}
              onClick={() => createMutation.mutate(createForm)}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Plus className="w-4 h-4 mr-1.5" />
              )}
              Créer le livre
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FiqhAdminTab;
