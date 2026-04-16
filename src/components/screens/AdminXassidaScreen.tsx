import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Plus, Edit2, Trash2, Upload, Save, ChevronLeft, ChevronRight, Loader2, Lock, Users, BookOpen, FileText, Music, Link, Youtube, FolderOpen, Pencil, Globe, BarChart3, Settings, X, Search, LayoutDashboard, Filter, Eye } from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://165-245-211-201.sslip.io/api');
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
const ADMIN_SESSION_KEY = 'malikina-admin-unlocked';

interface Author {
  id: string;
  name: string;
  description?: string;
  photo_url?: string;
}

interface Verse {
  verse_number: number;
  chapter_number?: number;
  text_arabic: string;
  transcription?: string;
  translation_fr?: string;
  translation_en?: string;
}

interface Xassida {
  id: string;
  title: string;
  author_id: string;
  author_name?: string;
  description?: string;
  audio_url?: string;
  youtube_id?: string;
  verse_count: number;
  arabic_name?: string;
  categorie?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order_index?: number;
}

const VERSES_CHUNK_SIZE = 100;
const VERSES_PER_PAGE = 20;
const MIN_VERSE_FONT_SIZE = 24;
const MAX_VERSE_FONT_SIZE = 44;

const groupVersesByTwo = (verses: Verse[]): Verse[][] => {
  const grouped: Verse[][] = [];
  for (let index = 0; index < verses.length; index += 2) {
    grouped.push(verses.slice(index, index + 2));
  }
  return grouped;
};

