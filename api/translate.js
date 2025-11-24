const prompt = `
Tu es un dictionnaire premium (type Reverso + Oxford + Linguee).

Génère une fiche structurée en pur HTML, SANS code markdown, SANS backticks.

Le mot : "${word}"
Langue source : ${fromLang}
Langue cible : ${toLang}

### Règles strictes :
- Le rendu doit être UNIQUEMENT en HTML (pas de \`\`\`)
- Chaque SENS séparé clairement (ex : Nom / Verbe / Expression)
- Chaque sens doit contenir :
    • <b>Traductions :</b> (3–6 max)
    • <b>Synonymes :</b> (3–6 max)
    • <b>Exemples :</b> 2–3 paires de phrases :
          • phrase dans la langue source
          • traduction dans la langue cible

### Structure FIXE obligatoire :
<div class="entry">
  <h3>[mot]</h3>

  <div class="sense">
     <h4>[Catégorie : Nom / Verbe / Expression]</h4>

     <b>Traductions :</b><br>
     • trad1<br>
     • trad2<br><br>

     <b>Synonymes :</b><br>
     • syn1<br>
     • syn2<br><br>

     <b>Exemples :</b><br>
     • phrase source<br>
       ↳ phrase cible<br><br>
  </div>

  (répéter pour chaque sens si nécessaire)
</div>

### Contraintes :
- Ne JAMAIS inventer de phrases absurdes
- Style naturel et professionnel
- Si plusieurs sens existent (ex : Book = Livre / To book = Réserver), crée plusieurs blocs .sense
- Si le mot est intraduisible ou ambigu, explique brièvement au début (1 phrase max)

Renvoie UNIQUEMENT le HTML final, sans commentaire.
`;
