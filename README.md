# LE REÇU

Même envie. Une ligne que tu refuses de payer. La salle vote sans voir la tienne.

Ce n'est pas un conseil. C'est un prix, puis un désaccord.

## Ce que tu fais

1. Un reçu du jour s'imprime (huit envies, une par jour).
2. Cinq coûts. Tu en barres un.
3. **Défier** envoie un lien scellé. L'autre barre sans voir ta ligne.
4. Le duel s'ouvre. En dessous, la salle : combien ont barré chaque ligne aujourd'hui.

Les envies libres (« la mienne ») ne vont pas dans la salle. Seules les huit du jeu sont comptées, et un navigateur ne compte qu'une fois par envie et par jour.

## Pourquoi c'est construit comme ça

Sur X, ce qui voyage est court, prend un camp, et tient dans un screenshot : un chiffre, pas un lien. Le reçu seul est un objet. La salle est le chiffre. En dessous de deux refus, le papier dit que la salle est vide. Pas de faux 100 %.

## Pile

- React 19, TanStack Start, Tailwind v4
- Fraunces (le titre) et IBM Plex Mono (le ticket)
- Postgres pour la salle. En production : Neon. Sans `DATABASE_URL` : PGLite, pour que l'aperçu tourne quand même.

Pas d'appel à un modèle. Les coûts sont écrits à la main dans `src/lib/receipt.ts`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/lib/receipt.ts` | Catalogue des coûts, reçu du jour, lien du défi, décompte |
| `src/lib/room.functions.ts` | Écriture et lecture de la salle |
| `src/components/receipt-app.tsx` | Le papier |
| `src/styles.css` | Encre, papier, tampon |
| `migrations/0002_strikes.sql` | Table `strikes` |
| `public/favicon.svg` | L'icône |

La table ne garde pas de texte libre. Une ligne, c'est un jour, une envie du jeu, un index 0–4, et un jeton anonyme. Ce n'est pas un sondage. Quelqu'un de motivé peut gonfler le chiffre.
