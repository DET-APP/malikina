import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus, Search, Globe, Edit2, Trash2, Loader2, Brain,
  ChevronLeft, ChevronRight, Database, Link, Languages,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL as API_URL } from '@/lib/apiUrl';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KnowledgeChunk {
  id: string;
  source: string;
  title: string;
  language: string;
  created_at: string;
  content_preview: string;
  metadata: any;
}

interface KnowledgeChunkFull extends KnowledgeChunk {
  content: string;
}

interface KnowledgeStats {
  total: number;
  sources: number;
  auto_enriched: number;
}

interface KnowledgePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface KnowledgeListResponse {
  data: KnowledgeChunk[];
  pagination: KnowledgePagination;
}

interface ChunkForm {
  source: string;
  title: string;
  language: string;
  content: string;
}

const EMPTY_FORM: ChunkForm = { source: '', title: '', language: 'fr', content: '' };

const LANG_LABELS: Record<string, string> = { fr: 'Français', ar: 'Arabe', wo: 'Wolof' };
const LANG_COLORS: Record<string, string> = {
  fr: 'bg-blue-100 text-blue-800',
  ar: 'bg-green-100 text-green-800',
  wo: 'bg-yellow-100 text-yellow-800',
};

function truncate(text: string, max: number) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ─── KnowledgeManager ─────────────────────────────────────────────────────────

