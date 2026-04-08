# Branch & Deploy Rules

## Règle principale

- Si la modification concerne l'API:
  - Travailler sur la branche `dev`
  - Déployer sur l'environnement lié à `dev`

- Si la modification ne concerne pas l'API (frontend, UI, docs, etc.):
  - Travailler sur la branche `main`
  - Déployer sur l'environnement lié à `main`

## Application

- Ces règles s'appliquent par défaut pour toute nouvelle demande.
- Une exception n'est possible que si l'utilisateur la demande explicitement.
