# Wise Weather Rollback Log

## [2026-02-20] - Web App Map Stability Patch
- **Problème** : Écran blanc (WSOD) lors du clic sur l'onglet "Carte".
- **Cause** : Leaflet recevait des coordonnées `undefined` (`Invalid LatLng object`) car l'application tentait d'initialiser ou de mettre à jour la carte avant que le GPS ne soit résolu.
- **Correctif** : Ajout de guards stricts (`typeof location.lat === 'number'`) dans `index.tsx` (lignes ~1468, ~1492, ~1500) pour empêcher toute opération Leaflet sans coordonnées valides.
- **Déploiement** : Base saine commit `40deb6a` (Pollen/Citations OK).

---

## Older logs...
(Détails des versions précédentes conservés dans l'historique git)
