# Déploiement complet : Render (API) + Netlify (site)

**Netlify** = site React (statique). **Render** = API Node + WebSocket (toujours actif avec limites du plan gratuit).

Ordre recommandé : **1) Render** → noter l’URL HTTPS → **2) Netlify** avec `VITE_BACKEND_URL` → **3) Pi** avec `API_URL`.

---

## 1. API sur Render

### Option A — Blueprint (fichier à la racine du dépôt)

1. [Render](https://render.com) → **New** → **Blueprint**.
2. Connecter le dépôt GitHub `player1`, pointer vers **`render.yaml`** à la **racine** du repo.
3. Renseigner les variables marquées *sync: false* dans le dashboard :
   - **`ALLOWED_ORIGINS`** : `https://TON-SITE.netlify.app` (ton URL Netlify exacte, `https`, sans slash final). Tu pourras l’ajuster après création du site.
   - **`SENSOR_API_KEY`** : une chaîne longue aléatoire (la même sera utilisée sur le Raspberry Pi).

4. Déployer. URL du service : `https://<nom>.onrender.com`.

### Option B — Service web manuel

1. **New** → **Web Service** → même dépôt.
2. **Root directory** : `air-quality-web/server`
3. **Build** : `npm install`  
4. **Start** : `npm start`
5. Variables :

| Clé | Valeur |
|-----|--------|
| `NODE_VERSION` | `20` |
| `DISABLE_MOCK` | `1` |
| `ALLOWED_ORIGINS` | `https://ton-site.netlify.app` |
| `SENSOR_API_KEY` | *(optionnel mais recommandé)* |

6. **Health check path** : `/api/health` (optionnel, Render le propose).

---

## 2. Site sur Netlify

### Option A — Depuis Git (simple)

1. [Netlify](https://netlify.com) → **Add new site** → **Import from Git**.
2. **Base directory** : `air-quality-web`
3. Build / publish sont lus depuis `netlify.toml` (`client/dist`).
4. **Site settings → Environment variables → Build** :

| Clé | Valeur |
|-----|--------|
| `VITE_BACKEND_URL` | `https://<nom>.onrender.com` |

5. **Deploy site**. Ouvre l’URL Netlify : le dashboard doit afficher les données (mock désactivé côté Render : uniquement ce que le Pi envoie, ou réactive temporairement le mock en mettant `DISABLE_MOCK=0` sur Render).

6. Remets **`ALLOWED_ORIGINS`** sur Render avec l’URL Netlify **définitive** (domaine `.netlify.app` ou domaine custom).

### Option B — GitHub Actions (déploiement depuis Actions)

1. Netlify → **User settings** → **Applications** → **Personal access tokens** → créer un token.
2. Netlify → **Site settings** → **Site details** → copier **Site ID**.
3. GitHub → dépôt **player1** → **Settings** → **Secrets and variables** → **Actions** → ajouter :

| Secret | Contenu |
|--------|---------|
| `NETLIFY_AUTH_TOKEN` | Token Netlify |
| `NETLIFY_SITE_ID` | Site ID |
| `AIR_QUALITY_BACKEND_URL` | `https://<nom>.onrender.com` |

4. **Actions** → workflow **« Air quality — Deploy Netlify »** → **Run workflow**.

Le build injecte `VITE_BACKEND_URL` depuis `AIR_QUALITY_BACKEND_URL`.

### Déploiement local (CLI)

```bash
cd air-quality-web
export VITE_BACKEND_URL="https://<nom>.onrender.com"
npm run build
npx netlify-cli login
npx netlify-cli deploy --dir=client/dist --prod
```

Ou : `npm run deploy:netlify` (après `export VITE_BACKEND_URL=...` pour le build — le script enchaîne build + deploy ; pour injecter l’URL, exporter la variable avant).

---

## 3. Raspberry Pi

```bash
export API_URL="https://<nom>.onrender.com"
export SENSOR_API_KEY="la-même-clé-que-Render"
cd air-quality-web/raspberry-pi
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 pi_sensor_sender.py
```

Voir `raspberry-pi/README.md` et `MOCK_MODE=1` pour tester sans capteurs.

---

## 4. CI GitHub

Le workflow **« Air quality — CI (build client) »** compile le front à chaque changement sous `air-quality-web/`. Aucun secret requis.

---

## Dépannage

| Problème | Piste |
|----------|--------|
| CORS / socket bloqué | `ALLOWED_ORIGINS` = URL Netlify exacte (`https://…`). |
| Page blanche / pas de données | `VITE_BACKEND_URL` correct, **rebuild** Netlify après changement. |
| 401 sur POST capteurs | `SENSOR_API_KEY` identique Render + Pi, header `X-API-Key`. |
| 404 sur `/historique` au refresh | `netlify.toml` contient déjà la redirection SPA vers `index.html`. |
| Render lent au réveil | Normal en plan gratuit ; premier hit peut prendre ~1 min. |
