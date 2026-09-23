# Absicherung der aktuellen Website

Stand: 23.09.2026. Umfang: öffentliche statische Website, lokale Vorschau, Build/ZIP und GitHub/IONOS-Deployment. Es gibt weder Benutzerkonten noch eine Datenbank oder geschützte Server-Endpunkte.

## Gefundene Fehler und Korrekturen

| Bereich | Bisheriges Verhalten | Korrektur |
| --- | --- | --- |
| Vorschau | Ein sichtbarer Verzeichnislink auf einen versteckten Ordner innerhalb von `site/` konnte dessen Dateien ausliefern. Geprüft wurde nur die angefragte URL, nicht die verborgenen Bestandteile des aufgelösten Pfads. | Den tatsächlich aufgelösten Pfad einschließlich Dateityp prüfen; externe und versteckte Ziele abweisen. |
| Veröffentlichungsinhalt | Die bisherige kurze Sperrliste ließ beispielsweise SQL-Dumps, ZIP-Backups, PHP und PFX-Dateien durch. Auch ein verknüpftes `site/` als Wurzel wurde nicht abgewiesen. | Öffentliche Dateitypen ausdrücklich erlauben und verknüpfte Quellwurzeln abweisen. Die Vorschau nutzt dieselbe Liste. |
| Deploy-Helfer | Shell-Ersetzung von Deploy-ID und URL; Dateinamen mit Leerzeichen wurden beim Ersetzen der URL falsch getrennt. | Validierte IDs, Übergabe über Umgebungsvariablen und direkte Zeichenketten-Ersetzung in Textdateien. Binäre Assets bleiben unverändert. |
| Login-Entwurf | Eingaben konnten beim Weg- und Zurücknavigieren im Browser stehen bleiben. | Felder bei Navigation, Wiederherstellung und Absenden leeren; Passwort wieder verbergen. |

Die Vorschau ist weiterhin ausschließlich an `127.0.0.1` gebunden. Die Dateifehler setzten entsprechende lokale Inhalte oder Verknüpfungen voraus; sie sind kein Nachweis eines bereits erfolgten Angriffs auf die öffentliche Domain. Der Deploy-Einstieg ist auf berechtigte Repository-Akteure und IONOS beschränkt. Die Entfernung der Shell-Auswertung ist vorbeugende Härtung, kein Nachweis einer anonym ausnutzbaren Befehlsausführung.

## Zusätzliche Schutzmaßnahmen

- Apache und Vorschau liefern eine abgestimmte Content Security Policy. Skripte, Styles, Bilder und Fonts kommen von derselben Website; Formübertragung, Hintergrundanfragen, fremde Einbettung, Plug-ins und Änderungen der Basis-URL sind gesperrt.
- Apache blockiert Verzeichnisauflistung, automatische Dateinamenergänzung, Dotfiles, typische Backups/Schlüssel/Dumps und Server-Skripte. Er akzeptiert für diesen rein statischen Stand nur GET und HEAD.
- HTTPS erhält HSTS für den jeweils aufgerufenen Host, ohne `includeSubDomains` oder Preload. Login-Antworten haben `Cache-Control: no-store`.
- Die lokale Vorschau prüft den Host-Header zusätzlich zur Loopback-Bindung und begrenzt Header-, Request- und Keep-alive-Zeiten.
- GitHub-Actions sind auf überprüfte Commit-SHAs festgelegt, Checkout speichert keinen Git-Zugang und der Build erhält nur den IONOS-API-Schlüssel statt aller Secrets. Dependabot schlägt Action-Updates als Pull Requests vor; es gibt kein automatisches Zusammenführen.
- Produktionsbuilds und Deploys laufen nur auf `main`, mit Zeitlimits und getrennten Concurrency-Gruppen. Der ungenutzte Push-Trigger im reinen Deploy-Workflow wurde entfernt; der IONOS-Orchestrator löst die Veröffentlichung weiterhin aus.

## Prüfung

`npm run check` führt Regressionstests mit synthetischen Daten und isolierten temporären Verzeichnissen aus und prüft anschließend den echten Build, Links, Anker, Antwortinhalte und HTTP-Verhalten. Die Tests benötigen keine npm-Pakete.

`npm run check:apache` prüft den zuvor erzeugten Build in einem temporären Apache-Container: gültige Seiten/Assets, Header, eigene 404-Seite, verbotene Dateitypen, Verzeichnisauflistung, HTTP-Methoden und Login-Cache-Regeln. Der Container bindet nur Loopback, läuft ohne Root und ohne Linux-Capabilities, erhält schreibgeschützte Testdateien und wird am Ende entfernt. Auf GitHub muss diese Prüfung vor dem IONOS-Upload erfolgreich sein.

## Grenzen und spätere Erweiterungen

- Eine erlaubte `.json`- oder `.txt`-Datei kann trotzdem sensible Inhalte enthalten. Alles in `site/` ist als öffentlich zu behandeln; die Dateitypliste ersetzt keine Inhaltsprüfung.
- Die gepinnte IONOS-Deploy-Action verwendet intern weiterhin das vom Anbieter verwaltete Container-Tag `ghcr.io/ionos-deploy-now/deploy-to-ionos:v2.1.0`. Die äußere Action-Pin ist keine Garantie für unveränderte transitive Container-Inhalte.
- Direkte Pushes auf `main` sind weiterhin Teil des gewählten Arbeitsablaufs. Änderungen mit Schreibzugriff auf das Repository sind vertrauenswürdig vorausgesetzt; die Konfiguration schützt nicht vor einem übernommenen Betreiberkonto.
- Serverbetriebssystem, IONOS-interne Plattform, Account-Sicherheit und etwaige Anbieter-Logs wurden nicht vollständig auditiert.
- Vor echter Authentifizierung müssen Backend, serverseitige Zugriffskontrolle, Sitzungen und Passwort-Reset umgesetzt und separat geprüft werden. Erst dann gezielt die benötigten API-Quellen und Methoden zulassen.

Quellen für die Härtung: [GitHub: sichere Workflows](https://docs.github.com/en/actions/reference/security/secure-use), [Apache: mod_headers](https://httpd.apache.org/docs/2.4/mod/mod_headers.html), [IONOS: Build-Konfiguration](https://docs.ionos.space/docs/github-actions-customization/).
