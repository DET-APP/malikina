# Docker Setup Guide pour Malikina API

## 📋 Pré-requis

- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git

## 🚀 Démarrage Rapide

### 1. Configuration

```bash
# Copier et configurer les variables d'environnement
cp .env.docker .env.docker.local

# Éditer et remplacer les mots de passe par défaut
nano .env.docker.local
```

### 2. Lancer les services

```bash
# Démarrer tous les services (API + PostgreSQL)
docker-compose up -d

# Ou avec les logs visibles
docker-compose up

# Pour arrêter
docker-compose down

# Pour arrêter et supprimer les volumes (données)
docker-compose down -v
```

### 3. Vérifier le statut

```bash
# Voir tous les conteneurs
docker-compose ps

# Voir les logs
docker-compose logs -f api          # Logs de l'API
docker-compose logs -f postgres     # Logs de PostgreSQL
docker-compose logs -f              # Tous les logs

# Arrêter un service spécifique
docker-compose stop api
docker-compose start api
```

## 📱 Services Disponibles

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| **API** | 5000 | http://localhost:5000 | - |
| **PostgreSQL** | 5432 | localhost | user: `malikina` |
| **PgAdmin** | 5050 | http://localhost:5050 | admin@malikina.local |
| **Redis** (optional) | 6379 | localhost | - |

## 🗄️ Gestion de la Base de Données

### Migrations

```bash
# Exécuter les migrations (auto au démarrage)
docker-compose exec postgres bash /docker-entrypoint-initdb.d/001_create_base_tables.sql

# Ou manuellement
docker-compose exec api npm run db:migrate
```

### Accéder à PostgreSQL

```bash
# Via psql
docker-compose exec postgres psql -U malikina -d malikina

# Dans psql:
\dt              # Voir les tables
\du              # Voir les utilisateurs
SELECT * FROM authors;  # Voir les auteurs
```

### Backup et Restore

```bash
# Backup complet
docker-compose exec postgres pg_dump -U malikina -d malikina > backup.sql

# Restore
docker-compose exec -T postgres psql -U malikina -d malikina < backup.sql

# Backup format custom (plus compact)
docker-compose exec postgres pg_dump -U malikina -d malikina -Fc > backup.dump
```

### Réinitialiser la BDD

```bash
# Vider toutes les tables
docker-compose exec api bash /app/db/reset.sh

# Puis relancer les migrations
docker-compose restart postgres
```

## 🔧 Commandes Utiles

### Build et Rebuild

```bash
# Build l'image API
docker-compose build api

# Rebuild sans cache
docker-compose build --no-cache api

# Rebuild tout
docker-compose build --no-cache
```

### Logs et Debug

```bash
# Logs API avec tail
docker-compose logs -f api --tail 50

# Logs PostgreSQL
docker-compose logs postgres

# Voir tous les logs depuis 10 minutes
docker-compose logs --since 10m

# Exécuter une commande dans le container
docker-compose exec api npm run scrape
docker-compose exec api npm run build

# Accès shell
docker-compose exec api sh
docker-compose exec postgres bash
```

### Nettoyage

```bash
# Arrêter et supprimer tout
docker-compose down

# Supprimer aussi les volumes (données)
docker-compose down -v

# Supprimer les images
docker-compose down --rmi all

# Supprimer les conteneurs arrêtés
docker container prune

# Supprimer tout (volumes, images, réseaux)
docker system prune -a --volumes
```

## 🔐 PgAdmin (Gestion GUI)

Démarrer PgAdmin avec :
```bash
docker-compose --profile debug up -d
```

Puis accéder à : http://localhost:5050

**Credentials par défaut:**
- Email: `admin@malikina.local`
- Password: `admin_password_change_me`

Pour ajouter le serveur PostgreSQL dans PgAdmin :
- Server: `postgres` (le hostname du service)
- Port: `5432`
- User: `malikina`
- Password: `[votre_password]`

## 📦 Déploiement DigitalOcean App Platform

### 1. Push vers GitHub
```bash
git add .
git commit -m "feat: add docker configuration"
git push origin dev
```

### 2. Déployer sur DigitalOcean

Via CLI:
```bash
# Installer doctl
brew install doctl

# Configurer avec ta clé API
doctl auth init

# Déployer depuis docker-compose.yml
doctl apps create --spec docker-compose.yml
```

Via Dashboard:
1. Aller à: https://cloud.digitalocean.com/apps
2. Cliquer "Create App"
3. Connecter ton repo GitHub
4. Sélectionner le branch `dev`
5. DigitalOcean détectera le `docker-compose.yml`
6. Configurer les variables d'environnement
7. Déployer

### 3. Variables d'environnement sur DigitalOcean

Ajouter dans le dashboard ou via CLI :
```bash
doctl apps update <app-id> --spec app.yaml
```

## 🐛 Troubleshooting

### API ne démarre pas

```bash
# Vérifier les logs
docker-compose logs api

# Vérifier la connexion à PostgreSQL
docker-compose exec api npm run db:ping

# Vérifier la santé
curl http://localhost:5000/api/health
```

### PostgreSQL ne démarre pas

```bash
# Vérifier les logs
docker-compose logs postgres

# Vérifier les permissions du volume
ls -la $(docker volume inspect malikina_postgres_data --format '{{.Mountpoint}}')
```

### CORS errors

```bash
# Vérifier CORS dans les logs
docker-compose logs api | grep CORS

# Vérifier la variable FRONTEND_URL
docker-compose exec api printenv FRONTEND_URL
```

### Port déjà en utilisation

```bash
# Changer les ports dans docker-compose.yml
# Ou trouver ce qui utilise le port
lsof -i :5000
lsof -i :5432
```

## 🐳 Production Checklist

- [ ] Changer tous les mots de passe par défaut
- [ ] Configurer les backups PostgreSQL
- [ ] Activer les logs centralisés
- [ ] Configurer HTTPS/SSL
- [ ] Configurer les limites de ressources
- [ ] Mettre en place la monitoring
- [ ] Configurer les alertes
- [ ] Tester la récupération après panne
- [ ] Documenter les procédures opérationnelles

## 📚 Références

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
