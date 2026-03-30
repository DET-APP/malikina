import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Upload, Save } from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://malikina-api.onrender.com/api');

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

export function XassidasAdmin() {
  const queryClient = useQueryClient();
  const [selectedXassida, setSelectedXassida] = useState<Xassida | null>(null);
  const [uploadedVerses, setUploadedVerses] = useState<Verse[]>([]);
  const [showAuthorDialog, setShowAuthorDialog] = useState(false);
  const [showXassidaDialog, setShowXassidaDialog] = useState(false);
  const [createNewAuthorMode, setCreateNewAuthorMode] = useState(false); // Toggle for new author mode

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
      setShowXassidaDialog(false);
      setCreateNewAuthorMode(false);
    },
    onError: (error: any) => {
      console.error('❌ Erreur mutation:', error.message || error);
      alert('Erreur: ' + (error.message || 'Impossible de créer la xassida'));
    }
  });

  // Save verses
  const saveVersesMutation = useMutation({
    mutationFn: (data: any) =>
      fetch(`${API_URL}/xassidas/${selectedXassida?.id}/verses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xassidas'] });
      setUploadedVerses([]);
      setSelectedXassida(null);
    }
  });

  // Handle PDF upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, xassidaId: string) => {
    if (!e.target.files?.[0]) return;

    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const response = await fetch(`${API_URL}/xassidas/${xassidaId}/upload-pdf`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setUploadedVerses(data.verses);
    } catch (error) {
      console.error('PDF upload error:', error);
    }
  };

  return (
    <div className="space-y-8 p-6">
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
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...authorForm.register('name')} />
                    </FormControl>
                  </FormItem>
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...authorForm.register('description')} />
                    </FormControl>
                  </FormItem>
                  <FormItem>
                    <FormLabel>URL Photo</FormLabel>
                    <FormControl>
                      <Input {...authorForm.register('photo_url')} type="url" />
                    </FormControl>
                  </FormItem>
                  <FormItem>
                    <FormLabel>Tradition</FormLabel>
                    <FormControl>
                      <Input {...authorForm.register('tradition')} placeholder="Tidjiane, Qadiriyyah, etc." />
                    </FormControl>
                  </FormItem>
                  <Button type="submit" className="w-full">Créer</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authors.map((author: Author) => (
              <Card key={author.id} className="border">
                <CardContent className="pt-6">
                  {author.photo_url && (
                    <img src={author.photo_url} alt={author.name} className="w-full h-48 object-cover rounded mb-4" />
                  )}
                  <h3 className="font-bold text-lg">{author.name}</h3>
                  <p className="text-sm text-gray-600">{author.description}</p>
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
                  <FormItem>
                    <FormLabel className="required">Titre de la xassida *</FormLabel>
                    <FormControl>
                      <Input 
                        {...xassidaForm.register('title', { required: 'Titre requis' })} 
                        placeholder="Ex: Abāda, Khilāsa-Zahab..." 
                        disabled={createXassidaMutation.isPending}
                      />
                    </FormControl>
                    {xassidaForm.formState.errors.title && (
                      <p className="text-red-500 text-sm">{xassidaForm.formState.errors.title.message}</p>
                    )}
                  </FormItem>
                  
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
                      <FormItem>
                        <FormLabel>Sélectionner un auteur *</FormLabel>
                        <FormControl>
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
                        </FormControl>
                        {xassidaForm.formState.errors.author_id && (
                          <p className="text-red-500 text-sm">{xassidaForm.formState.errors.author_id.message}</p>
                        )}
                      </FormItem>
                    )}

                    {/* New author form */}
                    {createNewAuthorMode && (
                      <>
                        <FormItem>
                          <FormLabel className="required">Nom de l'auteur *</FormLabel>
                          <FormControl>
                            <Input 
                              {...xassidaForm.register('author_name', { required: 'Nom requis' })} 
                              placeholder="Ex: Maodo, Cheikh Ahmadou Bamba..." 
                              disabled={createXassidaMutation.isPending}
                            />
                          </FormControl>
                          {xassidaForm.formState.errors.author_name && (
                            <p className="text-red-500 text-sm">{xassidaForm.formState.errors.author_name.message}</p>
                          )}
                        </FormItem>
                        <FormItem>
                          <FormLabel>Description de l'auteur</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...xassidaForm.register('author_description')} 
                              placeholder="Biographie, tradition, période..." 
                              disabled={createXassidaMutation.isPending}
                              rows={3}
                            />
                          </FormControl>
                        </FormItem>
                      </>
                    )}
                  </div>
                  
                  {/* Xassida Description */}
                  <FormItem>
                    <FormLabel>Description de la xassida</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...xassidaForm.register('description')} 
                        placeholder="Contexte, thème, notes..." 
                        disabled={createXassidaMutation.isPending}
                        rows={2}
                      />
                    </FormControl>
                  </FormItem>

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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedXassida(x)}>
                            <Upload className="w-4 h-4 mr-2" /> Ajouter versets
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Ajouter des versets - {x.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Télécharger PDF</label>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handlePdfUpload(e, x.id)}
                                className="border rounded px-3 py-2 w-full"
                              />
                            </div>
                            
                            {uploadedVerses.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="font-bold">Versets extraits ({uploadedVerses.length})</h4>
                                <div className="max-h-96 overflow-y-auto space-y-3">
                                  {uploadedVerses.map((verse, idx) => (
                                    <Card key={idx} className="p-4 border">
                                      <p className="text-sm text-gray-500">Verset {verse.verse_number}</p>
                                      <p className="font-semibold text-lg text-right" dir="rtl">{verse.text_arabic}</p>
                                      <input
                                        type="text"
                                        placeholder="Transcription"
                                        defaultValue={verse.transcription}
                                        onChange={(e) => {
                                          uploadedVerses[idx].transcription = e.target.value;
                                        }}
                                        className="border rounded px-2 py-1 text-sm w-full mt-2"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Traduction FR"
                                        defaultValue={verse.translation_fr}
                                        onChange={(e) => {
                                          uploadedVerses[idx].translation_fr = e.target.value;
                                        }}
                                        className="border rounded px-2 py-1 text-sm w-full mt-1"
                                      />
                                    </Card>
                                  ))}
                                </div>
                                <Button 
                                  onClick={() => saveVersesMutation.mutate({ verses: uploadedVerses })}
                                  className="w-full"
                                >
                                  <Save className="w-4 h-4 mr-2" /> Valider et sauvegarder
                                </Button>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="outline">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
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
