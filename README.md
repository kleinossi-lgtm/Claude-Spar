# Claude-Spar

Mod **spar-modus**: schont dein Kontingent, indem jeder Prompt automatisch am passenden Modell landet.

- **Haiku**: kurze, einfache Fragen und Kleinkram (unter 300 Zeichen, ohne Code- oder Dateibezug).
- **Sonnet**: normale Arbeit (Code, Dateien, Bauen, Fixen, ab 300 Zeichen, unklare Fälle, kurze Zustimmung wie "go" oder "ja").
- **Opus**: schwere Aufgaben (Refactoring, Architektur, Debugging, Analyse, Review, ab 1500 Zeichen).

Ein Turn bleibt bis zum Ende beim gewählten Modell, auch in Tool-Ketten. Mit `++` vor dem Prompt erzwingst du Opus.

Die Statuszeile zeigt bei jeder Antwort das Modell (`Spar-Modus AN · letzte Antwort: Haiku`). Das Seitenfeld "Spar-Modus" hat den Ein/Aus-Schalter und zeigt das zuletzt antwortende Modell. `/spar` öffnet das Feld.

Installieren: `/plugin install spar-modus --marketplace kleinossi-lgtm/claude-spar`
