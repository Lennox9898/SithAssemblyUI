# Später: normales Webhosting

Das gleiche Projekt kann auf normalem **Linux-/Apache-Webspace** laufen. Node.js wird nur auf deinem PC oder beim Build benötigt. Auf dem Webspace liegen anschließend HTML, CSS, SVG und `.htaccess`.

Ein reiner Domain-Vertrag enthält nicht automatisch Webspace. Ein passender Webhosting-Vertrag und ein SFTP-Zugang sind dafür noch erforderlich. Diese Anleitung richtet keinen Root-Server ein.

## 1. Upload-Paket erstellen

```powershell
Set-Location 'E:\SithASM Web'
npm run package
```

Oder `BUILD-WEBHOSTING.cmd` doppelklicken. Das Paket entsteht unter `releases/sith-assembly-webhosting-DATUM-UHRZEIT.zip`.

Der ZIP-Inhalt beginnt direkt mit `index.html`, `.htaccess`, `404.html`, `robots.txt` und `assets/`. Es gibt keinen zusätzlichen `dist/`-Überordner im ZIP. Das Skript prüft ausdrücklich, dass `.htaccess` mit verpackt wurde.

## 2. Auf den Webspace laden

1. In IONOS die SFTP-Zugangsdaten für den gewünschten Vertrag abrufen. Den dort angezeigten Servernamen verwenden.
2. Ein eigenes Zielverzeichnis für diese Website wählen, zum Beispiel `/sith-assembly`. Eine dort vorhandene Website vorher sichern.
3. Das ZIP lokal entpacken und **seinen gesamten Inhalt** in dieses Zielverzeichnis übertragen. Versteckte Dateien im SFTP-Programm einblenden und `.htaccess` mitnehmen. Alternativ den Inhalt von `dist/` direkt übertragen.
4. In IONOS `sith-assembly.com` mit genau diesem Webspace-Verzeichnis verbinden. `index.html` muss unmittelbar in diesem Verzeichnis liegen.
5. SSL für die Domain im Hosting aktivieren und `https://sith-assembly.com/` prüfen.

Nur den erzeugten Website-Inhalt hochladen. `scripts/`, `docs/`, `.git/`, `.github/`, `package.json` und Zugangsdaten gehören nicht in das öffentlich erreichbare Webverzeichnis.

## 3. HTTP nach HTTPS weiterleiten

IONOS Deploy Now erledigt das bereits. Auf normalem Webhosting bevorzugt die vom Anbieter angebotene HTTPS-Weiterleitung verwenden. Wenn der Apache TLS selbst erkennt und keine vorgeschaltete TLS-Terminierung verwendet wird, kann nach erfolgreicher Zertifikatseinrichtung folgender Block in `site/.htaccess` ergänzt werden:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://sith-assembly.com%{REQUEST_URI} [R=301,L]
</IfModule>
```

Neu bauen und hochladen. Diese Option nur auf dem normalen Hosting einsetzen, nicht unbesehen für Deploy-Now-Vorschauen übernehmen. Bei Weiterleitungsschleifen die Hosting-eigene Einstellung nutzen und die Zusatzregel wieder entfernen.

## 4. Prüfen

```powershell
curl.exe -I https://sith-assembly.com/
curl.exe -I https://sith-assembly.com/assets/style.css
curl.exe -I https://sith-assembly.com/unbekannter-pfad
curl.exe -I https://sith-assembly.com/.htaccess
```

Erwartung: Startseite und CSS `200`, unbekannter Pfad `404`, direkter Zugriff auf `.htaccess` `403` oder `404`. Die Website danach im Browser und auf einem Handy öffnen.

Falls nur auf dem Hoster ein `500` auftritt, dessen Fehlerprotokoll ansehen. Manche Tarife schränken einzelne `.htaccess`-Direktiven ein. Ursache anhand des Logs gezielt anpassen; nicht pauschal alle Einstellungen entfernen.

## Updates und Rückkehr zu einem älteren Stand

Für jedes Update ein neues ZIP erstellen. Alte ZIPs bleiben unter `releases/` erhalten. Vor dem Überschreiben die bisherige Webspace-Version sichern. Bei Problemen den bisherigen Inhalt wiederherstellen. Ein einfacher Upload entfernt keine alten Dateien: bei späteren Umbenennungen nicht mehr benötigte Dateien gezielt anhand des vorherigen Pakets entfernen.

## Andere Server später

`dist/` kann auch von Nginx, Caddy oder IIS ausgeliefert werden. Diese Server lesen `.htaccess` nicht; Fehlerseite, Header und HTTPS werden dann im jeweiligen Server eingerichtet. Root-Server-Konfiguration wird erst ergänzt, wenn Betriebssystem, Server und Projektanforderungen feststehen.

## Offizielle Quellen

Geprüft am 23.09.2026:

- [SFTP-Verbindungsdaten finden](https://www.ionos.de/hilfe/hosting/ftp-zugaenge-einrichten-und-verwalten/anmeldedaten-fuer-ihr-ftpsftp-programm)
- [Domain mit einem Webspace-Verzeichnis verbinden](https://www.ionos.de/hilfe/domains/mit-webspace-verbinden/domain-mit-einem-webspace-verzeichnis-verbinden/)
- [Von IONOS verwaltetes SSL-Zertifikat einrichten](https://www.ionos.de/hilfe/index.php?id=2721)
