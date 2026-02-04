# 🛑 GOLDEN RULES - DO NOT IGNORE

Ces règles sont **ABSOLUES** et prévalent sur toute autre instruction. Toute violation est interdite.

## 1. DÉVELOPPEMENT SÉCURISÉ
> **"TOUJOURS D'ABORD FAIRE LES DEV EN MODE DEV"**
- Tout changement doit être testé localement (`npm run dev`) OU en staging (`npm run deploy:staging`).
- Interdiction formelle de modifier du code sans validation préalable dans un environnement sécurisé.

## 2. PRODUCTION VERROUILLÉE
> **"NE POUSSER EN PRODUCTION QU'AVEC MON ACCORD EXPLICITE"**
- La commande `npm run deploy:prod` nécessite une **PERMISSION EXPLICITE ET ÉCRITE** de l'utilisateur.
- Aucune initiative autonome sur la production. Jamais.

## 3. VERSIONNING GOLDEN MASTER
> **"TU COMMIT MAIS TU NE SAUVEGARDES QUE LORSQUE C'EST MOI QUI LE DEMANDE"**
- Les commits Git sont autorisés pour l'historique de travail.
- La "Sauvegarde" officielle (Tag / Release / Versioning définitif) se fait uniquement sur demande.
- Le format de version actuel est : **Golden Master V2.2.12**.

---
*Ce document fait loi à partir du 06 Janvier 2026, suite à l'incident "White Screen".*
