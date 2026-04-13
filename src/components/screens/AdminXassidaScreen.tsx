import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Upload, Save, ChevronLeft, ChevronRight, Loader2, Lock, Users, BookOpen, FileText, Music, Link, Youtube, FolderOpen, Pencil, Globe, BarChart3, Settings } from 'lucide-react';

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
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });
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

  const editXassidaForm = useForm({ defaultValues: { title: '', description: '', youtube_url: '', audio_url: '', arabic_name: '', categorie: 'Autre', transcription_fr: '' } });
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
    mutationFn: async (data: { id: string; title: string; description?: string; youtube_url?: string; audio_url?: string; arabic_name?: string; categorie?: string }) => {
      // First, update the xassida basic info
      const response = await fetch(`${API_URL}/xassidas/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: data.title, 
          description: data.description || '',
          audio_url: data.audio_url || '',
          arabic_name: data.arabic_name || '',
          categorie: data.categorie || 'Autre'
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
      // Toujours utiliser l'ID de la xassida sélectionnée, ignorer celui du JSON
      const enrichedTranslations = translations.map((t) => ({
        ...t,
        xassida_id: xassidaId
      }));
      
      const response = await fetch(`${API_URL}/xassidas/admin/import-translations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedTranslations)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Erreur lors de l\'import des traductions');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      setXassidaImportSuccess((prev) => ({
        ...prev,
        [variables.xassidaId]: `✅ ${data.successCount} traductions importées`
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
      categorie: xassida.categorie || 'Autre'
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
    <div className="min-h-screen bg-background pb-24 space-y-8 p-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Xassidas</h1>
          <p className="text-sm text-muted-foreground mt-2">Créer et gérer les auteurs et xassidas</p>
        </div>
        <Button variant="outline" onClick={handleLockAdmin}>Verrouiller</Button>
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Auteurs</CardDescription>
            <CardTitle>{authors.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Xassidas</CardDescription>
            <CardTitle>{xassidas.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Versets (total)</CardDescription>
            <CardTitle>{totalVerses}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Authors Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Auteurs</CardTitle>
              <CardDescription>Gérer les auteurs des xassidas</CardDescription>
            </div>
            <Dialog open={showAuthorDialog} onOpenChange={setShowAuthorDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Nouvel auteur</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un auteur</DialogTitle>
                </DialogHeader>
                <form onSubmit={authorForm.handleSubmit((data) => createAuthorMutation.mutate(data))} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom *</label>
                    <Input {...authorForm.register('name', { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description / Bio</label>
                    <Textarea {...authorForm.register('description')} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Photo</label>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => setAuthorPhotoFile(e.target.files?.[0] || null)}
                    />
                    {authorPhotoFile && (
                      <p className="text-xs text-muted-foreground">Fichier: {authorPhotoFile.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tradition</label>
                    <Input {...authorForm.register('tradition')} placeholder="Tidjiane, Qadiriyyah, etc." />
                  </div>
                  <Button type="submit" className="w-full" disabled={createAuthorMutation.isPending}>
                    {createAuthorMutation.isPending ? 'Création...' : 'Créer'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Edit author dialog */}
          <Dialog open={showEditAuthorDialog} onOpenChange={setShowEditAuthorDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>Modifier l'auteur</DialogTitle></DialogHeader>
              <form onSubmit={editAuthorForm.handleSubmit((v) => {
                if (!editingAuthor) return;
                updateAuthorMutation.mutate({ id: editingAuthor.id, name: v.name, description: v.description, tradition: v.tradition });
              })} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nom *</label>
                  <Input {...editAuthorForm.register('name', { required: true })} disabled={updateAuthorMutation.isPending} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description / Bio</label>
                  <Textarea {...editAuthorForm.register('description')} rows={3} disabled={updateAuthorMutation.isPending} />
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
                  {editAuthorPhotoFile && (
                    <p className="text-xs text-muted-foreground">Nouveau fichier: {editAuthorPhotoFile.name}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tradition</label>
                  <Input {...editAuthorForm.register('tradition')} placeholder="Tidjane, Mouride…" disabled={updateAuthorMutation.isPending} />
                </div>
                <Button type="submit" className="w-full" disabled={updateAuthorMutation.isPending}>
                  {updateAuthorMutation.isPending ? 'Mise à jour…' : 'Sauvegarder'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authors.map((author: Author) => (
              <Card key={author.id} className="border">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {(author as any).photo_url ? (
                      <img src={(author as any).photo_url} alt={author.name} className="w-14 h-14 object-cover rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary">{author.name[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold">{author.name}</h3>
                      {(author as any).tradition && <p className="text-xs text-primary/70">{(author as any).tradition}</p>}
                      {(author as any).description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{(author as any).description}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEditAuthorDialog(author)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAuthor(author)}
                        disabled={deleteAuthorMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categories Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Catégories</CardTitle>
              <CardDescription>Gérer les catégories des xassidas</CardDescription>
            </div>
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Nouvelle catégorie</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une catégorie</DialogTitle>
                </DialogHeader>
                <form onSubmit={createCategoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom *</label>
                    <Input {...createCategoryForm.register('name', { required: true })} placeholder="Ex: Éloge du Prophète" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea {...createCategoryForm.register('description')} rows={2} placeholder="Description optionnelle" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Couleur</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        {...createCategoryForm.register('color')}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input {...createCategoryForm.register('color')} placeholder="#666666" className="flex-1" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createCategoryMutation.isPending}>
                    {createCategoryMutation.isPending ? 'Création...' : 'Créer'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Edit category dialog */}
          <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>Modifier la catégorie</DialogTitle></DialogHeader>
              <form onSubmit={editCategoryForm.handleSubmit((data) => {
                if (!editingCategory) return;
                updateCategoryMutation.mutate({ id: editingCategory.id, ...data });
              })} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nom *</label>
                  <Input {...editCategoryForm.register('name', { required: true })} disabled={updateCategoryMutation.isPending} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea {...editCategoryForm.register('description')} rows={2} disabled={updateCategoryMutation.isPending} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Couleur</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      {...editCategoryForm.register('color')}
                      className="w-12 h-10 rounded border cursor-pointer"
                      disabled={updateCategoryMutation.isPending}
                    />
                    <Input {...editCategoryForm.register('color')} disabled={updateCategoryMutation.isPending} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={updateCategoryMutation.isPending}>
                    {updateCategoryMutation.isPending ? 'Modification...' : 'Modifier'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={updateCategoryMutation.isPending || deleteCategoryMutation.isPending}
                    onClick={() => handleDeleteCategory(editingCategory!)}
                  >
                    {deleteCategoryMutation.isPending ? 'Suppression...' : 'Supprimer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Categories list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories && categories.length > 0 ? (
              categories.map((cat: Category) => (
                <Card key={cat.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ backgroundColor: cat.color || '#666666' }}
                          />
                          <h4 className="font-semibold truncate">{cat.name}</h4>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs flex-shrink-0"
                        onClick={() => openEditCategoryDialog(cat)}
                        disabled={updateCategoryMutation.isPending || deleteCategoryMutation.isPending}
                      >
                        ✏️
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground col-span-full">Aucune catégorie</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Xassidas Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Xassidas</CardTitle>
              <CardDescription>Créer et gérer les xassidas</CardDescription>
            </div>
            <Dialog open={showXassidaDialog} onOpenChange={setShowXassidaDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Nouvelle xassida</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer une xassida</DialogTitle>
                </DialogHeader>
                <form onSubmit={xassidaForm.handleSubmit((data) => {
                  console.log('📝 Formulaire soumis:', { createNewAuthorMode, ...data });
                  createXassidaMutation.mutate(data);
                })} className="space-y-4">
                  {/* Title field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Titre de la xassida *</label>
                    <Input 
                      {...xassidaForm.register('title', { required: 'Titre requis' })} 
                      placeholder="Ex: Abāda, Khilāsa-Zahab..." 
                      disabled={createXassidaMutation.isPending}
                    />
                    {xassidaForm.formState.errors.title && (
                      <p className="text-red-500 text-sm">{xassidaForm.formState.errors.title.message}</p>
                    )}
                  </div>
                  
                  {/* Author mode toggle */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Auteur</p>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCreateNewAuthorMode(false);
                          xassidaForm.setValue('author_id', '');
                        }}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                          !createNewAuthorMode
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        Existant
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreateNewAuthorMode(true);
                          xassidaForm.setValue('author_name', '');
                        }}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                          createNewAuthorMode
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        Nouveau
                      </button>
                    </div>

                    {/* Existing author select */}
                    {!createNewAuthorMode && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sélectionner un auteur *</label>
                        <select 
                          {...xassidaForm.register('author_id', { required: !createNewAuthorMode ? 'Auteur requis' : false })} 
                          className="border rounded px-3 py-2 w-full"
                          disabled={createXassidaMutation.isPending}
                        >
                          <option value="">-- Choisir un auteur --</option>
                          {authors.length > 0 ? (
                            authors.map((a: Author) => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))
                          ) : (
                            <option disabled>Aucun auteur disponible</option>
                          )}
                        </select>
                        {xassidaForm.formState.errors.author_id && (
                          <p className="text-red-500 text-sm">{xassidaForm.formState.errors.author_id.message}</p>
                        )}
                      </div>
                    )}

                    {/* New author form */}
                    {createNewAuthorMode && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nom de l'auteur *</label>
                          <Input 
                            {...xassidaForm.register('author_name', { required: 'Nom requis' })} 
                            placeholder="Ex: Maodo, Cheikh Ahmadou Bamba..." 
                            disabled={createXassidaMutation.isPending}
                          />
                          {xassidaForm.formState.errors.author_name && (
                            <p className="text-red-500 text-sm">{xassidaForm.formState.errors.author_name.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description de l'auteur</label>
                          <Textarea 
                            {...xassidaForm.register('author_description')} 
                            placeholder="Biographie, tradition, période..." 
                            disabled={createXassidaMutation.isPending}
                            rows={3}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Xassida Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description de la xassida</label>
                    <Textarea 
                      {...xassidaForm.register('description')} 
                      placeholder="Contexte, thème, notes..." 
                      disabled={createXassidaMutation.isPending}
                      rows={2}
                    />
                  </div>

                  {/* Arabic Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom Arabe (optionnel)</label>
                    <Input 
                      {...xassidaForm.register('arabic_name')} 
                      placeholder="أَبَادَا، خِلاَصَة الذَّهَب..."
                      disabled={createXassidaMutation.isPending}
                      className="font-arabic text-right"
                    />
                    <p className="text-xs text-muted-foreground">Nom de la xassida en arabe</p>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Catégorie</label>
                    <select 
                      {...xassidaForm.register('categorie')}
                      className="border rounded px-3 py-2 w-full"
                      disabled={createXassidaMutation.isPending}
                    >
                      {categories.length > 0 ? (
                        categories.map((cat: string) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))
                      ) : (
                        <option value="Autre">Autre</option>
                      )}
                    </select>
                    <p className="text-xs text-muted-foreground">Catégorie de la xassida</p>
                  </div>

                  {/* YouTube URL */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">🎵 URL YouTube (optionnel)</label>
                    <Input 
                      {...xassidaForm.register('youtube_url')} 
                      placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                      type="url"
                      disabled={createXassidaMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground">La vidéo YouTube sera accessible comme audio</p>
                  </div>

                  {/* Audio URL */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">🔗 URL Audio Directe (optionnel)</label>
                    <Input 
                      {...xassidaForm.register('audio_url')} 
                      placeholder="https://example.com/audio.mp3"
                      type="url"
                      disabled={createXassidaMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground">Lien direct vers un fichier audio MP3</p>
                  </div>

                  {/* Optional PDF upload at creation time */}
                  <div className="space-y-2 border-t pt-4">
                    <label className="text-sm font-medium">PDF de la xassida (optionnel)</label>
                    <Input
                      type="file"
                      accept="application/pdf,.pdf"
                      disabled={createXassidaMutation.isPending}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setNewXassidaPdf(file);
                        setNewXassidaPdfError('');
                        setNewXassidaPdfProgress(0);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Si vous ajoutez un PDF, ses vers seront extraits et sauvegardés automatiquement après création.
                    </p>

                    {newXassidaPdf && (
                      <p className="text-xs text-foreground">Fichier sélectionné: {newXassidaPdf.name}</p>
                    )}

                    {createXassidaMutation.isPending && newXassidaPdf && (
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${newXassidaPdfProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Import PDF: {newXassidaPdfProgress}%</p>
                      </div>
                    )}

                    {createXassidaMutation.isPending && chunkSaveProgress?.label === 'creation' && (
                      <p className="text-xs text-muted-foreground">
                        Sauvegarde des vers: lot {chunkSaveProgress.current}/{chunkSaveProgress.total}
                      </p>
                    )}

                    {newXassidaPdfError && (
                      <p className="text-xs text-red-600">{newXassidaPdfError}</p>
                    )}
                  </div>

                  {/* Error message */}
                  {createXassidaMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                      {createXassidaMutation.error instanceof Error ? createXassidaMutation.error.message : 'Une erreur est survenue'}
                    </div>
                  )}

                  {/* Submit button */}
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createXassidaMutation.isPending}
                  >
                    {createXassidaMutation.isPending ? 'Création en cours...' : 'Créer la xassida'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={showEditXassidaDialog} onOpenChange={setShowEditXassidaDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Modifier la xassida</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={editXassidaForm.handleSubmit((values) => {
                  if (!editingXassida) return;
                  updateXassidaMutation.mutate({
                    id: editingXassida.id,
                    title: values.title,
                    description: values.description,
                    youtube_url: values.youtube_url,
                    audio_url: values.audio_url,
                    arabic_name: values.arabic_name,
                    categorie: values.categorie
                  });
                })}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titre</label>
                  <Input
                    {...editXassidaForm.register('title', { required: 'Titre requis' })}
                    disabled={updateXassidaMutation.isPending}
                  />
                  {editXassidaForm.formState.errors.title && (
                    <p className="text-xs text-red-600">{editXassidaForm.formState.errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom Arabe (optionnel)</label>
                  <Input
                    {...editXassidaForm.register('arabic_name')}
                    placeholder="أَبَادَا، خِلاَصَة الذَّهَب..."
                    disabled={updateXassidaMutation.isPending}
                    className="font-arabic text-right"
                  />
                  <p className="text-xs text-muted-foreground">Nom de la xassida en arabe</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transcription Française (optionnel)</label>
                  <Input
                    {...editXassidaForm.register('transcription_fr')}
                    placeholder="Abada, Khilassa Ad-Dhahab..."
                    disabled={updateXassidaMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground">Transcription phonétique en français</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégorie</label>
                  <select 
                    {...editXassidaForm.register('categorie')}
                    className="border rounded px-3 py-2 w-full"
                    disabled={updateXassidaMutation.isPending}
                  >
                    {categories.length > 0 ? (
                      categories.map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    ) : (
                      <option value="Autre">Autre</option>
                    )}
                  </select>
                  <p className="text-xs text-muted-foreground">Catégorie de la xassida</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    {...editXassidaForm.register('description')}
                    rows={3}
                    disabled={updateXassidaMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">🎵 URL YouTube</label>
                  <Input
                    {...editXassidaForm.register('youtube_url')}
                    placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                    type="url"
                    disabled={updateXassidaMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground">La vidéo YouTube sera streamée comme audio</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">🔗 URL Audio Directe</label>
                  <Input
                    {...editXassidaForm.register('audio_url')}
                    placeholder="https://example.com/audio.mp3"
                    type="url"
                    disabled={updateXassidaMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground">Lien direct vers un fichier audio MP3</p>
                </div>
                <Button type="submit" className="w-full" disabled={updateXassidaMutation.isPending}>
                  {updateXassidaMutation.isPending ? 'Mise à jour...' : 'Sauvegarder les modifications'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="space-y-4">
            {xassidas.map((x: Xassida) => (
              <Card key={x.id} className="border">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {/* Left: Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{x.title}</h3>
                      {x.arabic_name && <p className="text-sm font-arabic text-right text-blue-600">{x.arabic_name}</p>}
                      <p className="text-sm text-gray-600">{x.author_name}</p>
                      <p className="text-xs text-gray-500 mt-2">📊 {x.verse_count} vers</p>
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="flex flex-col gap-2 justify-start">
                      {/* Btn 1: Upload PDF */}
                      <Dialog open={showPdfUploadDialog === x.id} onOpenChange={(open) => {
                        setShowPdfUploadDialog(open ? x.id : null);
                        if (!open) setUploadErrorByXassida({});
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setSelectedXassida(x);
                            }}
                          >
                            📄 PDF
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Charger le PDF - {x.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Sélectionner PDF</label>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handlePdfUpload(e, x.id)}
                                className="border rounded px-3 py-2 w-full"
                                disabled={!!uploadingByXassida[x.id]}
                              />
                              <p className="text-xs text-muted-foreground mt-2">Les vers seront créés automatiquement</p>
                            </div>

                            {uploadingByXassida[x.id] && (
                              <div className="mt-2 space-y-1">
                                <div className="w-full h-2 bg-muted rounded overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${uploadProgressByXassida[x.id] || 0}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Upload: {uploadProgressByXassida[x.id] || 0}%
                                </p>
                              </div>
                            )}
                            {uploadErrorByXassida[x.id] && (
                              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                                ❌ {uploadErrorByXassida[x.id]}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Btn 2: Upload Translation */}
                      <Dialog open={showTranslationUploadDialog === x.id} onOpenChange={(open) => {
                        setShowTranslationUploadDialog(open ? x.id : null);
                        if (!open) {
                          setXassidaImportErrors({});
                          setXassidaImportSuccess({});
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            🌐 Traduction
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Charger traductions - {x.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <label className="block text-sm font-medium">📄 Fichier JSON</label>
                            <input
                              type="file"
                              accept=".json"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const content = event.target?.result as string;
                                    setXassidaImportTranslations((prev) => ({
                                      ...prev,
                                      [x.id]: content
                                    }));
                                    setXassidaImportErrors((prev) => ({
                                      ...prev,
                                      [x.id]: ''
                                    }));
                                  };
                                  reader.readAsText(file);
                                }
                              }}
                              className="border rounded px-3 py-2 w-full"
                              disabled={importXassidaTranslationsMutation.isPending}
                            />
                            <p className="text-xs text-muted-foreground">Format: JSON array avec {'{verse_number, translation_fr}'}</p>

                            {xassidaImportTranslations[x.id] && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                                {(() => {
                                  try {
                                    const data = JSON.parse(xassidaImportTranslations[x.id]);
                                    return <div className="text-blue-700">✅ {data.length} traduction(s) détectée(s)</div>;
                                  } catch {
                                    return <div className="text-red-600">❌ JSON invalide</div>;
                                  }
                                })()}
                              </div>
                            )}

                            {xassidaImportErrors[x.id] && (
                              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                                ❌ {xassidaImportErrors[x.id]}
                              </div>
                            )}

                            {xassidaImportSuccess[x.id] && (
                              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                                {xassidaImportSuccess[x.id]}
                              </div>
                            )}

                            <Button
                              type="button"
                              className="w-full"
                              onClick={() => {
                                try {
                                  const data = JSON.parse(xassidaImportTranslations[x.id]);
                                  if (!Array.isArray(data)) {
                                    throw new Error('Le JSON doit être un tableau');
                                  }
                                  importXassidaTranslationsMutation.mutate({
                                    xassidaId: x.id,
                                    translations: data
                                  });
                                } catch (error: any) {
                                  setXassidaImportErrors((prev) => ({
                                    ...prev,
                                    [x.id]: `Erreur JSON: ${error.message}`
                                  }));
                                }
                              }}
                              disabled={!xassidaImportTranslations[x.id]?.trim() || importXassidaTranslationsMutation.isPending}
                            >
                              {importXassidaTranslationsMutation.isPending ? 'Importation...' : 'Importer'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Btn 3: Edit */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => openEditDialog(x)}
                        disabled={updateXassidaMutation.isPending || deleteXassidaMutation.isPending}
                      >
                        ✏️ Éditer
                      </Button>

                      {/* Btn 4: Delete */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        onClick={() => handleDeleteXassida(x)}
                        disabled={deleteXassidaMutation.isPending || updateXassidaMutation.isPending}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hidden dialog for advanced editing - not used in normal flow */}
        </CardContent>
      </Card>
    </div>
  );
}

export default XassidasAdmin;
