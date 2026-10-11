# PNG Fighter — Server-Setup (Teil 2)

Lokales Setup mit zwei Seiten, verbunden über einen kleinen Node-Server (keine npm-Installation nötig — nur Node.js selbst).

## Starten

```
node server.js
```

Danach:

- **Viewer** (als Browser-Quelle in OBS/Streamlabs einbinden): `http://localhost:4180/viewer.html`
  Reine Anzeige, keine Buttons mehr — Kämpfe laufen automatisch, gesteuert vom Kontrollpanel.
- **Kontrollpanel** (auf einem zweiten Fenster, Tablet oder Handy im selben Netzwerk öffnen): `http://localhost:4180/control.html`
  Hier spawnst du Kämpfer/Gegner, aktivierst Auto-Spawn und regelst Tempo, Schaden sowie Erkennungs-/Angriffsreichweite live.

Beide Seiten laufen vom selben Server (Port 4180, per `PORT`-Umgebungsvariable änderbar). Das Kontrollpanel sendet Befehle per HTTP an den Server, der Server leitet sie live per Server-Sent Events an alle offenen Viewer-Fenster weiter.

## Neue Funktionen

- **Rangliste**: im Kontrollpanel unter "Rangliste: an/aus" umschaltbar. Zeigt im Viewer oben rechts Name, Kills und Überlebenszeit der Kämpfer, live aktualisiert.
- **YouTube-Profile spawnen**: im Kontrollpanel einen YouTube Data API v3 Key sowie eine Kanal-ID (z. B. `UCxxxxxxxxxxxxxxxxxxxxxx`) oder einen `@Handle` eingeben und auf "Abrufen & speichern" klicken. Name und Profilbild werden serverseitig geholt (kein CORS-Problem) und lokal im Browser gespeichert — von dort aus jederzeit per Klick als Kämpfer oder Gegner spawnbar. Der API-Key wird nur lokal im Browser des Kontrollpanels gespeichert, nie an Dritte gesendet.
  Einen eigenen API-Key gibt's kostenlos in der Google Cloud Console (YouTube Data API v3 aktivieren, API-Key erstellen).

## Hinweis zum Ton

Der Treffer-Sound braucht laut Browser-Regel einen ersten Klick auf der Viewer-Seite, bevor er starten darf. Falls die Viewer-Seite nur als OBS-Quelle läuft (ohne echten Klick), bleibt der Ton stumm — das ist eine Browser-Einschränkung, keine Fehlfunktion. Ein einmaliger Klick ins Browserfenster (z. B. beim Testen) schaltet ihn frei.

## Struktur

```
png-fighter-server/
  server.js          Node-Server (Static Files + SSE)
  public/
    viewer.html       Kampfarena, reine Anzeige (Teil 1, ohne Steuerung)
    control.html       Kontrollpanel: Spawnen, Auto-Spawn, Einstellungen
```
