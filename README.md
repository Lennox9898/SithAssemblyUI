# SithAssemblyUI — Sith Assembly Web

Vorbereitete Website für **sith-assembly.com**: zuerst IONOS Deploy Now / Starter, später normales Linux-Webhosting. Ein Root-Server ist noch nicht eingerichtet.

Quellcode: dieses Repository (**SithAssemblyUI**), Branch `main`.

## Schnellstart unter Windows

Voraussetzung: Node.js 22 oder neuer. Die Website hat keine npm-Abhängigkeiten und benötigt auf dem Hosting keinen laufenden Node-Server.

Ein Terminal im Hauptverzeichnis der lokalen Repository-Kopie öffnen und ausführen:

```powershell
npm run dev
```

Dann **http://localhost:4173** öffnen. Alternativ `START-VORSCHAU.cmd` doppelklicken. Nach Änderungen den Browser neu laden; `Strg+C` beendet die lokale Vorschau.

```powershell
npm run check     # Baut die Website und prüft Dateien, Links, Anker und HTTP-Verhalten
npm run check:apache # Prüft den erzeugten Build mit Apache in Docker (zusätzlich)
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
| `docs/HARDENING.md` | Schutzmaßnahmen, Grenzen und Regressionstests |
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

IONOS ist mit diesem Repository verbunden; `sith-assembly.com` ist veröffentlicht. Ein Push auf `main` startet den IONOS-Build. Erst nach erfolgreichen Node- und Apache-Prüfungen wird der Inhalt von `dist/` übertragen. Der separate Workflow **Check and build website** prüft ebenfalls und stellt ein Webhosting-ZIP als GitHub-Artefakt bereit. Die IONOS-Secrets bleiben in GitHub und werden nicht in die Website eingebaut.

Die IONOS-Dokumentation bestätigt [statische Starter-Projekte ohne Node-Runtime](https://docs.ionos.space/docs/deploy-static-sites/) sowie die [Erstellung der Deploy-Workflows beim Setup](https://docs.ionos.space/docs/git-integration/). Details stehen in `docs/DEPLOY-NOW.md`.

## Stand der Inhalte

Die vorhandene Seite ist eine austauschbare Coming-soon-Startseite mit einer zusätzlichen Login-Ansicht unter `/login/`. Die Login-Ansicht folgt deiner Figma-Vorlage; sie überträgt keine Zugangsdaten und ist noch an keinen Authentifizierungsdienst angeschlossen. Das eigentliche Projekt, Betreiber-/Kontaktangaben und die endgültigen Inhalte sind noch offen. Fonts und Icons liegen lokal; externe Analyse-Skripte und Cookies aus eigenem Website-Code sind nicht eingebunden.

Die Starter-HTML-Seiten tragen `noindex, follow`. Wenn die Website inhaltlich bereit ist, den `noindex`-Eintrag in `site/index.html` entfernen; auf der 404-Seite bleibt er stehen. Betreiberinformationen und Datenschutztexte passend zum tatsächlichen Betrieb ergänzen. Hostingseitige Logs oder Besucherstatistiken werden im IONOS-Konto verwaltet, nicht durch diesen Quellcode.

## Weitere Ausbauschritte

Ein erfolgreicher Build und die tatsächliche Veröffentlichung sind getrennte Workflow-Schritte. Nach Änderungen deshalb auch **Deploy Now: Deploy to IONOS** und die Domain prüfen. Root-Server, Backend, echte Authentifizierung und Datenbank sind noch nicht eingerichtet. Die Apache-Testcontainer laufen nur für die Prüfung und werden anschließend entfernt.
