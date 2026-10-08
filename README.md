# LE REÇU

Même envie. Une ligne que tu refuses de payer. La salle vote sans voir la tienne.

## Lancer

```bash
npm install
npm run dev
```

L’app écoute sur le port 8080. Sans `DATABASE_URL`, la salle tourne sur Postgres embarqué (PGLite), en mémoire. Avec une URL Postgres, c’est la base réelle. Le schéma est dans `migrations/0002_strikes.sql`.

Auth désactivée. `.grok/app-env.json` ne contient pas de secret : seulement `VITE_AUTH_ENABLED=false`.

```bash
npm run typecheck
npm run build
```

## Ce que tu fais dans l’app

1. Un reçu du jour s’imprime (huit envies, une par jour).
2. Cinq coûts. Tu en barres un.
3. **Défier** envoie un lien scellé. L’autre barre sans voir ta ligne.
4. Le duel s’ouvre. En dessous, la salle : combien ont barré chaque ligne aujourd’hui.

Les envies libres (« la mienne ») ne vont pas dans la salle. Seules les huit du jeu sont comptées, et un navigateur ne compte qu’une fois par envie et par jour. En dessous de deux refus, le papier dit que la salle est vide.

## Où c’est

| Fichier | Rôle |
|---|---|
| `src/lib/receipt.ts` | Catalogue des coûts, reçu du jour, lien du défi |
| `src/lib/room.functions.ts` | Écriture et lecture de la salle |
| `src/components/receipt-app.tsx` | Le papier |
| `src/styles.css` | Encre, papier, tampon |
| `migrations/0002_strikes.sql` | Table `strikes` |

Pas d’appel à un modèle. Les coûts sont écrits à la main. La table ne garde pas de texte libre : un jour, une envie du jeu, un index 0–4, un jeton anonyme. Ce n’est pas un sondage.
