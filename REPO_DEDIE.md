# Avoir `air-quality-web` dans **un autre dossier / un autre dépôt**

Historiquement, le projet a été créé **dans** le dépôt Flutter `player1` parce que c’était le workspace ouvert. Rien n’oblige à le garder là.

## Option 1 — Copier le dossier ailleurs (recommandé)

Dans le terminal (adapte les chemins) :

```bash
# Exemple : nouveau dossier à côté de player1
cp -R /Users/iliasfrej/Desktop/Dev/player1/air-quality-web /Users/iliasfrej/Desktop/Dev/esiee-air-quality
cd /Users/iliasfrej/Desktop/Dev/esiee-air-quality

git init
git add .
git commit -m "Station qualité de l’air ESIEE"
```

Crée un **nouveau dépôt vide** sur GitHub (sans README), puis :

```bash
git remote add origin https://github.com/TON_USER/esiee-air-quality.git
git branch -M main
git push -u origin main
```

**Render** : connecte ce nouveau dépôt. Le fichier **`render.yaml`** à la racine de ce dossier (celui-ci) est fait pour un **repo dont la racine = ce projet** (pas de sous-dossier `air-quality-web`).

## Option 2 — Garder tout dans `player1`

Tu continues à travailler dans `player1/air-quality-web` et tu déploies avec le `render.yaml` à la **racine** du repo `player1` (il contient `rootDir: air-quality-web`).

## Récap

| Situation | Fichier Render à utiliser |
|-----------|---------------------------|
| Repo Git = uniquement le contenu de `air-quality-web` | `air-quality-web/render.yaml` (copié à la racine du nouveau repo) |
| Repo Git = tout le dossier `player1` | `render.yaml` à la racine de `player1` |

Tu peux supprimer la copie dans `player1` plus tard si tu ne veux plus la maintenir à deux endroits — ou la garder comme copie de travail.