export function XassidasAdmin() {
  const queryClient = useQueryClient();
  const [selectedXassida, setSelectedXassida] = useState<Xassida | null>(null);
  const [editorVerses, setEditorVerses] = useState<Verse[]>([]);
  const [currentVersePage, setCurrentVersePage] = useState(1);
  const [editorFontSize, setEditorFontSize] = useState(32);
  const [showAuthorDialog, setShowAuthorDialog] = useState(false);
  const [showXassidaDialog, setShowXassidaDialog] = useState(false);
  const [createNewAuthorMode, setCreateNewAuthorMode] = useState(false); // Toggle for new author mode
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });
  const arabicTextareaRefs = useRef<Map<number, HTMLTextAreaElement>>(new Map());

  const insertVerseMarker = (globalIdx: number) => {
    const ta = arabicTextareaRefs.current.get(globalIdx);
    if (!ta) return;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const newVal = ta.value.slice(0, start) + ' | ' + ta.value.slice(end);
    handleVerseFieldChange(globalIdx, 'text_arabic', newVal);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + 3;
      ta.focus();
    });
  };

  const [uploadingByXassida, setUploadingByXassida] = useState<Record<string, boolean>>({});
  const [loadingVersesByXassida, setLoadingVersesByXassida] = useState<Record<string, boolean>>({});
  const [uploadProgressByXassida, setUploadProgressByXassida] = useState<Record<string, number>>({});
  const [uploadErrorByXassida, setUploadErrorByXassida] = useState<Record<string, string>>({});
  const [newXassidaPdf, setNewXassidaPdf] = useState<File | null>(null);
  const [newXassidaPdfProgress, setNewXassidaPdfProgress] = useState(0);
  const [newXassidaPdfError, setNewXassidaPdfError] = useState('');
  const [chunkSaveProgress, setChunkSaveProgress] = useState<{
    current: number;
    total: number;
    label: 'creation' | 'manual';
  } | null>(null);

  // Translation import state
  const [showImportTranslateDialog, setShowImportTranslateDialog] = useState(false);
  const [translationJsonInput, setTranslationJsonInput] = useState('');
  const [importTranslateError, setImportTranslateError] = useState('');
  const [importTranslateSuccess, setImportTranslateSuccess] = useState('');

  // Per-xassida dialogs & states
  const [showPdfUploadDialog, setShowPdfUploadDialog] = useState<string | null>(null);
  const [showTranslationUploadDialog, setShowTranslationUploadDialog] = useState<string | null>(null);
  const [xassidaImportTranslations, setXassidaImportTranslations] = useState<Record<string, string>>({});
  const [xassidaImportErrors, setXassidaImportErrors] = useState<Record<string, string>>({});
  const [xassidaImportSuccess, setXassidaImportSuccess] = useState<Record<string, string>>({});

  // PDF extraction metadata
  const [extractedMetadata, setExtractedMetadata] = useState<{
    detected_author: string | null;
    detected_title: string | null;
    introduction: string | null;
    total_pages: number;
    total_lines: number;
  } | null>(null);

  // Categories management state
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const saveVersesInChunks = async (
      xassidaId: string,
      verses: any[],
      label: 'creation' | 'manual',
      replaceExisting = false
    ) => {
      if (!Array.isArray(verses) || verses.length === 0) return;

      const totalChunks = Math.ceil(verses.length / VERSES_CHUNK_SIZE);

      for (let i = 0; i < verses.length; i += VERSES_CHUNK_SIZE) {
        const chunkNumber = Math.floor(i / VERSES_CHUNK_SIZE) + 1;
        setChunkSaveProgress({ current: chunkNumber, total: totalChunks, label });

        const chunk = verses.slice(i, i + VERSES_CHUNK_SIZE);
        const response = await fetch(`${API_URL}/xassidas/${xassidaId}/verses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            verses: chunk,
            replaceExisting: replaceExisting && chunkNumber === 1,
          })
        });

        if (!response.ok) {
          let errorMessage = 'Impossible de sauvegarder les vers extraits';
          try {
            const payload = await response.json();
            errorMessage = payload?.error || errorMessage;
          } catch {
            // Keep default message
          }
          throw new Error(errorMessage);
        }
      }

      setChunkSaveProgress(null);
    };

  const [showEditXassidaDialog, setShowEditXassidaDialog] = useState(false);
  const [editingXassida, setEditingXassida] = useState<Xassida | null>(null);
  const [showEditAuthorDialog, setShowEditAuthorDialog] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [authorPhotoFile, setAuthorPhotoFile] = useState<File | null>(null);
  const [editAuthorPhotoFile, setEditAuthorPhotoFile] = useState<File | null>(null);

  const totalVersePages = Math.max(1, Math.ceil(editorVerses.length / VERSES_PER_PAGE));
  const verseStartIndex = (currentVersePage - 1) * VERSES_PER_PAGE;
  const paginatedVerses = useMemo(() => {
    return editorVerses.slice(verseStartIndex, verseStartIndex + VERSES_PER_PAGE);
  }, [editorVerses, verseStartIndex]);
  const groupedPaginatedVerses = useMemo(() => groupVersesByTwo(paginatedVerses), [paginatedVerses]);
  const visiblePageNumbers = useMemo(() => {
    if (totalVersePages <= 5) {
      return Array.from({ length: totalVersePages }, (_, index) => index + 1);
    }

    const start = Math.max(1, currentVersePage - 2);
    const end = Math.min(totalVersePages, start + 4);
    const adjustedStart = Math.max(1, end - 4);

    return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
  }, [currentVersePage, totalVersePages]);

  const handleVerseFieldChange = (index: number, field: keyof Verse, value: string | number) => {
    setEditorVerses((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const editXassidaForm = useForm({ defaultValues: { title: '', description: '', youtube_url: '', audio_url: '', arabic_name: '', categorie: 'Autre', transcription_fr: '', author_id: '' } });
  const editAuthorForm = useForm({ defaultValues: { name: '', description: '', photo_url: '', tradition: '' } });

  const updateAuthorMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string; tradition?: string }) => {
      const response = await fetch(`${API_URL}/authors/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, description: data.description, tradition: data.tradition })
      });
      if (!response.ok) throw new Error('Impossible de modifier l\'auteur');

      // Upload photo if a file was selected
      if (editAuthorPhotoFile) {
        const formData = new FormData();
        formData.append('photo', editAuthorPhotoFile);
        const uploadRes = await fetch(`${API_URL}/authors/${data.id}/upload-photo`, {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) {
          console.warn('Photo upload failed');
        }
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      setShowEditAuthorDialog(false);
      setEditingAuthor(null);
      setEditAuthorPhotoFile(null);
      editAuthorForm.reset();
    },
    onError: (error: any) => alert(`Erreur: ${error?.message}`)
  });

  const deleteAuthorMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/authors/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Impossible de supprimer l\'auteur');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      queryClient.invalidateQueries({ queryKey: ['xassidas'] });
    },
    onError: (error: any) => alert(`Erreur: ${error?.message}`)
  });

  const handleDeleteAuthor = async (author: Author) => {
    const confirmed = window.confirm(
      `Supprimer l'auteur "${author.name}" et toutes ses xassidas ? Cette action est irréversible.`
    );
    if (!confirmed) return;
    await deleteAuthorMutation.mutateAsync(author.id);
  };

  const openEditAuthorDialog = (author: Author) => {
    setEditingAuthor(author);
    setEditAuthorPhotoFile(null);
    editAuthorForm.reset({ name: (author as any).name || '', description: (author as any).description || '', photo_url: (author as any).photo_url || '', tradition: (author as any).tradition || '' });
    setShowEditAuthorDialog(true);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, isUnlocked ? 'true' : 'false');
  }, [isUnlocked]);

  useEffect(() => {
    if (currentVersePage > totalVersePages) {
      setCurrentVersePage(totalVersePages);
    }
  }, [currentVersePage, totalVersePages]);

  // Fetch authors
  const { data: authors = [] } = useQuery({
    queryKey: ['authors'],
    queryFn: () => fetch(`${API_URL}/authors`).then(r => r.json())
  });

  // Fetch xassidas
  const { data: xassidas = [] } = useQuery({
    queryKey: ['xassidas'],
    queryFn: () => fetch(`${API_URL}/xassidas`).then(r => r.json())
  });

  const filteredXassidas = useMemo(() => {
    let result = xassidas;
    if (filterCategory) {
      result = result.filter((x: Xassida) => (x.categorie || 'Autre') === filterCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((x: Xassida) =>
        (x.title || '').toLowerCase().includes(term) ||
        (x.author_name || '').toLowerCase().includes(term) ||
        (x.arabic_name || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [xassidas, searchTerm, filterCategory]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['xassida-categories'],
    queryFn: () => fetch(`${API_URL}/categories`).then(r => r.json()).catch(() => [])
  });

  // Create author
  const authorForm = useForm();
  const createAuthorMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_URL}/authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, description: data.description, tradition: data.tradition })
      });
      if (!response.ok) throw new Error('Impossible de créer l\'auteur');
      const author = await response.json();

      // Upload photo if a file was selected
      if (authorPhotoFile) {
        const formData = new FormData();
        formData.append('photo', authorPhotoFile);
        const uploadRes = await fetch(`${API_URL}/authors/${author.id}/upload-photo`, {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) {
          console.warn('Photo upload failed');
        }
      }

      return author;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      authorForm.reset();
      setAuthorPhotoFile(null);
      setShowAuthorDialog(false);
    }
  });

  // Create xassida (with optional author creation)
  const xassidaForm = useForm({
    defaultValues: {
      title: '',
      author_id: '',
      author_name: '',
      author_description: '',
      description: '',
      youtube_url: '',
      audio_url: '',
      arabic_name: '',
      categorie: 'Autre'
    }
  });

  const createXassidaMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        let authorId = data.author_id;
        
        // If creating new author, create it first
        if (createNewAuthorMode && data.author_name) {
          if (!data.author_name.trim()) {
            throw new Error('Le nom de l\'auteur est requis');
          }

          const authorResponse = await fetch(`${API_URL}/authors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.author_name.trim(),
              description: data.author_description?.trim() || ''
            })
          });

          if (!authorResponse.ok) {
            throw new Error(`Erreur lors de la création de l'auteur: ${authorResponse.statusText}`);
          }

          const authorData = await authorResponse.json();
          authorId = authorData.id;
          console.log('✅ Auteur créé:', authorData.name);
        } else if (!createNewAuthorMode && !authorId) {
          throw new Error('Veuillez sélectionner un auteur');
        }

        // Validate xassida title
        if (!data.title?.trim()) {
          throw new Error('Le titre de la xassida est requis');
        }

        // Create xassida with the author ID
        const xassidaResponse = await fetch(`${API_URL}/xassidas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title.trim(),
            author_id: authorId,
            description: data.description?.trim() || '',
            audio_url: data.audio_url?.trim() || '',
            arabic_name: data.arabic_name?.trim() || '',
            categorie: data.categorie || 'Autre'
          })
        });

        if (!xassidaResponse.ok) {
          throw new Error(`Erreur lors de la création de la xassida: ${xassidaResponse.statusText}`);
        }

        const xassidaData = await xassidaResponse.json();

        // Handle youtube_url if provided
        if (data.youtube_url && data.youtube_url.trim()) {
          try {
            const setYoutubeResponse = await fetch(`${API_URL}/xassidas/${xassidaData.id}/set-youtube-id`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ youtube_url: data.youtube_url.trim() })
            });

            if (!setYoutubeResponse.ok) {
              const payload = await setYoutubeResponse.json().catch(() => ({}));
              console.warn('Avertissement: Youtube ID n\'a pas pu être défini', payload.error);
              // Don't throw - the xassida was still created successfully
            } else {
              console.log('✅ YouTube ID défini avec succès');
            }
          } catch (error) {
            console.warn('Erreur lors de la définition du YouTube ID:', error);
          }
        }

        // Optional: upload PDF during xassida creation and auto-save extracted verses
        if (newXassidaPdf) {
          setNewXassidaPdfError('');
          setNewXassidaPdfProgress(0);

          const uploadData = await new Promise<any>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', newXassidaPdf);

            xhr.open('POST', `${API_URL}/xassidas/${xassidaData.id}/upload-pdf`);

            xhr.upload.onprogress = (event) => {
              if (!event.lengthComputable) return;
              const percent = Math.round((event.loaded / event.total) * 100);
              setNewXassidaPdfProgress(percent);
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  resolve(JSON.parse(xhr.responseText));
                } catch {
                  reject(new Error('Réponse invalide après upload PDF'));
                }
                return;
              }
              reject(new Error(`Upload PDF échoué (${xhr.status})`));
            };

            xhr.onerror = () => reject(new Error('Erreur réseau pendant l\'upload PDF'));
            xhr.send(formData);
          });

          const extractedVerses = Array.isArray(uploadData?.verses) ? uploadData.verses : [];

          if (extractedVerses.length > 0) {
            await saveVersesInChunks(xassidaData.id, extractedVerses, 'creation');
          }

          setNewXassidaPdfProgress(100);
        }

        console.log('✅ Xassida créée:', xassidaData.title);
        return xassidaData;
      } catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ Succès! Xassida ajoutée:', data);
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      queryClient.invalidateQueries({ queryKey: ['xassidas'] });
      xassidaForm.reset({
        title: '',
        author_id: '',
        author_name: '',
        author_description: '',
        description: '',
        youtube_url: '',
        audio_url: '',
        arabic_name: '',
        categorie: 'Autre'
      });
      setNewXassidaPdf(null);
      setNewXassidaPdfProgress(0);
      setNewXassidaPdfError('');
      setChunkSaveProgress(null);
      setShowXassidaDialog(false);
      setCreateNewAuthorMode(false);
    },
    onError: (error: any) => {
      console.error('❌ Erreur mutation:', error.message || error);
      setNewXassidaPdfError(error?.message || 'Erreur pendant création + import PDF');
      setChunkSaveProgress(null);
      alert('Erreur: ' + (error.message || 'Impossible de créer la xassida'));
    }
  });

  // Save verses
  const saveVersesMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedXassida?.id) {
        throw new Error('Aucune xassida sélectionnée');
      }

      try {
        await saveVersesInChunks(selectedXassida.id, data?.verses || [], 'manual', true);
        return { message: 'Verses saved' };
      } finally {
        setChunkSaveProgress(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassidas'] });
      setEditorVerses([]);
      setCurrentVersePage(1);
      setSelectedXassida(null);
    }
  });

  const updateXassidaMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description?: string; youtube_url?: string; audio_url?: string; arabic_name?: string; categorie?: string; author_id?: string }) => {
      // First, update the xassida basic info
      const response = await fetch(`${API_URL}/xassidas/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || '',
          audio_url: data.audio_url || '',
          arabic_name: data.arabic_name || '',
          categorie: data.categorie || 'Autre',
          ...(data.author_id && { author_id: data.author_id })
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Impossible de modifier la xassida');
      }

      const xassidaData = await response.json();

      // If youtube_url is provided, also set it
      if (data.youtube_url && data.youtube_url.trim()) {
        const setYoutubeResponse = await fetch(`${API_URL}/xassidas/${data.id}/set-youtube-id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtube_url: data.youtube_url.trim() })
        });

        if (!setYoutubeResponse.ok) {
          const payload = await setYoutubeResponse.json().catch(() => ({}));
          console.warn('Avertissement: Youtube ID n\'a pas pu être défini', payload.error);
          // Don't throw - the xassida was still updated successfully
        }
      }

      return xassidaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassidas'] });
      setShowEditXassidaDialog(false);
      setEditingXassida(null);
      editXassidaForm.reset({ title: '', description: '', youtube_url: '', audio_url: '', arabic_name: '', categorie: 'Autre' });
    },
    onError: (error: any) => {
      alert(`Erreur modification: ${error?.message || 'Impossible de modifier la xassida'}`);
    }
  });

  const deleteXassidaMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/xassidas/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Impossible de supprimer la xassida');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassidas'] });
      if (selectedXassida) {
        setSelectedXassida(null);
        setEditorVerses([]);
        setCurrentVersePage(1);
      }
    },
    onError: (error: any) => {
      alert(`Erreur suppression: ${error?.message || 'Impossible de supprimer la xassida'}`);
    }
  });

  const importTranslationsMutation = useMutation({
    mutationFn: async (translations: any[]) => {
      const response = await fetch(`${API_URL}/xassidas/admin/import-translations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(translations)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Erreur lors de l\'import des traductions');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setImportTranslateSuccess(`✅ ${data.successCount} traductions importées ${data.errorCount > 0 ? `(${data.errorCount} erreurs)` : ''}`);
      setTranslationJsonInput('');
      queryClient.invalidateQueries({ queryKey: ['xassidas'] });
      setTimeout(() => {
        setImportTranslateSuccess('');
      }, 5000);
    },
    onError: (error: any) => {
      setImportTranslateError(error?.message || 'Erreur lors de l\'import');
    }
  });

  const importXassidaTranslationsMutation = useMutation({
    mutationFn: async ({ xassidaId, translations }: { xassidaId: string; translations: any[] }) => {
      const payload = {
        xassida_id: xassidaId,
        translations: translations
      };
      
      const response = await fetch(`${API_URL}/xassidas/admin/import-translations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur lors de l\'import des traductions');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      setXassidaImportSuccess((prev) => ({
        ...prev,
        [variables.xassidaId]: `✅ ${data.updated}/${data.total} traductions importées`
      }));
      setXassidaImportTranslations((prev) => ({
        ...prev,
        [variables.xassidaId]: ''
      }));
      queryClient.invalidateQueries({ queryKey: ['xassidas'] });
      setTimeout(() => {
        setXassidaImportSuccess((prev) => ({
          ...prev,
          [variables.xassidaId]: ''
        }));
      }, 5000);
    },
    onError: (error: any, variables) => {
      setXassidaImportErrors((prev) => ({
        ...prev,
        [variables.xassidaId]: error?.message || 'Erreur lors de l\'import'
      }));
    }
  });

  // Categories CRUD mutations
  const createCategoryForm = useForm({ defaultValues: { name: '', description: '', color: '#666666' } });
  const editCategoryForm = useForm({ defaultValues: { name: '', description: '', color: '#666666' } });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string }) => {
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Impossible de créer la catégorie');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassida-categories'] });
      createCategoryForm.reset();
      setShowCategoryDialog(false);
    },
    onError: (error: any) => {
      alert(`Erreur: ${error?.message || 'Impossible de créer la catégorie'}`);
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; name?: string; description?: string; color?: string }) => {
      const response = await fetch(`${API_URL}/categories/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, description: data.description, color: data.color })
      });
      if (!response.ok) throw new Error('Impossible de modifier la catégorie');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassida-categories'] });
      editCategoryForm.reset();
      setShowEditCategoryDialog(false);
      setEditingCategory(null);
    },
    onError: (error: any) => {
      alert(`Erreur: ${error?.message || 'Impossible de modifier la catégorie'}`);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Impossible de supprimer la catégorie');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassida-categories'] });
    },
    onError: (error: any) => {
      alert(`Erreur: ${error?.message || 'Impossible de supprimer la catégorie'}`);
    }
  });

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    editCategoryForm.reset({
      name: category.name,
      description: category.description || '',
      color: category.color || '#666666'
    });
    setShowEditCategoryDialog(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    const confirmed = window.confirm(`Supprimer la catégorie "${category.name}" ? Cette action est irréversible.`);
    if (!confirmed) return;
    await deleteCategoryMutation.mutateAsync(category.id);
  };

  const openEditDialog = (xassida: Xassida) => {
    setEditingXassida(xassida);
    editXassidaForm.reset({
      title: xassida.title || '',
      description: xassida.description || '',
      youtube_url: xassida.youtube_id ? `https://www.youtube.com/watch?v=${xassida.youtube_id}` : '',
      audio_url: xassida.audio_url || '',
      arabic_name: xassida.arabic_name || '',
      categorie: xassida.categorie || 'Autre',
      author_id: xassida.author_id || ''
    });
    setShowEditXassidaDialog(true);
  };

  const handleDeleteXassida = async (xassida: Xassida) => {
    const confirmed = window.confirm(`Supprimer la xassida "${xassida.title}" ? Cette action est irréversible.`);
    if (!confirmed) return;
    await deleteXassidaMutation.mutateAsync(xassida.id);
  };

  // Handle PDF upload with progress
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, xassidaId: string) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploadErrorByXassida(prev => ({ ...prev, [xassidaId]: '' }));
    setUploadProgressByXassida(prev => ({ ...prev, [xassidaId]: 0 }));
    setUploadingByXassida(prev => ({ ...prev, [xassidaId]: true }));

    try {
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/xassidas/${xassidaId}/upload-pdf`);

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgressByXassida(prev => ({ ...prev, [xassidaId]: percent }));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('Réponse serveur invalide après upload PDF'));
            }
            return;
          }
          reject(new Error(`Upload échoué (${xhr.status})`));
        };

        xhr.onerror = () => reject(new Error('Erreur réseau pendant l\'upload PDF'));
        xhr.send(formData);
      });

      setSelectedXassida(xassidas.find((x: Xassida) => x.id === xassidaId) || null);
      const extractedVerses = Array.isArray(data?.verses) ? data.verses : [];
      setEditorVerses(extractedVerses);
      setCurrentVersePage(1);
      // Save extraction metadata
      if (data?.metadata) {
        setExtractedMetadata(data.metadata);
      }
      // Close PDF dialog and show editor
      setShowPdfUploadDialog(null);
    } catch (error) {
      console.error('PDF upload error:', error);
      setUploadErrorByXassida(prev => ({
        ...prev,
        [xassidaId]: error instanceof Error ? error.message : 'Erreur inconnue pendant upload'
      }));
    } finally {
      setUploadingByXassida(prev => ({ ...prev, [xassidaId]: false }));
      setUploadProgressByXassida(prev => ({ ...prev, [xassidaId]: 100 }));
      e.target.value = '';
    }
  };

  const loadExistingVerses = async (xassidaId: string) => {
    setLoadingVersesByXassida((prev) => ({ ...prev, [xassidaId]: true }));
    setUploadErrorByXassida((prev) => ({ ...prev, [xassidaId]: '' }));

    try {
      const response = await fetch(`${API_URL}/xassidas/${xassidaId}/verses`);
      if (!response.ok) {
        throw new Error(`Impossible de charger les vers (${response.status})`);
      }

      const data = await response.json();
      const verses = Array.isArray(data) ? data : [];
      setSelectedXassida(xassidas.find((item: Xassida) => item.id === xassidaId) || null);
      setEditorVerses(verses);
      setCurrentVersePage(1);
      setExtractedMetadata(null);
    } catch (error) {
      setUploadErrorByXassida((prev) => ({
        ...prev,
        [xassidaId]: error instanceof Error ? error.message : 'Erreur inconnue pendant le chargement',
      }));
    } finally {
      setLoadingVersesByXassida((prev) => ({ ...prev, [xassidaId]: false }));
    }
  };

  const totalVerses = xassidas.reduce((sum: number, x: Xassida) => sum + (Number(x.verse_count) || 0), 0);

  const handleUnlockAdmin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsUnlocked(true);
      setAuthError('');
      setPasswordInput('');
      return;
    }
    setAuthError('Mot de passe incorrect');
  };

  const handleLockAdmin = () => {
    setIsUnlocked(false);
    setAuthError('');
    setPasswordInput('');
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-gradient-to-br from-primary to-green-dark pt-16 pb-20 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Administration</h1>
          <p className="text-sm text-white/70 mt-2">Gestion des Xassidas</p>
        </div>

        <div className="flex-1 flex items-start justify-center px-6 -mt-10">
          <Card className="w-full max-w-md shadow-card">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Accès protégé</CardTitle>
              <CardDescription>Entrez le mot de passe pour continuer</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUnlockAdmin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mot de passe</label>
                  <Input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="h-11"
                  />
                </div>
                {authError && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-lg text-sm text-center">
                    {authError}
                  </div>
                )}
                <Button type="submit" className="w-full h-11">
                  <Lock className="w-4 h-4 mr-2" />
                  Déverrouiller
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Hidden when editing verses for focus */}
      {!selectedXassida && (
        <div className="bg-gradient-to-br from-primary to-green-dark pt-12 px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="flex items-start justify-between relative mb-5">
            <div>
              <h1 className="text-2xl font-bold text-white">Administration</h1>
              <p className="text-sm text-white/70 mt-1">Gérez votre contenu islamique</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLockAdmin} className="text-white/80 hover:text-white hover:bg-white/10">
              <Lock className="w-4 h-4 mr-1.5" />
              Verrouiller
            </Button>
          </div>
          {/* Tab navigation intégrée dans le header */}
          <div className="flex gap-1 relative">
            {[
              { value: 'dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Stats' },
              { value: 'xassidas',  icon: <BookOpen className="w-4 h-4" />,        label: 'Xassidas' },
              { value: 'authors',   icon: <Users className="w-4 h-4" />,           label: 'Auteurs' },
              { value: 'categories',icon: <FolderOpen className="w-4 h-4" />,      label: 'Catégories' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors",
                  activeTab === tab.value
                    ? "bg-background text-foreground"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={cn("px-5 space-y-6", !selectedXassida ? "mt-6" : "mt-6")}>
        {selectedXassida && editorVerses.length > 0 ? (
          /* ── Dedicated Verse Editor Panel ──────────────────────────────────── */
          <Card className="shadow-card border-primary/30" id="verse-editor">
            <CardHeader className="pb-3 border-b mb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        setSelectedXassida(null);
                        setEditorVerses([]);
                        setCurrentVersePage(1);
                        setExtractedMetadata(null);
                      }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <CardTitle className="text-lg">
                      Éditeur de vers — {selectedXassida.title}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    {editorVerses.length} vers au total · Page {currentVersePage} sur {totalVersePages}
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => saveVersesMutation.mutate({ verses: editorVerses })}
                    disabled={saveVersesMutation.isPending}
                    className="shadow-sm"
                  >
                    {saveVersesMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              </div>

              {/* Chunk save progress */}
              {chunkSaveProgress && (
                <div className="mt-3 space-y-1">
                  <div className="w-full h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(chunkSaveProgress.current / chunkSaveProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sauvegarde en cours : lot {chunkSaveProgress.current}/{chunkSaveProgress.total}
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Extracted metadata banner */}
              {extractedMetadata && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Résultat de l'extraction PDF
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Pages : <span className="font-medium text-foreground">{extractedMetadata.total_pages}</span></div>
                    <div>Lignes : <span className="font-medium text-foreground">{extractedMetadata.total_lines}</span></div>
                  </div>
                  {extractedMetadata.detected_author && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Auteur détecté : </span>
                      <span className="font-arabic font-medium text-primary">{extractedMetadata.detected_author}</span>
                    </div>
                  )}
                  {extractedMetadata.detected_title && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Titre détecté : </span>
                      <span className="font-arabic font-medium text-foreground">{extractedMetadata.detected_title}</span>
                    </div>
                  )}
                  {extractedMetadata.introduction && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Introduction détectée :</p>
                      <div className="bg-card border border-border/50 rounded-lg p-3 text-sm font-arabic text-right leading-relaxed max-h-32 overflow-y-auto">
                        {extractedMetadata.introduction}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Editor Controls */}
              <div className="flex items-center justify-between gap-3 flex-wrap bg-muted/30 p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-background rounded-md border px-2 py-1 shadow-sm">
                    <button
                      onClick={() => setEditorFontSize((f) => Math.max(MIN_VERSE_FONT_SIZE, f - 2))}
                      className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                    ><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-xs font-bold w-10 text-center tabular-nums">{editorFontSize}px</span>
                    <button
                      onClick={() => setEditorFontSize((f) => Math.min(MAX_VERSE_FONT_SIZE, f + 2))}
                      className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                    ><ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background shadow-sm"
                    onClick={() => {
                      setEditorVerses((prev) => [
                        ...prev,
                        { verse_number: prev.length + 1, text_arabic: '', transcription: '', translation_fr: '' }
                      ]);
                      const newTotal = Math.ceil((editorVerses.length + 1) / VERSES_PER_PAGE);
                      setCurrentVersePage(newTotal);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Nouveau vers
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                   <p className="text-sm font-medium text-muted-foreground">{editorVerses.length} vers au total</p>
                </div>
              </div>

              {/* Verse list (paginated) */}
              <div className="space-y-4">
                {paginatedVerses.map((verse, pageIdx) => {
                  const globalIdx = verseStartIndex + pageIdx;
                  return (
                    <div
                      key={globalIdx}
                      className="border border-border/60 rounded-xl p-5 bg-card shadow-sm space-y-4 relative group hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold border border-primary/20">
                            {verse.verse_number}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                            Chapitre {verse.chapter_number ?? 1}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (window.confirm('Supprimer ce vers ?')) {
                              setEditorVerses((prev) => {
                                const next = prev.filter((_, i) => i !== globalIdx);
                                return next.map((v, i) => ({ ...v, verse_number: i + 1 }));
                              });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between ml-1">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Texte Arabe</label>
                            <button
                              type="button"
                              onClick={() => insertVerseMarker(globalIdx)}
                              title="Insérer un séparateur de verset à la position du curseur"
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 transition-colors select-none"
                            >
                              <span className="text-base leading-none">❙</span> Marquer
                            </button>
                          </div>
                          <Textarea
                            ref={(el) => {
                              if (el) arabicTextareaRefs.current.set(globalIdx, el);
                              else arabicTextareaRefs.current.delete(globalIdx);
                            }}
                            value={verse.text_arabic}
                            onChange={(e) => handleVerseFieldChange(globalIdx, 'text_arabic', e.target.value)}
                            className="font-arabic text-right leading-loose min-h-[100px] resize-y text-2xl p-4 bg-muted/10 focus:bg-background transition-colors"
                            style={{ fontSize: `${editorFontSize}px` }}
                            dir="rtl"
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Transcription</label>
                            <Input
                              value={verse.transcription || ''}
                              onChange={(e) => handleVerseFieldChange(globalIdx, 'transcription', e.target.value)}
                              placeholder="Phonétique..."
                              className="bg-muted/10 focus:bg-background transition-colors"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Traduction Française</label>
                            <Textarea
                              value={verse.translation_fr || ''}
                              onChange={(e) => handleVerseFieldChange(globalIdx, 'translation_fr', e.target.value)}
                              placeholder="Traduction..."
                              rows={2}
                              className="bg-muted/10 focus:bg-background transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalVersePages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentVersePage((p) => Math.max(1, p - 1))}
                    disabled={currentVersePage === 1}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {visiblePageNumbers.map((p) => (
                      <Button
                        key={p}
                        variant={currentVersePage === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentVersePage(p)}
                        className={cn("h-9 w-9 p-0 font-medium", currentVersePage === p && "shadow-sm")}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentVersePage((p) => Math.min(totalVersePages, p + 1))}
                    disabled={currentVersePage === totalVersePages}
                    className="h-9 w-9"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* ── Main Tabbed Interface ──────────────────────────────────── */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            {/* Tab 1: Dashboard */}
            <TabsContent value="dashboard" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="shadow-card border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Auteurs</p>
                        <p className="text-3xl font-bold mt-1">{authors.length}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-l-4 border-l-secondary">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Xassidas</p>
                        <p className="text-3xl font-bold mt-1">{xassidas.length}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-l-4 border-l-primary/60">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Versets</p>
                        <p className="text-3xl font-bold mt-1">{totalVerses}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-base">Actions rapides</CardTitle>
                    <CardDescription>Outils d'administration global</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setActiveTab('xassidas')}>
                      <Plus className="w-5 h-5" />
                      <span>Ajouter Xassida</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setShowAuthorDialog(true)}>
                      <Users className="w-5 h-5" />
                      <span>Nouvel Auteur</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setShowCategoryDialog(true)}>
                      <FolderOpen className="w-5 h-5" />
                      <span>Catégorie</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setShowImportTranslateDialog(true)}>
                      <Globe className="w-5 h-5" />
                      <span>Traductions</span>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                   <CardHeader>
                      <CardTitle className="text-base">État du contenu</CardTitle>
                      <CardDescription>Vue d'ensemble de la base</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b">
                         <span className="text-sm">Auteurs avec photos</span>
                         <span className="text-sm font-bold">{authors.filter((a: any) => !!a.photo_url).length} / {authors.length}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                         <span className="text-sm">Xassidas avec audio</span>
                         <span className="text-sm font-bold">{xassidas.filter((x: any) => !!x.audio_url || !!x.youtube_id).length} / {xassidas.length}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                         <span className="text-sm">Catégories actives</span>
                         <span className="text-sm font-bold">{categories.length}</span>
                      </div>
                   </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 2: Xassidas */}
            <TabsContent value="xassidas" className="space-y-4 mt-0">
              <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border shadow-sm">
                {/* Search + New button */}
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par titre, auteur..."
                      className="pl-10 bg-muted/20 border-none focus-visible:ring-1"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                  <Dialog open={showXassidaDialog} onOpenChange={setShowXassidaDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex-1 sm:flex-none">
                        <Plus className="w-4 h-4 mr-2" /> 
                        Nouvelle Xassida
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Créer une xassida</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={xassidaForm.handleSubmit((data) => createXassidaMutation.mutate(data))} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Titre de la xassida *</label>
                          <Input {...xassidaForm.register('title', { required: 'Titre requis' })} placeholder="Ex: Abāda..." />
                        </div>
                        
                        <div className="border rounded-lg p-3 space-y-3 bg-muted/10">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Auteur</label>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs h-7 text-primary"
                              onClick={() => setCreateNewAuthorMode(!createNewAuthorMode)}
                            >
                              {createNewAuthorMode ? "Utiliser existant" : "Nouvel auteur"}
                            </Button>
                          </div>
                          
                          {createNewAuthorMode ? (
                            <div className="space-y-3 pt-1">
                              <Input {...xassidaForm.register('author_name', { required: createNewAuthorMode })} placeholder="Nom du nouvel auteur" />
                              <Textarea {...xassidaForm.register('author_description')} placeholder="Bio courte..." rows={2} />
                            </div>
                          ) : (
                            <Select
                              value={xassidaForm.watch('author_id') || ''}
                              onValueChange={(val) => xassidaForm.setValue('author_id', val)}
                            >
                              <SelectTrigger className="bg-background"><SelectValue placeholder="Choisir un auteur" /></SelectTrigger>
                              <SelectContent>
                                {authors.map((a: Author) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Catégorie</label>
                            <Select value={xassidaForm.watch('categorie') || 'Autre'} onValueChange={(val) => xassidaForm.setValue('categorie', val)}>
                              <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                              <SelectContent>
                                {categories.map((cat: Category) => <SelectItem key={cat.id || cat.name} value={cat.name}>{cat.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Nom Arabe</label>
                            <Input {...xassidaForm.register('arabic_name')} placeholder="أَبَادَا" className="font-arabic text-right" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Audio / YouTube</label>
                          <Input {...xassidaForm.register('youtube_url')} placeholder="URL YouTube..." className="mb-2" />
                          <Input {...xassidaForm.register('audio_url')} placeholder="URL Audio MP3..." />
                        </div>

                        <div className="border-t pt-4 space-y-2">
                          <label className="text-sm font-medium">Import PDF (Optionnel)</label>
                          <Input type="file" accept=".pdf" onChange={(e) => setNewXassidaPdf(e.target.files?.[0] || null)} />
                          {newXassidaPdf && <p className="text-xs font-medium text-primary">✓ {newXassidaPdf.name}</p>}
                        </div>

                        <Button type="submit" className="w-full h-11" disabled={createXassidaMutation.isPending}>
                          {createXassidaMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Traitement...</> : 'Créer la xassida'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Category filter pills */}
              {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-0.5 flex-wrap">
                  <button
                    onClick={() => setFilterCategory('')}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-colors flex-shrink-0",
                      filterCategory === ''
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    Toutes ({xassidas.length})
                  </button>
                  {categories.map((cat: Category) => {
                    const count = xassidas.filter((x: Xassida) => (x.categorie || 'Autre') === cat.name).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFilterCategory(filterCategory === cat.name ? '' : cat.name)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium border transition-colors flex-shrink-0",
                          filterCategory === cat.name
                            ? "text-white border-transparent"
                            : "bg-muted/30 text-muted-foreground border-border hover:bg-muted"
                        )}
                        style={filterCategory === cat.name ? { backgroundColor: cat.color || '#666' } : {}}
                      >
                        {cat.name} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
              </div>

              <Card className="shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[300px]">Xassida</TableHead>
                        <TableHead>Auteur</TableHead>
                        <TableHead className="hidden md:table-cell">Vers</TableHead>
                        <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredXassidas.map((x: Xassida) => (
                        <TableRow key={x.id} className="group hover:bg-muted/10">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{x.title}</span>
                              {x.arabic_name && <span className="text-xs font-arabic text-primary mt-0.5">{x.arabic_name}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{x.author_name}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary" className="font-mono text-[10px]">{x.verse_count || 0}</Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {x.categorie && <Badge variant="outline" className="text-[10px] bg-muted/20">{x.categorie}</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => loadExistingVerses(x.id)}
                                title="Éditer les vers"
                              >
                                <BookOpen className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => openEditDialog(x)}
                                title="Modifier métadonnées"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>

                              <Dialog open={showPdfUploadDialog === x.id} onOpenChange={(open) => setShowPdfUploadDialog(open ? x.id : null)}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Importer PDF">
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle>Importer PDF - {x.title}</DialogTitle></DialogHeader>
                                  <div className="space-y-4 pt-2">
                                    <Input type="file" accept=".pdf" onChange={(e) => handlePdfUpload(e, x.id)} disabled={uploadingByXassida[x.id]} />
                                    {uploadingByXassida[x.id] && (
                                      <div className="space-y-1">
                                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                          <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgressByXassida[x.id] || 0}%` }} />
                                        </div>
                                        <p className="text-[10px] text-center text-muted-foreground">{uploadProgressByXassida[x.id]}%</p>
                                      </div>
                                    )}
                                    {uploadErrorByXassida[x.id] && <p className="text-xs text-destructive">{uploadErrorByXassida[x.id]}</p>}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <div className="w-px h-5 bg-border mx-0.5" />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteXassida(x)}
                                title="Supprimer la xassida"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredXassidas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            Aucune xassida trouvée
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* Tab 3: Authors */}
            <TabsContent value="authors" className="space-y-4 mt-0">
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Liste des Auteurs</h2>
                  <Button size="sm" onClick={() => setShowAuthorDialog(true)}><Plus className="w-4 h-4 mr-2" /> Nouvel auteur</Button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {authors.map((author: Author) => (
                    <Card key={author.id} className="group hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            {author.photo_url ? (
                              <img src={author.photo_url} alt={author.name} className="w-16 h-16 object-cover rounded-xl shadow-sm" />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <span className="text-xl font-bold text-primary">{author.name[0]}</span>
                              </div>
                            )}
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="absolute -bottom-2 -right-2 h-7 w-7 p-0 rounded-full shadow-md"
                              onClick={() => openEditAuthorDialog(author)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold truncate">{author.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{(author as any).description || 'Aucune description'}</p>
                            <div className="flex items-center gap-2 mt-2">
                               <Badge variant="outline" className="text-[10px] bg-primary/5">{(author as any).tradition || 'Tidjane'}</Badge>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteAuthor(author)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </TabsContent>

            {/* Tab 4: Categories */}
            <TabsContent value="categories" className="space-y-4 mt-0">
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Catégories</h2>
                  <Button size="sm" onClick={() => setShowCategoryDialog(true)}><Plus className="w-4 h-4 mr-2" /> Nouvelle catégorie</Button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categories.map((cat: Category) => (
                    <Card key={cat.id} className="relative overflow-hidden group cursor-pointer hover:border-primary/50" onClick={() => openEditCategoryDialog(cat)}>
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: cat.color || '#666666' }} />
                      <CardContent className="pt-4 px-4 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm">{cat.name}</h4>
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{cat.description || 'Xassidas de cette catégorie'}</p>
                          </div>
                          <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* External Dialogs */}

      {/* Create Author */}
      <Dialog open={showAuthorDialog} onOpenChange={setShowAuthorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Créer un auteur</DialogTitle></DialogHeader>
          <form onSubmit={authorForm.handleSubmit((data) => createAuthorMutation.mutate(data))} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <Input {...authorForm.register('name', { required: true })} placeholder="Sheikh..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description / Bio</label>
              <Textarea {...authorForm.register('description')} rows={3} placeholder="Biographie courte..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tradition</label>
              <Input {...authorForm.register('tradition')} placeholder="Tidjiane, Qadiriyyah..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Photo</label>
              <Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setAuthorPhotoFile(e.target.files?.[0] || null)} />
              {authorPhotoFile && <p className="text-xs text-muted-foreground">Fichier : {authorPhotoFile.name}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={createAuthorMutation.isPending}>
              {createAuthorMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Author */}
      <Dialog open={showEditAuthorDialog} onOpenChange={setShowEditAuthorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Modifier l'auteur</DialogTitle></DialogHeader>
          <form onSubmit={editAuthorForm.handleSubmit((v) => {
            if (!editingAuthor) return;
            updateAuthorMutation.mutate({ id: editingAuthor.id, name: v.name, description: v.description, tradition: v.tradition });
          })} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nom *</label>
              <Input {...editAuthorForm.register('name', { required: true })} disabled={updateAuthorMutation.isPending} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description / Bio</label>
              <Textarea {...editAuthorForm.register('description')} rows={3} disabled={updateAuthorMutation.isPending} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tradition</label>
              <Input {...editAuthorForm.register('tradition')} placeholder="Tidjane, Mouride…" disabled={updateAuthorMutation.isPending} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Photo</label>
              {editingAuthor?.photo_url && !editAuthorPhotoFile && (
                <div className="flex items-center gap-2 mb-2">
                  <img src={editingAuthor.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  <span className="text-xs text-muted-foreground">Photo actuelle</span>
                </div>
              )}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setEditAuthorPhotoFile(e.target.files?.[0] || null)}
                disabled={updateAuthorMutation.isPending}
              />
              {editAuthorPhotoFile && <p className="text-xs text-muted-foreground">Nouveau fichier : {editAuthorPhotoFile.name}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={updateAuthorMutation.isPending}>
              {updateAuthorMutation.isPending ? 'Mise à jour…' : 'Sauvegarder'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Xassida */}
      <Dialog open={showEditXassidaDialog} onOpenChange={setShowEditXassidaDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Modifier la xassida</DialogTitle></DialogHeader>
          <form onSubmit={editXassidaForm.handleSubmit((data) => {
            if (!editingXassida) return;
            updateXassidaMutation.mutate({ id: editingXassida.id, ...data });
          })} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre *</label>
              <Input {...editXassidaForm.register('title', { required: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Auteur</label>
              <Select
                value={editXassidaForm.watch('author_id') || ''}
                onValueChange={(val) => editXassidaForm.setValue('author_id', val)}
              >
                <SelectTrigger><SelectValue placeholder="Choisir un auteur" /></SelectTrigger>
                <SelectContent>
                  {authors.map((a: Author) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Catégorie</label>
                <Select
                  value={editXassidaForm.watch('categorie') || 'Autre'}
                  onValueChange={(val) => editXassidaForm.setValue('categorie', val)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: Category) => (
                      <SelectItem key={cat.id || cat.name} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom Arabe</label>
                <Input {...editXassidaForm.register('arabic_name')} className="font-arabic text-right" dir="rtl" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea {...editXassidaForm.register('description')} rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL YouTube</label>
              <Input {...editXassidaForm.register('youtube_url')} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL Audio MP3</label>
              <Input {...editXassidaForm.register('audio_url')} placeholder="https://..." />
            </div>
            <Button type="submit" className="w-full" disabled={updateXassidaMutation.isPending}>
              {updateXassidaMutation.isPending ? 'Mise à jour…' : 'Sauvegarder'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Category */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nouvelle catégorie</DialogTitle></DialogHeader>
          <form onSubmit={createCategoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <Input {...createCategoryForm.register('name', { required: true })} placeholder="Poems de louange..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea {...createCategoryForm.register('description')} rows={2} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Couleur</label>
              <div className="flex items-center gap-3">
                <Input type="color" {...createCategoryForm.register('color')} className="w-12 h-10 p-1 cursor-pointer" />
                <span className="text-sm text-muted-foreground">{createCategoryForm.watch('color') || '#666666'}</span>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createCategoryMutation.isPending}>
              {createCategoryMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category */}
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Modifier la catégorie</DialogTitle></DialogHeader>
          <form onSubmit={editCategoryForm.handleSubmit((data) => {
            if (!editingCategory) return;
            updateCategoryMutation.mutate({ id: editingCategory.id, ...data });
          })} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <Input {...editCategoryForm.register('name', { required: true })} disabled={updateCategoryMutation.isPending} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea {...editCategoryForm.register('description')} rows={2} disabled={updateCategoryMutation.isPending} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Couleur</label>
              <div className="flex items-center gap-3">
                <Input type="color" {...editCategoryForm.register('color')} className="w-12 h-10 p-1 cursor-pointer" disabled={updateCategoryMutation.isPending} />
                <span className="text-sm text-muted-foreground">{editCategoryForm.watch('color') || '#666666'}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={updateCategoryMutation.isPending}>
                {updateCategoryMutation.isPending ? 'Mise à jour…' : 'Sauvegarder'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={updateCategoryMutation.isPending}
                onClick={() => editingCategory && handleDeleteCategory(editingCategory)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Global Translations */}
      <Dialog open={showImportTranslateDialog} onOpenChange={setShowImportTranslateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Import Global de Traductions</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder='[{"verse_number": 1, "xassida_id": "...", "translation_fr": "..."}]'
              className="min-h-[200px] font-mono text-xs"
              value={translationJsonInput}
              onChange={(e) => setTranslationJsonInput(e.target.value)}
            />
            <div className="flex justify-between items-center">
               <p className="text-xs text-muted-foreground">Format JSON attendu</p>
               <Button
                onClick={() => {
                  try {
                    const data = JSON.parse(translationJsonInput);
                    importTranslationsMutation.mutate(data);
                  } catch (e) {
                    setImportTranslateError("JSON invalide");
                  }
                }}
                disabled={!translationJsonInput.trim() || importTranslationsMutation.isPending}
               >
                 {importTranslationsMutation.isPending ? "Importation..." : "Lancer l'import"}
               </Button>
            </div>
            {importTranslateError && <p className="text-sm text-destructive">{importTranslateError}</p>}
            {importTranslateSuccess && <p className="text-sm text-primary font-bold">{importTranslateSuccess}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default XassidasAdmin;
