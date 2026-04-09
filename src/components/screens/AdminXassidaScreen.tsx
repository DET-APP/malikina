import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Upload, Save, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://malikina-api.onrender.com/api');
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
  verse_count: number;
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
  const [showAudioUploadDialog, setShowAudioUploadDialog] = useState(false);
  const [audioUploadingXassidaId, setAudioUploadingXassidaId] = useState<string | null>(null);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [audioUploadError, setAudioUploadError] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');

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

  const editXassidaForm = useForm({ defaultValues: { title: '', description: '', author_id: '' } });
  const editAuthorForm = useForm({ defaultValues: { name: '', description: '', photo_url: '', tradition: '' } });

  const updateAuthorMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string; photo_url?: string; tradition?: string }) => {
      const response = await fetch(`${API_URL}/authors/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, description: data.description, photo_url: data.photo_url, tradition: data.tradition })
      });
      if (!response.ok) throw new Error('Impossible de modifier l\'auteur');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      setShowEditAuthorDialog(false);
      setEditingAuthor(null);
      editAuthorForm.reset();
    },
    onError: (error: any) => alert(`Erreur: ${error?.message}`)
  });

  const openEditAuthorDialog = (author: Author) => {
    setEditingAuthor(author);
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

  // Create author
  const authorForm = useForm();
  const createAuthorMutation = useMutation({
    mutationFn: (data: any) =>
      fetch(`${API_URL}/authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      authorForm.reset();
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
      description: ''
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
            description: data.description?.trim() || ''
          })
        });

        if (!xassidaResponse.ok) {
          throw new Error(`Erreur lors de la création de la xassida: ${xassidaResponse.statusText}`);
        }

        const xassidaData = await xassidaResponse.json();

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
        description: ''
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
    mutationFn: async (data: { id: string; title: string; description?: string; author_id?: string }) => {
      const response = await fetch(`${API_URL}/xassidas/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title, description: data.description || '', author_id: data.author_id })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Impossible de modifier la xassida');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassidas'] });
      setShowEditXassidaDialog(false);
      setEditingXassida(null);
      editXassidaForm.reset({ title: '', description: '', author_id: '' });
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

  const openEditDialog = (xassida: Xassida) => {
    setEditingXassida(xassida);
    editXassidaForm.reset({
      title: xassida.title || '',
      description: xassida.description || '',
      author_id: xassida.author_id || ''
    });
    setYoutubeUrl('');
    setYoutubeError('');
    setShowEditXassidaDialog(true);
  };

  // Save YouTube ID
  const handleSaveYoutubeId = async () => {
    if (!editingXassida || !youtubeUrl.trim()) {
      setYoutubeError('Veuillez entrer une URL YouTube');
      return;
    }

    setYoutubeLoading(true);
    setYoutubeError('');

    try {
      const response = await fetch(`${API_URL}/xassidas/${editingXassida.id}/set-youtube-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: youtubeUrl })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Impossible de sauvegarder l\'URL YouTube');
      }

      alert('✅ URL YouTube sauvegardée avec succès!');
      queryClient.invalidateQueries({ queryKey: ['xassidas'] });
      setYoutubeUrl('');
      setYoutubeError('');
    } catch (error) {
      console.error('YouTube ID error:', error);
      setYoutubeError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setYoutubeLoading(false);
    }
  };

  const handleDeleteXassida = async (xassida: Xassida) => {
    const confirmed = window.confirm(`Supprimer la xassida "${xassida.title}" ? Cette action est irréversible.`);
    if (!confirmed) return;
    await deleteXassidaMutation.mutateAsync(xassida.id);
  };

  // Handle audio upload
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, xassidaId: string) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    // Validate it's an audio file
    if (!file.type.startsWith('audio/')) {
      setAudioUploadError('Veuillez sélectionner un fichier audio valide (MP3, WAV, OGG, etc.)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('xassida_id', xassidaId);

    setAudioUploadError('');
    setAudioUploadProgress(0);
    setAudioUploadingXassidaId(xassidaId);

    try {
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/xassidas/${xassidaId}/upload-audio`);

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          setAudioUploadProgress(percent);
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('Réponse serveur invalide après upload audio'));
            }
            return;
          }
          reject(new Error(`Upload échoué (${xhr.status})`));
        };

        xhr.onerror = () => reject(new Error('Erreur réseau pendant l\'upload audio'));
        xhr.send(formData);
      });

      setAudioUploadError('');
      alert('✅ Audio uploadé avec succès!');
      setShowAudioUploadDialog(false);
      // Reset file input
      const fileInput = document.querySelector(`input[data-audio-upload="${xassidaId}"]`) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Audio upload error:', error);
      setAudioUploadError(error instanceof Error ? error.message : 'Erreur inconnue pendant upload');
    } finally {
      setAudioUploadingXassidaId(null);
      setAudioUploadProgress(0);
    }
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
        throw new Error(`Impossible de charger les versets (${response.status})`);
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
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès Admin Xassidas</CardTitle>
            <CardDescription>Entrez le mot de passe pour accéder au panneau d'administration.</CardDescription>
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
                />
              </div>
              {authError && (
                <p className="text-sm text-red-600">{authError}</p>
              )}
              <Button type="submit" className="w-full">Déverrouiller</Button>
            </form>
          </CardContent>
        </Card>
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
                    <label className="text-sm font-medium">Nom</label>
                    <Input {...authorForm.register('name')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea {...authorForm.register('description')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL Photo</label>
                    <Input {...authorForm.register('photo_url')} type="url" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tradition</label>
                    <Input {...authorForm.register('tradition')} placeholder="Tidjiane, Qadiriyyah, etc." />
                  </div>
                  <Button type="submit" className="w-full">Créer</Button>
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
                updateAuthorMutation.mutate({ id: editingAuthor.id, ...v });
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
                  <label className="text-sm font-medium">URL Photo</label>
                  <Input {...editAuthorForm.register('photo_url')} type="url" disabled={updateAuthorMutation.isPending} />
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
                    <Button size="sm" variant="outline" onClick={() => openEditAuthorDialog(author)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
          {/* Audio upload dialog */}
          <Dialog open={showAudioUploadDialog} onOpenChange={setShowAudioUploadDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Uploader un audio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Sélectionnez un fichier audio (MP3, WAV, OGG, etc.)</p>
                <div>
                  <label className="block text-sm font-medium mb-2">Fichier audio</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      if (editingXassida) {
                        handleAudioUpload(e, editingXassida.id);
                      }
                    }}
                    className="border rounded px-3 py-2 w-full"
                    disabled={!!audioUploadingXassidaId}
                  />
                </div>

                {audioUploadingXassidaId && (
                  <div className="space-y-2">
                    <div className="w-full h-2 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${audioUploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Upload en cours: {audioUploadProgress}%</p>
                  </div>
                )}

                {audioUploadError && (
                  <p className="text-xs text-red-600">{audioUploadError}</p>
                )}
              </div>
            </DialogContent>
          </Dialog>

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
                    author_id: values.author_id
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
                  <label className="text-sm font-medium">Auteur</label>
                  <select
                    {...editXassidaForm.register('author_id')}
                    className="border rounded px-3 py-2 w-full"
                    disabled={updateXassidaMutation.isPending}
                  >
                    <option value="">-- Sélectionner un auteur --</option>
                    {authors.map((a: Author) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    {...editXassidaForm.register('description')}
                    rows={3}
                    disabled={updateXassidaMutation.isPending}
                  />
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <label className="text-sm font-medium">🎵 URL YouTube (pour diffuser l'audio)</label>
                  <div className="space-y-2">
                    <Input
                      placeholder="https://youtube.com/watch?v=... ou juste l'ID"
                      value={youtubeUrl}
                      onChange={(e) => {
                        setYoutubeUrl(e.target.value);
                        setYoutubeError('');
                      }}
                      disabled={youtubeLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      L'audio sera extrait de YouTube et mis en cache automatiquement à la première lecture.
                    </p>
                    {youtubeError && (
                      <p className="text-xs text-red-600">{youtubeError}</p>
                    )}
                    <Button
                      type="button"
                      onClick={handleSaveYoutubeId}
                      disabled={youtubeLoading || !youtubeUrl.trim()}
                      variant="secondary"
                      className="w-full"
                    >
                      {youtubeLoading ? 'Vérification...' : 'Sauvegarder l\'URL YouTube'}
                    </Button>
                  </div>
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
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{x.title}</h3>
                      <p className="text-sm text-gray-600">{x.author_name}</p>
                      <p className="text-xs text-gray-500 mt-2">{x.verse_count} versets</p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog
                        onOpenChange={(open) => {
                          if (!open && selectedXassida?.id === x.id) {
                            setEditorVerses([]);
                            setCurrentVersePage(1);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedXassida(x);
                              loadExistingVerses(x.id);
                            }}
                          >
                            <Upload className="w-4 h-4 mr-2" /> Ajouter versets
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Éditer les versets - {x.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => loadExistingVerses(x.id)}
                                disabled={!!loadingVersesByXassida[x.id] || !!uploadingByXassida[x.id]}
                              >
                                {loadingVersesByXassida[x.id] ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Chargement...
                                  </>
                                ) : (
                                  'Charger les versets existants'
                                )}
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                Les modifications remplacent les versets actuels à la sauvegarde.
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Télécharger PDF</label>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handlePdfUpload(e, x.id)}
                                className="border rounded px-3 py-2 w-full"
                                disabled={!!uploadingByXassida[x.id]}
                              />
                              {uploadingByXassida[x.id] && (
                                <div className="mt-2 space-y-1">
                                  <div className="w-full h-2 bg-muted rounded overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all"
                                      style={{ width: `${uploadProgressByXassida[x.id] || 0}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Upload en cours: {uploadProgressByXassida[x.id] || 0}%
                                  </p>
                                </div>
                              )}
                              {uploadErrorByXassida[x.id] && (
                                <p className="text-xs text-red-600 mt-2">{uploadErrorByXassida[x.id]}</p>
                              )}
                            </div>

                            {editorVerses.length > 0 && selectedXassida?.id === x.id && (
                              <div className="space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                  <h4 className="font-bold">Versets éditables ({editorVerses.length})</h4>
                                  <div className="flex items-center gap-2 rounded-lg border px-2 py-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() => setEditorFontSize((prev) => Math.max(MIN_VERSE_FONT_SIZE, prev - 2))}
                                    >
                                      A-
                                    </Button>
                                    <input
                                      type="range"
                                      min={MIN_VERSE_FONT_SIZE}
                                      max={MAX_VERSE_FONT_SIZE}
                                      value={editorFontSize}
                                      onChange={(event) => setEditorFontSize(Number(event.target.value))}
                                      className="w-24 sm:w-32 h-1 accent-primary"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() => setEditorFontSize((prev) => Math.min(MAX_VERSE_FONT_SIZE, prev + 2))}
                                    >
                                      A+
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={currentVersePage === 1}
                                    onClick={() => setCurrentVersePage((page) => Math.max(1, page - 1))}
                                  >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
                                  </Button>
                                  <div className="flex items-center gap-1">
                                    {visiblePageNumbers.map((page) => (
                                      <Button
                                        key={`page-${x.id}-${page}`}
                                        type="button"
                                        variant={currentVersePage === page ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 min-w-8 px-2"
                                        onClick={() => setCurrentVersePage(page)}
                                      >
                                        {page}
                                      </Button>
                                    ))}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={currentVersePage === totalVersePages}
                                    onClick={() => setCurrentVersePage((page) => Math.min(totalVersePages, page + 1))}
                                  >
                                    Suivant <ChevronRight className="w-4 h-4 ml-1" />
                                  </Button>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                  Page {currentVersePage}/{totalVersePages} · Versets {verseStartIndex + 1} à {Math.min(verseStartIndex + VERSES_PER_PAGE, editorVerses.length)}
                                </p>

                                <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-1">
                                  {groupedPaginatedVerses.map((pair, pairIndex) => (
                                    <Card key={`admin-pair-${x.id}-${pair[0]?.verse_number || pairIndex}`} className="border bg-card/40 p-4 [container-type:inline-size]">
                                      <div className="space-y-4">
                                        {pair.map((verse, verseIndexInPair) => {
                                          const verseGlobalIndex = verseStartIndex + pairIndex * 2 + verseIndexInPair;

                                          return (
                                            <div
                                              key={`admin-verse-${x.id}-${verseGlobalIndex}`}
                                              className={verseIndexInPair === 0 && pair.length > 1 ? 'pb-4 border-b border-border/50 space-y-2' : 'space-y-2'}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                                  Verset {verse.verse_number}
                                                </span>
                                                <Input
                                                  type="number"
                                                  min={1}
                                                  value={verse.verse_number}
                                                  onChange={(event) => handleVerseFieldChange(verseGlobalIndex, 'verse_number', Number(event.target.value) || 1)}
                                                  className="h-8 w-24"
                                                />
                                              </div>

                                              <p
                                                className="text-right font-arabic leading-relaxed rounded-lg bg-muted/30 px-3 py-2"
                                                dir="rtl"
                                                style={{ fontSize: `clamp(20px, 6cqi, ${editorFontSize}px)` }}
                                              >
                                                {verse.text_arabic || '—'}
                                              </p>

                                              <Textarea
                                                rows={3}
                                                dir="rtl"
                                                value={verse.text_arabic || ''}
                                                onChange={(event) => handleVerseFieldChange(verseGlobalIndex, 'text_arabic', event.target.value)}
                                                placeholder="Texte arabe"
                                                className="font-arabic"
                                              />
                                              <Input
                                                value={verse.transcription || ''}
                                                onChange={(event) => handleVerseFieldChange(verseGlobalIndex, 'transcription', event.target.value)}
                                                placeholder="Transcription"
                                              />
                                              <Textarea
                                                rows={2}
                                                value={verse.translation_fr || ''}
                                                onChange={(event) => handleVerseFieldChange(verseGlobalIndex, 'translation_fr', event.target.value)}
                                                placeholder="Traduction FR"
                                              />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </Card>
                                  ))}
                                </div>

                                <Button
                                  onClick={() => saveVersesMutation.mutate({ verses: editorVerses })}
                                  className="w-full"
                                  disabled={saveVersesMutation.isPending}
                                >
                                  <Save className="w-4 h-4 mr-2" /> Enregistrer les versets modifiés
                                </Button>
                                {saveVersesMutation.isPending && chunkSaveProgress?.label === 'manual' && (
                                  <p className="text-xs text-muted-foreground text-center">
                                    Sauvegarde en cours: lot {chunkSaveProgress.current}/{chunkSaveProgress.total}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingXassida(x);
                          setShowAudioUploadDialog(true);
                        }}
                        disabled={audioUploadingXassidaId === x.id}
                      >
                        🎵 Audio
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(x)}
                        disabled={updateXassidaMutation.isPending || deleteXassidaMutation.isPending}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteXassida(x)}
                        disabled={deleteXassidaMutation.isPending || updateXassidaMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default XassidasAdmin;
