# Das eigentliche Projekt einfügen

Der Ausgangsordner war leer. Die neue Startseite ist ein Platzhalter für den Projektstart, keine fertige Anwendung.

## Jetzt bearbeiten

- Texte und Seitenaufbau: `site/index.html`.
- Farben und Layout: `site/assets/style.css`; die Farbwerte stehen oben in `:root`.
- Eigenes Logo: `site/assets/favicon.svg` ersetzen und gegebenenfalls das große Zeichen in `index.html` anpassen.
- Weitere Seiten: zum Beispiel `site/projekt/index.html`; erreichbar unter `/projekt/`.
- Bilder und andere öffentliche Dateien: `site/assets/`.

Es gibt kein Frontend-Framework und keine externen npm-Abhängigkeiten. Für neue statische Inhalte reicht HTML/CSS; JavaScript kann später als lokale Datei ergänzt werden. Die aktuelle Content Security Policy erlaubt lokale CSS-/JS-Dateien, aber keine Inline-Skripte und keine externen Dienste. Bei neuen Integrationen die benötigten Quellen gezielt ergänzen.

Die Navigation auf der Startseite funktioniert ohne JavaScript. `START-VORSCHAU.cmd` startet die Ansicht nur auf dem eigenen PC. Die Vorschau ist ein Entwicklungswerkzeug und kein Produktionsserver.

## Vor der eigentlichen Veröffentlichung

Projektbeschreibung und gewünschte Funktionen konkretisieren. Echte Betreiber-/Kontaktinformationen und passende rechtliche Seitentexte ergänzen. Es wurden dafür keine Namen, Adressen oder E-Mail-Postfächer erfunden. Anschließend den `noindex`-Eintrag der Startseite entfernen, falls Suchmaschinen die fertige Website aufnehmen sollen.

`sith-assembly.com` ist bereits als Zieladresse und Canonical-URL eingetragen. Eine Sitemap lohnt sich, wenn die endgültigen öffentlich indexierbaren Seiten feststehen.

## Falls aus der Website eine Anwendung wird

Login, Formulare mit Versand, private Daten, Datei-Uploads oder Hintergrundjobs brauchen zusätzliche Dienste bzw. ein Backend. Ein statischer Starter stellt dafür noch keine Server-Laufzeit bereit. Dafür später den passenden Hosting-Typ wählen und die Anwendung gezielt ergänzen; Zugangsdaten niemals in `site/` ablegen.

Die Build-Grenze bleibt einfach: öffentliche Website hinein in `site/`, auslieferbare Dateien hinaus in `dist/`. Wenn später ein Framework hinzukommt, seinen statischen Export ebenfalls nach `dist/` legen und die Build-Befehle aktualisieren.
