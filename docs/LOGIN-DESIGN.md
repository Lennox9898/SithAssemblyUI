# Login-Ansicht aus Figma

Die Ansicht liegt unter `/login/` und ist auf der Startseite über **Anmelden** erreichbar.

## Designquelle

- [Figma: login-card, Node 5845:1890](https://www.figma.com/design/MclG6F2mAUBcSsUaSDVBYC/Free-Figma-Website-Landing-Pages---Startup-App--Community-?node-id=5845-1890)
- Übernommen: dunkle Karte, violette Konturen, Abstände, Typografie, E-Mail- und Passwortfelder, weißer Button sowie die vier originalen SVG-Assets.
- Anpassungen: Markenname `SITH//ASSEMBLY`, responsive Darstellung, vorhandenes rotes Assembly-Zeichen der Startseite als Hintergrund, Zurück-Link und Hinweis auf die noch nicht freigeschaltete Anmeldung.
- Der zuerst ausgelesene Frame `5845:1888` war nur die Hintergrundfläche. Das eigentliche Formular wurde anschließend unter `5845:1890` gefunden.

Die Assets liegen dauerhaft lokal unter `site/assets/login/`. Die zeitlich begrenzten Figma-Export-URLs werden von der Website nicht verwendet.

Der Hintergrund `site/assets/assembly-mark.svg` wurde aus der bestehenden Startseiten-Grafik übernommen. Er wurde nicht durch ein neues Bild ersetzt.

Die Schrift **Geist** entspricht der Figma-Vorlage. Die unveränderte WOFF2-Datei stammt aus dem offiziellen Paket `geist@1.7.2`; die SIL-OFL-Lizenz liegt daneben unter `site/assets/fonts/Geist-LICENSE.txt`. Quelle: [vercel/geist-font](https://github.com/vercel/geist-font). Beim Seitenaufruf werden weder Fonts noch Icons von Drittanbietern geladen.

## Verhalten

Dies ist die vorbereitete Login-Oberfläche, keine Benutzerverwaltung:

- Native Prüfung von E-Mail und Pflichtfeldern.
- Passwort ein-/ausblenden per Button; Tastatur und Screenreader werden unterstützt.
- Anmeldung, Registrierung und Passwort-Hilfe zeigen ihren tatsächlichen, noch nicht freigeschalteten Stand an.
- Kein Netzwerkversand von Formulardaten, keine Tokens, keine Sessions und keine Speicherung in Cookies oder Local Storage.
- Formularelemente haben im Entwurf keine `name`-Attribute. Eine zusätzliche Content Security Policy blockiert Formularübertragung auch bei fehlendem JavaScript. Die Buttons bleiben ohne JavaScript deaktiviert.
- Beim Betätigen von „Anmelden“ wird das Passwort wieder geleert. Es wird kein erfolgreicher Login vorgetäuscht.

Eine echte Anmeldung wird später mit einem ausgewählten Authentifizierungsdienst oder Backend verbunden. Dann muss die Vorschau-Logik in `site/assets/login.js` ersetzt und die `form-action`-Policy bewusst angepasst werden. Ein rein statischer IONOS-Upload kann selbst keine Benutzer prüfen oder geschützte Inhalte absichern.

## Bearbeiten und ausliefern

- Markup: `site/login/index.html`
- Design: `site/assets/login.css`
- Interaktionen: `site/assets/login.js`

`npm run package` erstellt wie bisher ein vollständiges Webhosting-ZIP; Login-Dateien, Schrift und Icons sind darin enthalten. Der IONOS-Build veröffentlicht unverändert `dist/`.
