# SithAssemblyUI — Sith Assembly Web

Vorbereitete Website für **sith-assembly.com**: zuerst IONOS Deploy Now / Starter, später normales Linux-Webhosting. Ein Root-Server ist noch nicht eingerichtet.

Quellcode: [Lennox9898/SithAssemblyUI](https://github.com/Lennox9898/SithAssemblyUI), Branch `main`.

## Schnellstart unter Windows

Voraussetzung: Node.js 22 oder neuer. Die Website hat keine npm-Abhängigkeiten und benötigt auf dem Hosting keinen laufenden Node-Server.

```powershell
Set-Location 'E:\SithASM Web'
npm run dev
```

Dann **http://127.0.0.1:4173** öffnen. Alternativ `START-VORSCHAU.cmd` doppelklicken. Nach Änderungen den Browser neu laden; `Strg+C` beendet die lokale Vorschau.

```powershell
npm run check     # Baut die Website und prüft Dateien, Links, Anker und HTTP-Verhalten
npm run build     # Erstellt den veröffentlichten Inhalt in dist/
npm run preview   # Zeigt den gebauten Stand aus dist/
npm run package   # Prüft, baut und erstellt ein Upload-ZIP unter releases/ (Windows)
```

Für das ZIP alternativ `BUILD-WEBHOSTING.cmd` doppelklicken. `.htaccess` liegt im ZIP direkt neben `index.html` und wird mit übertragen.

## Was liegt wo?

| Pfad | Zweck |
| --- | --- |
| `site/index.html` | Texte und Aufbau der Startseite bearbeiten |
| `site/assets/style.css` | Farben, Layout und mobile Darstellung |
| `site/assets/favicon.svg` | Vorläufiges geometrisches Zeichen / Favicon |
| `site/404.html` | Eigene Fehlerseite |
| `site/login/index.html` | Login-Ansicht nach Figma mit E-Mail und Passwort |
| `site/assets/login.css` und `login.js` | Login-Design und lokale Vorschau-Interaktionen |
| `site/.htaccess` | Apache-Konfiguration für Deploy Now und Linux-Webspace |
| `dist/` | Generierte, direkt hochladbare Website; wird beim Build ersetzt |
| `releases/` | Fertige Upload-ZIPs; frühere Pakete bleiben erhalten |
| `docs/DEPLOY-NOW.md` | Erstes IONOS-Deployment über GitHub |
| `docs/WEBHOSTING.md` | Späterer Upload auf normalen Webspace |
| `docs/PROJEKTSTART.md` | Wo du dein eigentliches Projekt einfügst |
| `docs/LOGIN-DESIGN.md` | Figma-Quelle, lokale Assets und Status der Anmeldung |
| `.github/workflows/check-and-build.yml` | GitHub-Prüfung und Download-Artefakt |
| `scripts/` | Lokale Build-, Prüf- und Vorschauwerkzeuge |

Bearbeite **`site/`**, nicht `dist/`. Beide Hosting-Varianten verwenden denselben Build. Die Website ist für das Hauptverzeichnis einer Domain ausgelegt, nicht für eine URL wie `/unterordner/`.

## IONOS Deploy Now: die entscheidenden Einstellungen

| Einstellung | Wert |
| --- | --- |
| Projektart | Statische Website / Starter-Projekt |
| Quellverzeichnis | Repository-Hauptverzeichnis |
| Branch | `main` |
| Build-Umgebung | Node.js 22 |
| Installation | `npm ci --ignore-scripts` |
| Build-Befehl | `npm run check` (enthält den Build) |
| Veröffentlichungsverzeichnis / Dist folder | **`dist`** |
| Ziel-Domain | `sith-assembly.com` nach Prüfung der Vorschau |

Der mitgelieferte GitHub-Workflow prüft und verpackt nur. Die tatsächlichen Deploy-Workflows und zugehörigen Secrets erstellt IONOS beim Verbinden des Repositories. Im IONOS-Konto dafür `Lennox9898/SithAssemblyUI` auswählen und die Werte aus der Tabelle verwenden. Die Verbindung mit IONOS steht noch aus; Projekt-IDs, Zugangsdaten und DNS-Ziele werden beim tatsächlichen Setup gesetzt.

Die IONOS-Dokumentation bestätigt [statische Starter-Projekte ohne Node-Runtime](https://docs.ionos.space/docs/deploy-static-sites/) sowie die [Erstellung der Deploy-Workflows beim Setup](https://docs.ionos.space/docs/git-integration/). Details stehen in `docs/DEPLOY-NOW.md`.

## Stand der Inhalte

Die vorhandene Seite ist eine austauschbare Coming-soon-Startseite mit einer zusätzlichen Login-Ansicht unter `/login/`. Die Login-Ansicht folgt deiner Figma-Vorlage; sie überträgt keine Zugangsdaten und ist noch an keinen Authentifizierungsdienst angeschlossen. Das eigentliche Projekt, Betreiber-/Kontaktangaben und die endgültigen Inhalte sind noch offen. Fonts und Icons liegen lokal; externe Analyse-Skripte und Cookies aus eigenem Website-Code sind nicht eingebunden.

Die Starter-HTML-Seiten tragen `noindex, follow`. Wenn die Website inhaltlich bereit ist, den `noindex`-Eintrag in `site/index.html` entfernen; auf der 404-Seite bleibt er stehen. Betreiberinformationen und Datenschutztexte passend zum tatsächlichen Betrieb ergänzen. Hostingseitige Logs oder Besucherstatistiken werden im IONOS-Konto verwaltet, nicht durch diesen Quellcode.

## Was noch nicht passiert ist

Der Quellcode ist für GitHub vorbereitet. Die Veröffentlichung der Website bei IONOS und die Domain-Umschaltung stehen noch aus. Ein erfolgreicher GitHub-Build ist noch kein bestätigtes IONOS-Deployment. Root-Server, Docker-Dauerbetrieb, Backend und Datenbank bleiben einem späteren Projekt-Schritt vorbehalten.
