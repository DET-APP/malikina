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
import { Plus, Edit2, Trash2, Upload, Save, ChevronLeft, ChevronRight, Loader2, Lock, Users, BookOpen, FileText, Music, Link, Youtube, FolderOpen, Pencil, Globe, BarChart3, Settings, X, Search, LayoutDashboard, Filter, Eye, EyeOff, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL as API_URL } from '@/lib/apiUrl';

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
  translation_wo?: string;
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

interface XassidaAudio {
  id: string;
  xassida_id: string;
  chapter_number: number | null;
  reciter_name: string;
  youtube_id: string | null;
  audio_url: string | null;
  label: string | null;
  order_index: number;
  start_time?: number | null; // In seconds
  end_time?: number | null; // In seconds
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
  const { user, token, logout, can } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const [selectedXassida, setSelectedXassida] = useState<Xassida | null>(null);
  const [editorVerses, setEditorVerses] = useState<Verse[]>([]);
  const [currentVersePage, setCurrentVersePage] = useState(1);
  const [editorFontSize, setEditorFontSize] = useState(32);
  const [showAuthorDialog, setShowAuthorDialog] = useState(false);
  const [showXassidaDialog, setShowXassidaDialog] = useState(false);
  const [createNewAuthorMode, setCreateNewAuthorMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
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
          headers: { 'Content-Type': 'application/json', ...authHeaders },
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

  // Audio management for the edit dialog
  const [audioForm, setAudioForm] = useState({ reciter_name: '', chapter_number: '', youtube_url: '', audio_url: '', start_time_minutes: '', end_time_minutes: '' });
  const [editingAudioId, setEditingAudioId] = useState<string | null>(null);
  const [editAudioForm, setEditAudioForm] = useState({ reciter_name: '', chapter_number: '', youtube_url: '', audio_url: '', start_time_minutes: '', end_time_minutes: '' });

  const { data: editingAudios = [], refetch: refetchAudios } = useQuery<XassidaAudio[]>({
    queryKey: ['xassida-audios-admin', editingXassida?.id],
    queryFn: async () => {
      if (!editingXassida?.id) return [];
      const res = await fetch(`${API_URL}/xassidas/${editingXassida.id}/audios`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!editingXassida?.id,
  });

  const addAudioMutation = useMutation({
    mutationFn: async (data: typeof audioForm) => {
      const parseTimeMinutes = (input: string) => {
        if (!input.trim()) return undefined;
        const parts = input.trim().split(':');
        const minutes = parseInt(parts[0], 10) || 0;
        const seconds = parseInt(parts[1], 10) || 0;
        return minutes * 60 + seconds;
      };

      const res = await fetch(`${API_URL}/xassidas/${editingXassida!.id}/audios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          reciter_name: data.reciter_name.trim(),
          chapter_number: data.chapter_number !== '' ? Number(data.chapter_number) : null,
          youtube_url: data.youtube_url.trim() || undefined,
          audio_url: data.audio_url.trim() || undefined,
          start_time: parseTimeMinutes(data.start_time_minutes),
          end_time: parseTimeMinutes(data.end_time_minutes),
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Erreur ajout audio'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassida-audios-admin', editingXassida?.id] });
      queryClient.invalidateQueries({ queryKey: ['xassida-audios', editingXassida?.id] });
      setAudioForm({ reciter_name: '', chapter_number: '', youtube_url: '', audio_url: '', start_time_minutes: '', end_time_minutes: '' });
    },
    onError: (e: any) => alert(e.message),
  });

  const deleteAudioMutation = useMutation({
    mutationFn: async (audioId: string) => {
      const res = await fetch(`${API_URL}/xassidas/${editingXassida!.id}/audios/${audioId}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) throw new Error('Erreur suppression audio');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassida-audios-admin', editingXassida?.id] });
      queryClient.invalidateQueries({ queryKey: ['xassida-audios', editingXassida?.id] });
    },
    onError: (e: any) => alert(e.message),
  });

  const updateAudioMutation = useMutation({
    mutationFn: async ({ audioId, data }: { audioId: string; data: typeof editAudioForm }) => {
      // Convert MM:SS format to total seconds
      const parseTimeMinutes = (input: string) => {
        if (!input.trim()) return undefined;
        const parts = input.trim().split(':');
        const minutes = parseInt(parts[0], 10) || 0;
        const seconds = parseInt(parts[1], 10) || 0;
        return minutes * 60 + seconds;
      };

      const res = await fetch(`${API_URL}/xassidas/${editingXassida!.id}/audios/${audioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          reciter_name: data.reciter_name.trim(),
          chapter_number: data.chapter_number !== '' ? Number(data.chapter_number) : null,
          youtube_url: data.youtube_url.trim() || undefined,
          audio_url: data.audio_url.trim() || undefined,
          start_time: parseTimeMinutes(data.start_time_minutes),
          end_time: parseTimeMinutes(data.end_time_minutes),
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Erreur mise à jour'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassida-audios-admin', editingXassida?.id] });
      queryClient.invalidateQueries({ queryKey: ['xassida-audios', editingXassida?.id] });
      setEditingAudioId(null);
    },
    onError: (e: any) => alert(e.message),
  });

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
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ name: data.name, description: data.description, tradition: data.tradition })
      });
      if (!response.ok) throw new Error('Impossible de modifier l\'auteur');

      // Upload photo if a file was selected
      if (editAuthorPhotoFile) {
        const formData = new FormData();
        formData.append('photo', editAuthorPhotoFile);
        const uploadRes = await fetch(`${API_URL}/authors/${data.id}/upload-photo`, {
          method: 'POST',
          headers: authHeaders,
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
      const response = await fetch(`${API_URL}/authors/${id}`, { method: 'DELETE', headers: authHeaders });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Impossible de supprimer l\'auteur');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      queryClient.invalidateQueries({ queryKey: ['xassidas-admin'] });
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
    if (currentVersePage > totalVersePages) {
      setCurrentVersePage(totalVersePages);
    }
  }, [currentVersePage, totalVersePages]);

  // Fetch authors
  const { data: authors = [] } = useQuery({
    queryKey: ['authors'],
    queryFn: () => fetch(`${API_URL}/authors`).then(r => r.json())
  });

  // Fetch xassidas — admin voit tout (y compris masqués)
  const { data: xassidas = [] } = useQuery({
    queryKey: ['xassidas-admin'],
    queryFn: () => fetch(`${API_URL}/xassidas?admin=true`, { headers: authHeaders }).then(r => r.json())
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
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
          headers: authHeaders,
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
            headers: { 'Content-Type': 'application/json', ...authHeaders },
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
          headers: { 'Content-Type': 'application/json', ...authHeaders },
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
              headers: { 'Content-Type': 'application/json', ...authHeaders },
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
      queryClient.invalidateQueries({ queryKey: ['xassidas-admin'] });
      queryClient.invalidateQueries({ queryKey: ['xassida-detail'] });
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
      queryClient.invalidateQueries({ queryKey: ['xassidas-admin'] });
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
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
          headers: { 'Content-Type': 'application/json', ...authHeaders },
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
      queryClient.invalidateQueries({ queryKey: ['xassidas-admin'] });
      queryClient.invalidateQueries({ queryKey: ['xassida-detail'] });
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
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Impossible de supprimer la xassida');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassidas-admin'] });
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

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const res = await fetch(`${API_URL}/xassidas/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ is_visible }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Erreur'); }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['xassidas-admin'] }),
  });

  const importTranslationsMutation = useMutation({
    mutationFn: async (translations: any[]) => {
      const response = await fetch(`${API_URL}/xassidas/admin/import-translations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
      queryClient.invalidateQueries({ queryKey: ['xassidas-admin'] });
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
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
      queryClient.invalidateQueries({ queryKey: ['xassidas-admin'] });
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
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
        method: 'DELETE',
        headers: authHeaders
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

  const ROLE_LABELS: Record<string, string> = {
    SuperAdmin: 'Super Admin',
    Admin: 'Administrateur',
    GerantAudio: 'Gérant Audio',
    GerantXassida: 'Gérant Xassidas',
    Moderateur: 'Modérateur',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Hidden when editing verses for focus */}
      {!selectedXassida && (
        <div className="bg-gradient-to-br from-primary to-green-dark pt-12 px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="flex items-start justify-between relative mb-5">
            <div>
              <h1 className="text-2xl font-bold text-white">Administration</h1>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-white/60" />
                <span className="text-xs text-white/70">{user?.full_name} · {ROLE_LABELS[user?.role || ''] || user?.role}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-white/80 hover:text-white hover:bg-white/10">
              <LogOut className="w-4 h-4 mr-1.5" />
              Déconnexion
            </Button>
          </div>
          {/* Tab navigation intégrée dans le header */}
          <div className="flex gap-1 relative overflow-x-auto scrollbar-hide -mx-6 px-6">
            {[
              { value: 'dashboard',  icon: <LayoutDashboard className="w-4 h-4" />, label: 'Stats',        show: true },
              { value: 'xassidas',   icon: <BookOpen className="w-4 h-4" />,        label: 'Xassidas',     show: can('manage_xassidas') },
              { value: 'authors',    icon: <Users className="w-4 h-4" />,           label: 'Auteurs',      show: can('manage_authors') },
              { value: 'categories', icon: <FolderOpen className="w-4 h-4" />,      label: 'Catégories',   show: can('manage_xassidas') },
              { value: 'users',      icon: <ShieldCheck className="w-4 h-4" />,     label: 'Utilisateurs', show: can('manage_users') },
            ].filter(tab => tab.show).map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors shrink-0",
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
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Traduction Wolof 🇸🇳</label>
                            <Textarea
                              value={verse.translation_wo || ''}
                              onChange={(e) => handleVerseFieldChange(globalIdx, 'translation_wo', e.target.value)}
                              placeholder="Terjemeen ci wolof..."
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

                              {can('toggle_visibility') && (
                                <>
                                  <div className="w-px h-5 bg-border mx-0.5" />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={cn("h-8 w-8 p-0", (x as any).is_visible !== false ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-foreground")}
                                    onClick={() => toggleVisibilityMutation.mutate({ id: x.id, is_visible: (x as any).is_visible === false })}
                                    title={(x as any).is_visible !== false ? "Masquer la xassida" : "Afficher la xassida"}
                                  >
                                    {(x as any).is_visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                  </Button>
                                </>
                              )}
                              {can('delete_xassidas') && (
                                <>
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
                                </>
                              )}
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

            {/* Tab: Utilisateurs — SuperAdmin seulement */}
            <TabsContent value="users" className="space-y-4 mt-0">
              <UsersTab authHeaders={authHeaders} />
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
            {/* ── Audio management ─────────────────────────── */}
            <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <Music className="w-4 h-4" /> Audios ({editingAudios.length})
              </label>

              {/* Existing audios list */}
              {editingAudios.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Aucun audio ajouté</p>
              )}
              {editingAudios.map((audio) => (
                <div key={audio.id} className="bg-card rounded-lg border text-sm overflow-hidden">
                  {editingAudioId === audio.id ? (
                    /* ── Inline edit form ── */
                    <div className="p-3 space-y-2">
                      <Input
                        placeholder="Nom du récitateur *"
                        value={editAudioForm.reciter_name}
                        onChange={(e) => setEditAudioForm((f) => ({ ...f, reciter_name: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Chapitre (opt.)"
                          className="w-32 flex-shrink-0"
                          value={editAudioForm.chapter_number}
                          onChange={(e) => setEditAudioForm((f) => ({ ...f, chapter_number: e.target.value }))}
                        />
                        <Input
                          placeholder="URL YouTube"
                          className="flex-1"
                          value={editAudioForm.youtube_url}
                          onChange={(e) => setEditAudioForm((f) => ({ ...f, youtube_url: e.target.value }))}
                        />
                      </div>
                      <Input
                        placeholder="URL Audio MP3"
                        value={editAudioForm.audio_url}
                        onChange={(e) => setEditAudioForm((f) => ({ ...f, audio_url: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground">Début (MM:SS, opt.)</label>
                          <Input
                            placeholder="0:00"
                            value={editAudioForm.start_time_minutes}
                            onChange={(e) => setEditAudioForm((f) => ({ ...f, start_time_minutes: e.target.value }))}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground">Fin (MM:SS, opt.)</label>
                          <Input
                            placeholder="MM:SS"
                            value={editAudioForm.end_time_minutes}
                            onChange={(e) => setEditAudioForm((f) => ({ ...f, end_time_minutes: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1"
                          disabled={!editAudioForm.reciter_name.trim() || updateAudioMutation.isPending}
                          onClick={() => updateAudioMutation.mutate({ audioId: audio.id, data: editAudioForm })}
                        >
                          {updateAudioMutation.isPending
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Sauvegarde...</>
                            : <><Save className="w-3.5 h-3.5 mr-1.5" />Sauvegarder</>}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingAudioId(null)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── Read-only row ── */
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{audio.reciter_name}{audio.label ? ` · ${audio.label}` : ''}</p>
                        <p className="text-xs text-muted-foreground">
                          {audio.chapter_number !== null ? `Ch. ${audio.chapter_number}` : 'Toute la xassida'}
                          {' · '}
                          {audio.youtube_id ? '▶ YouTube' : '🎵 MP3'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Convert seconds back to MM:SS format for display
                          const formatSeconds = (secs?: number | null) => {
                            if (!secs) return '';
                            const mins = Math.floor(secs / 60);
                            const s = secs % 60;
                            return `${mins}:${String(s).padStart(2, '0')}`;
                          };

                          setEditingAudioId(audio.id);
                          setEditAudioForm({
                            reciter_name: audio.reciter_name,
                            chapter_number: audio.chapter_number !== null ? String(audio.chapter_number) : '',
                            youtube_url: audio.youtube_id ? `https://www.youtube.com/watch?v=${audio.youtube_id}` : '',
                            audio_url: audio.audio_url || '',
                            start_time_minutes: formatSeconds(audio.start_time),
                            end_time_minutes: formatSeconds(audio.end_time),
                          });
                        }}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0 p-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAudioMutation.mutate(audio.id)}
                        disabled={deleteAudioMutation.isPending}
                        className="text-destructive hover:text-destructive/70 flex-shrink-0 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add new audio form */}
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ajouter un audio</p>
                <Input
                  placeholder="Nom du récitateur *"
                  value={audioForm.reciter_name}
                  onChange={(e) => setAudioForm((f) => ({ ...f, reciter_name: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Chapitre (opt.)"
                    className="w-32 flex-shrink-0"
                    value={audioForm.chapter_number}
                    onChange={(e) => setAudioForm((f) => ({ ...f, chapter_number: e.target.value }))}
                  />
                  <Input
                    placeholder="URL YouTube"
                    className="flex-1"
                    value={audioForm.youtube_url}
                    onChange={(e) => setAudioForm((f) => ({ ...f, youtube_url: e.target.value }))}
                  />
                </div>
                <Input
                  placeholder="URL Audio MP3 (ou YouTube ci-dessus)"
                  value={audioForm.audio_url}
                  onChange={(e) => setAudioForm((f) => ({ ...f, audio_url: e.target.value }))}
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Début (MM:SS, opt.)</label>
                    <Input
                      placeholder="0:00"
                      value={audioForm.start_time_minutes}
                      onChange={(e) => setAudioForm((f) => ({ ...f, start_time_minutes: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Fin (MM:SS, opt.)</label>
                    <Input
                      placeholder="MM:SS"
                      value={audioForm.end_time_minutes}
                      onChange={(e) => setAudioForm((f) => ({ ...f, end_time_minutes: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={
                    !audioForm.reciter_name.trim() ||
                    (!audioForm.youtube_url.trim() && !audioForm.audio_url.trim()) ||
                    addAudioMutation.isPending
                  }
                  onClick={() => addAudioMutation.mutate(audioForm)}
                >
                  {addAudioMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Ajout...</> : '+ Ajouter'}
                </Button>
              </div>
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

// ── Composant gestion utilisateurs (SuperAdmin) ──────────────────────────────

const ROLES: { value: string; label: string; color: string; desc: string }[] = [
  { value: 'SuperAdmin',    label: 'Super Admin',      color: 'bg-red-100 text-red-700 border-red-200',       desc: 'Accès total — gestion utilisateurs incluse' },
  { value: 'Admin',         label: 'Admin',            color: 'bg-orange-100 text-orange-700 border-orange-200', desc: 'Gestion xassidas, auteurs, verses, audio' },
  { value: 'GerantXassida', label: 'Gérant Xassidas',  color: 'bg-green-100 text-green-700 border-green-200',  desc: 'Ajouter/modifier xassidas, auteurs, vers' },
  { value: 'GerantAudio',   label: 'Gérant Audio',     color: 'bg-blue-100 text-blue-700 border-blue-200',    desc: 'Gérer les fichiers audio uniquement' },
  { value: 'Moderateur',    label: 'Modérateur',       color: 'bg-gray-100 text-gray-700 border-gray-200',    desc: 'Lecture seule — statistiques et intégrité' },
];

const ROLE_PERMISSIONS_MATRIX: { label: string; roles: string[] }[] = [
  { label: 'Gérer les utilisateurs',    roles: ['SuperAdmin'] },
  { label: 'Supprimer xassidas',        roles: ['SuperAdmin', 'Admin'] },
  { label: 'Afficher/masquer xassidas', roles: ['SuperAdmin', 'Admin'] },
  { label: 'Importer traductions',      roles: ['SuperAdmin', 'Admin', 'GerantXassida'] },
  { label: 'Modifier xassidas/auteurs', roles: ['SuperAdmin', 'Admin', 'GerantXassida'] },
  { label: 'Gérer les vers',            roles: ['SuperAdmin', 'Admin', 'GerantXassida'] },
  { label: 'Gérer l\'audio',            roles: ['SuperAdmin', 'Admin', 'GerantXassida', 'GerantAudio'] },
  { label: 'Supprimer audio',           roles: ['SuperAdmin', 'Admin', 'GerantAudio'] },
  { label: 'Voir les statistiques',     roles: ['SuperAdmin', 'Admin', 'GerantXassida', 'GerantAudio', 'Moderateur'] },
];

function getRoleStyle(role: string) {
  return ROLES.find(r => r.value === role)?.color || 'bg-gray-100 text-gray-700 border-gray-200';
}

function getRoleLabel(role: string) {
  return ROLES.find(r => r.value === role)?.label || role;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

function UsersTab({ authHeaders }: { authHeaders: Record<string, string> }) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [pwdUser, setPwdUser] = useState<AdminUserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserRow | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', full_name: '', role: 'GerantXassida' });
  const [editForm, setEditForm] = useState({ full_name: '', role: '' });
  const [newPassword, setNewPassword] = useState('');

  const { data: users = [], isLoading } = useQuery<AdminUserRow[]>({
    queryKey: ['admin-users'],
    queryFn: () => fetch(`${API_URL}/auth/users`, { headers: authHeaders }).then(r => r.json()),
  });

  const apiMutate = async (url: string, method: string, body?: object) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    return res.json();
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof createForm) => apiMutate(`${API_URL}/auth/users`, 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreate(false);
      setCreateForm({ email: '', password: '', full_name: '', role: 'GerantXassida' });
    },
    onError: (e: any) => alert(e.message),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      apiMutate(`${API_URL}/auth/users/${id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditUser(null);
    },
    onError: (e: any) => alert(e.message),
  });

  const pwdMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiMutate(`${API_URL}/auth/users/${id}/password`, 'PATCH', { password }),
    onSuccess: () => { setPwdUser(null); setNewPassword(''); },
    onError: (e: any) => alert(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiMutate(`${API_URL}/auth/users/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteUser(null);
    },
    onError: (e: any) => alert(e.message),
  });

  const openEdit = (u: AdminUserRow) => {
    setEditForm({ full_name: u.full_name, role: u.role });
    setEditUser(u);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Utilisateurs ({users.length})</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowMatrix(v => !v)}>
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Rôles
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Nouveau
          </Button>
        </div>
      </div>

      {/* Matrice des permissions */}
      {showMatrix && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold">Permissions par rôle</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-1 pr-3 font-medium text-muted-foreground w-48">Permission</th>
                  {ROLES.map(r => (
                    <th key={r.value} className="text-center py-1 px-2 font-medium">
                      <span className={cn("px-1.5 py-0.5 rounded border text-xs", r.color)}>{r.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLE_PERMISSIONS_MATRIX.map(row => (
                  <tr key={row.label} className="border-t border-border/40">
                    <td className="py-1.5 pr-3 text-muted-foreground">{row.label}</td>
                    {ROLES.map(r => (
                      <td key={r.value} className="text-center py-1.5 px-2">
                        {row.roles.includes(r.value)
                          ? <span className="text-green-600 font-bold">✓</span>
                          : <span className="text-muted-foreground/30">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Role legend */}
      <div className="grid grid-cols-1 gap-2">
        {ROLES.map(r => (
          <div key={r.value} className="flex items-center gap-2 text-xs">
            <span className={cn("px-2 py-0.5 rounded border font-medium min-w-[110px] text-center", r.color)}>{r.label}</span>
            <span className="text-muted-foreground">{r.desc}</span>
          </div>
        ))}
      </div>

      {/* User list */}
      {isLoading && <div className="text-center py-8 text-muted-foreground">Chargement...</div>}

      <div className="space-y-2">
        {users.map((u) => (
          <Card key={u.id} className={cn("transition-opacity", !u.is_active && "opacity-60")}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{u.full_name}</span>
                    {currentUser?.id === u.id && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Vous</span>
                    )}
                    <span className={cn("text-xs px-1.5 py-0.5 rounded border font-medium", getRoleStyle(u.role))}>
                      {getRoleLabel(u.role)}
                    </span>
                    {!u.is_active && (
                      <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Désactivé</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">Créé {formatDate(u.created_at)}</span>
                    <span className="text-xs text-muted-foreground">Connecté {formatDate(u.last_login_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm" variant="ghost" className="h-8 w-8 p-0"
                    title="Modifier"
                    onClick={() => openEdit(u)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm" variant="ghost" className="h-8 w-8 p-0"
                    title="Changer mot de passe"
                    onClick={() => { setPwdUser(u); setNewPassword(''); }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant={u.is_active ? "outline" : "default"}
                    className="text-xs h-7 px-2"
                    onClick={() => editMutation.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                  >
                    {u.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  {currentUser?.id !== u.id && (
                    <Button
                      size="sm" variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Supprimer"
                      onClick={() => setDeleteUser(u)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Créer */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Créer un utilisateur</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nom complet *</label>
              <Input value={createForm.full_name} onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Sheikh..." />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="user@malikina.app" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Mot de passe *</label>
              <Input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 caractères" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Rôle *</label>
              <select
                className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background"
                value={createForm.role}
                onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">{ROLES.find(r => r.value === createForm.role)?.desc}</p>
            </div>
            <Button
              className="w-full"
              disabled={!createForm.email || !createForm.password || !createForm.full_name || createMutation.isPending}
              onClick={() => createMutation.mutate(createForm)}
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Éditer */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Modifier {editUser?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nom complet</label>
              <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Rôle</label>
              <select
                className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background"
                value={editForm.role}
                onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">{ROLES.find(r => r.value === editForm.role)?.desc}</p>
            </div>
            <Button
              className="w-full"
              disabled={!editForm.full_name || editMutation.isPending}
              onClick={() => editUser && editMutation.mutate({ id: editUser.id, data: { full_name: editForm.full_name, role: editForm.role } })}
            >
              {editMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Mot de passe */}
      <Dialog open={!!pwdUser} onOpenChange={open => !open && setPwdUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Mot de passe — {pwdUser?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nouveau mot de passe *</label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 8 caractères"
              />
            </div>
            <Button
              className="w-full"
              disabled={newPassword.length < 8 || pwdMutation.isPending}
              onClick={() => pwdUser && pwdMutation.mutate({ id: pwdUser.id, password: newPassword })}
            >
              {pwdMutation.isPending ? 'Mise à jour...' : 'Changer le mot de passe'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Supprimer */}
      <Dialog open={!!deleteUser} onOpenChange={open => !open && setDeleteUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer cet utilisateur ?</DialogTitle></DialogHeader>
          <div className="pt-2 space-y-4">
            <p className="text-sm text-muted-foreground">
              Vous allez supprimer <strong>{deleteUser?.full_name}</strong> ({deleteUser?.email}). Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteUser(null)}>Annuler</Button>
              <Button
                variant="destructive" className="flex-1"
                disabled={deleteMutation.isPending}
                onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default XassidasAdmin;
