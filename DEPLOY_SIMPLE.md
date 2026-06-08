# Déploiement simple (recommandé) — tout sur Render

Le projet peut vivre dans **un dépôt Git séparé** (pas dans `player1`) : voir **`REPO_DEDIE.md`**.

Si **GitHub Actions** ou **Netlify** te bloquent : tu n’en as pas besoin pour avoir le site en ligne.

Une seule app sur **[Render](https://render.com)** sert à la fois :

- l’API Node + WebSocket ;
- le site React (fichiers dans `client/dist`).

Même URL partout → **pas de variable `VITE_BACKEND_URL`** à configurer.

---

## Étapes (une fois le code sur GitHub)

1. Compte [render.com](https://render.com) → **New** → **Blueprint** (ou **Web Service**).
2. Connecter le dépôt **`player1`**.
3. Utiliser le fichier **`render.yaml`** à la **racine** du repo (déjà présent).
4. Renseigner dans Render :
   - **`ALLOWED_ORIGINS`** : `https://<nom-du-service>.onrender.com` (l’URL affichée par Render après le premier déploiement, sans `/` final). Tu peux ajouter d’autres domaines séparés par des virgules.
   - **`SENSOR_API_KEY`** : une chaîne longue (optionnel mais recommandé) — la même sur le Raspberry Pi.

5. **Build** : installe dépendances + build React. **Start** : `SERVE_STATIC=1` active le fichier `server/index.js` qui envoie aussi le front.

6. Ouvre l’URL Render : le dashboard doit s’afficher. Le Pi envoie les données sur  
   `POST https://<nom>.onrender.com/api/sensor`.

---

## Ce que tu n’as pas besoin de faire

| Pas obligatoire | |
|-----------------|---|
| GitHub Actions | Le CI est optionnel (utile pour vérifier le build). |
| Netlify | Le front est servi par Render si `SERVE_STATIC=1`. |
| Secret `VITE_BACKEND_URL` | Même origine : le navigateur parle à la même URL. |

---

## En local (test du mode « tout-en-un »)

```bash
cd air-quality-web
npm run install:all
npm run build
cd server && SERVE_STATIC=1 node index.js
```

Puis ouvre `http://localhost:4000`.

---

## Dépannage

- **Page blanche** : vérifier les logs Render — le build doit produire `client/dist`.
- **CORS** : même origine en général OK ; si tu ajoutes un domaine custom, ajoute-le dans `ALLOWED_ORIGINS`.

Pour plus d’options (Netlify séparé, Actions), voir **`DEPLOY.md`**.