export default function KnowledgeManager() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const authHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  // UI state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showWebImportDialog, setShowWebImportDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Forms
  const [addForm, setAddForm] = useState<ChunkForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<ChunkForm & { id: string }>({ ...EMPTY_FORM, id: '' });
  const [webQuery, setWebQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState('');

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: stats } = useQuery<KnowledgeStats>({
    queryKey: ['knowledge-stats'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/knowledge/stats`, { headers: authHeaders });
      if (!res.ok) throw new Error('Erreur stats');
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: listData, isLoading: listLoading } = useQuery<KnowledgeListResponse>({
    queryKey: ['knowledge-list', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`${API_URL}/knowledge?${params}`, { headers: authHeaders });
      if (!res.ok) throw new Error('Erreur liste');
      return res.json();
    },
    staleTime: 15_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['knowledge-list'] });
    queryClient.invalidateQueries({ queryKey: ['knowledge-stats'] });
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (form: ChunkForm) => {
      const res = await fetch(`${API_URL}/knowledge`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur'); }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setShowAddDialog(false);
      setAddForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (form: ChunkForm & { id: string }) => {
      const { id, ...body } = form;
      const res = await fetch(`${API_URL}/knowledge/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur'); }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setShowEditDialog(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/knowledge/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur'); }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setShowDeleteConfirm(false);
      setDeletingId(null);
    },
  });

  const webImportMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await fetch(`${API_URL}/knowledge/web-import`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ query }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erreur'); }
      return res.json();
    },
    onSuccess: (data) => {
      invalidate();
      setShowWebImportDialog(false);
      setWebQuery('');
      alert(`${data.inserted} chunk(s) importé(s) avec succès.`);
    },
    onError: (err: any) => {
      alert(`Erreur : ${err.message}`);
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openEdit = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/knowledge/${id}`, { headers: authHeaders });
      if (!res.ok) return;
      const chunk: KnowledgeChunkFull = await res.json();
      setEditForm({
        id: chunk.id,
        source: chunk.source || '',
        title: chunk.title || '',
        language: chunk.language || 'fr',
        content: chunk.content || '',
      });
      setShowEditDialog(true);
    } catch {
      alert('Impossible de charger le chunk');
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const chunks = listData?.data || [];
  const pagination = listData?.pagination;

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-3 text-center">
            <Database className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats?.total ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Chunks total</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-3 text-center">
            <Link className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats?.sources ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Sources uniques</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-3 text-center">
            <Globe className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats?.auto_enriched ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Auto-enrichis</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1 flex-1 min-w-0">
          <Input
            placeholder="Rechercher..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="w-4 h-4" />
          </Button>
          {search && (
            <Button variant="ghost" size="icon" onClick={handleClearSearch}>
              <span className="text-xs">✕</span>
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWebImportDialog(true)}
          className="gap-1.5 shrink-0"
        >
          <Globe className="w-4 h-4" />
          Recherche web
        </Button>
        <Button
          size="sm"
          onClick={() => { setAddForm(EMPTY_FORM); setShowAddDialog(true); }}
          className="gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {listLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : chunks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucun chunk trouvé</p>
              {search && <p className="text-xs mt-1">Essayez avec d'autres termes</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Source</TableHead>
                    <TableHead className="w-[35%]">Titre</TableHead>
                    <TableHead className="w-[10%]">Langue</TableHead>
                    <TableHead className="w-[10%]">Date</TableHead>
                    <TableHead className="w-[15%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chunks.map(chunk => (
                    <TableRow key={chunk.id}>
                      <TableCell className="text-xs text-muted-foreground font-mono break-all">
                        {truncate(chunk.source || '—', 40)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {truncate(chunk.title || chunk.content_preview || '—', 50)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs px-1.5 py-0 ${LANG_COLORS[chunk.language] || 'bg-gray-100 text-gray-700'}`}
                          variant="secondary"
                        >
                          {LANG_LABELS[chunk.language] || chunk.language}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(chunk.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(chunk.id)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingId(chunk.id);
                              setDeletingTitle(chunk.title || chunk.source || 'ce chunk');
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Dialog : Ajouter un chunk ─────────────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un chunk de connaissance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Source (URL ou référence)</label>
              <Input
                placeholder="https://... ou Manuel / Coran / Hadith..."
                value={addForm.source}
                onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Titre</label>
              <Input
                placeholder="Titre du document ou sujet..."
                value={addForm.title}
                onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Langue</label>
              <Select value={addForm.language} onValueChange={v => setAddForm(f => ({ ...f, language: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ar">Arabe</SelectItem>
                  <SelectItem value="wo">Wolof</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Contenu *</label>
              <Textarea
                placeholder="Texte du chunk de connaissance..."
                rows={7}
                value={addForm.content}
                onChange={e => setAddForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => createMutation.mutate(addForm)}
              disabled={createMutation.isPending || !addForm.content.trim()}
            >
              {createMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Créer le chunk</>
              )}
            </Button>
            {createMutation.isError && (
              <p className="text-xs text-destructive text-center">{(createMutation.error as any)?.message}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog : Modifier un chunk ────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le chunk</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Source</label>
              <Input
                value={editForm.source}
                onChange={e => setEditForm(f => ({ ...f, source: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Langue</label>
              <Select value={editForm.language} onValueChange={v => setEditForm(f => ({ ...f, language: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ar">Arabe</SelectItem>
                  <SelectItem value="wo">Wolof</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Contenu *</label>
              <Textarea
                rows={8}
                value={editForm.content}
                onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => updateMutation.mutate(editForm)}
              disabled={updateMutation.isPending || !editForm.content.trim()}
            >
              {updateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sauvegarde...</>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
            {updateMutation.isError && (
              <p className="text-xs text-destructive text-center">{(updateMutation.error as any)?.message}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog : Recherche web ────────────────────────────────────────── */}
      <Dialog open={showWebImportDialog} onOpenChange={setShowWebImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Enrichissement via recherche web
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Recherche via Brave Search API et importe les résultats dans la base de connaissances du chatbot.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Requête de recherche</label>
              <Input
                placeholder="ex: Tidjani prière sénégal, Coran tafsir..."
                value={webQuery}
                onChange={e => setWebQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && webQuery.trim() && webImportMutation.mutate(webQuery)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => webImportMutation.mutate(webQuery)}
              disabled={webImportMutation.isPending || !webQuery.trim()}
            >
              {webImportMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recherche en cours...</>
              ) : (
                <><Globe className="w-4 h-4 mr-2" /> Importer les résultats</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Nécessite BRAVE_API_KEY configuré sur le serveur.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog : Confirmation suppression ────────────────────────────── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Supprimer <span className="font-medium text-foreground">"{truncate(deletingTitle, 50)}"</span> ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => deletingId && deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Suppression...</>
                ) : (
                  <><Trash2 className="w-4 h-4 mr-2" /> Supprimer</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
