# IONOS Deploy Now / Starter

Das bestehende **IONOS Deploy Now Starter-Projekt** ist bereits mit diesem Repository und `sith-assembly.com` verbunden. Die Einrichtungswerte sind hier für spätere Wartung dokumentiert.

## 1. Inhalt lokal fertigstellen

Im Hauptverzeichnis der lokalen Repository-Kopie ausführen:

```powershell
npm run check
npm run preview
```

`http://localhost:4173` öffnen. Änderungen in `site/` vornehmen. Die aktuelle Startseite kann als Grundlage dienen; dein eigentlicher Projektinhalt fehlt noch.

## 2. Vorhandenes GitHub-Repository verwenden

Das Repository heißt **SithAssemblyUI**, der Branch ist `main`. Der lokale Web-Ordner ist mit diesem Repository als `origin` verbunden. Kein weiteres Repository und keinen zweiten Remote anlegen.

Für spätere Änderungen:

```powershell
git status
npm run check
git add .
git commit -m "Update Sith Assembly website"
git push
```

`dist/`, `releases/`, lokale Prüfarbeitsdateien und Secrets sind in `.gitignore` ausgeschlossen. `package-lock.json` und `.github/` gehören ins Repository. Der Workflow **Check and build website** erzeugt auf GitHub ein herunterladbares Webhosting-Artefakt.

## 3. Deploy Now einrichten

Im [Deploy-Now-Dashboard](https://ionos.space/) ein Projekt aus dem GitHub-Repository **SithAssemblyUI** verbinden. Die IONOS-GitHub-App für dieses Repository freigeben. Statisches Starter-Projekt und Branch `main` wählen.

Die Werte im Assistenten prüfen bzw. eintragen:

| Feld | Wert |
| --- | --- |
| Sprache / Build-Umgebung | JavaScript / Node.js 22 |
| Working directory | Repository-Root (`.`) |
| Install command | `npm ci --ignore-scripts` |
| Build command | `npm run check` |
| Dist folder / Publish directory | **`dist`** |
| Runtime, Datenbank, Build-Secrets | Für diese statische Website nicht erforderlich |

`npm run check` erzeugt `dist/` und prüft den Build; ein zusätzlicher `npm run build` ist nicht nötig. Der lokale Vorschau-Befehl ist kein Produktions-Startbefehl.

Der aktuelle IONOS-Build führt anschließend `npm run check:apache` auf dem GitHub-Runner aus. Schlagen Serverkonfiguration oder Zugriffstests fehl, wird kein neues Deployment-Artefakt hochgeladen. Die automatische Veröffentlichung ist auf `main` begrenzt. Zusätzliche Staging-Branches müssen später gezielt freigegeben und geprüft werden.

IONOS schreibt beim Setup die projektbezogenen GitHub-Actions-Dateien und Secrets. Diese absichtlich nicht von Hand mit Beispiel-IDs ersetzen. Der mitgelieferte `check-and-build.yml` ergänzt diese um einen unabhängigen Check und ein herunterladbares Webhosting-Artefakt; er selbst deployt nicht.

Falls die erzeugte IONOS-Konfiguration nur `npm run build` verwendet, den Build-Befehl dort auf `npm run check` ändern, damit Fehler das Deployment stoppen. In Workflow v2 muss `DEPLOYMENT_FOLDER` auf `dist` bzw. `./dist` zeigen. Nicht `./` veröffentlichen: Das würde den gesamten Projektordner betreffen.

Nach dem IONOS-Setup dessen erzeugte Dateien auch lokal übernehmen:

```powershell
git pull --ff-only
```

## 4. Vorschau und Domain

Zuerst die von IONOS bereitgestellte HTTPS-Vorschau öffnen. Startseite, mobile Ansicht, Navigation und einen unbekannten Pfad testen. Der unbekannte Pfad muss HTTP 404 liefern und die eigene Fehlerseite anzeigen.

Danach `sith-assembly.com` in der Projektansicht dem Produktions-Deployment zuordnen. IONOS übernimmt bei Deploy Now Zertifikate und HTTPS-Weiterleitung. Die `.htaccess` erzwingt bewusst keine Weiterleitung auf die Hauptdomain, damit die Vorschau-URLs unabhängig funktionieren.

`www.sith-assembly.com` bei Bedarf zusätzlich verbinden und die gewünschte Weiterleitung konfigurieren. Dafür keine IP aus einer fremden Beispielanleitung verwenden. Änderungen an der Domain nach den konkreten Vorgaben deines IONOS-Projekts ausführen; Mail-Einträge nicht nebenbei ersetzen.

Nach der Zuordnung prüfen:

```powershell
curl.exe -I https://sith-assembly.com/
curl.exe -I https://sith-assembly.com/assets/style.css
curl.exe -I https://sith-assembly.com/diese-seite-existiert-nicht
```

Erwartung: `200`, `200`, `404`. Anschließend die Domain im Browser öffnen. Falls die eigene Fehlerseite/Headers fehlen, im Deployment-Dateibrowser nachsehen, ob `.htaccess` im veröffentlichten Root liegt. Eine von IONOS erzeugte `.deploy-now/<projekt>/.htaccess.template` kann die ausgelieferte Datei beeinflussen und muss dann mit `site/.htaccess` abgestimmt werden.

## Spätere Änderungen

In `site/` bearbeiten, `npm run check` ausführen, committen und auf den verbundenen Branch pushen. Nach der Erstverbindung löst ein Push das automatische IONOS-Deployment aus. Den echten Build-/Deploy-Status in GitHub Actions und IONOS prüfen.

Der Deploy-Workflow übergibt dem Template-Schritt keine pauschale Sammlung aller Repository-Secrets. API-Schlüssel und SSH-Zugang werden nur den Schritten gegeben, die sie benötigen. Deploy-IDs werden vor Verwendung validiert; die URL-Ersetzung erfolgt als Zeichenkettenoperation ohne Shell-Auswertung. Details und Grenzen stehen in `docs/HARDENING.md`.

## Offizielle Quellen

Geprüft am 23.09.2026:

- [Statische Websites / Starter-Projekte](https://docs.ionos.space/docs/deploy-static-sites/)
- [Projekt aus einem Repository erstellen](https://docs.ionos.space/docs/from-repo/)
- [Build-Befehl und Veröffentlichungsverzeichnis](https://docs.ionos.space/docs/github-actions-customization/)
- [GitHub-Integration und generierte Workflows](https://docs.ionos.space/docs/git-integration/)
- [Domain und TLS](https://docs.ionos.space/docs/domain-tls/)
- [Apache und .htaccess](https://docs.ionos.space/docs/apache-configuration-htaccess/)
