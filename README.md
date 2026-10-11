# PNG Fighter Arena — Server-Setup

Ein lokaler Node.js-Server für die PNG Fighter Arena mit separater Kampfarena und einem Kontrollpanel für OBS Studio und Streamlabs.

## 📋 Voraussetzungen

- [Node.js](https://nodejs.org/) muss installiert sein.
- Keine zusätzlichen npm-Pakete erforderlich.

## 🚀 Starten

Starte den Server im Projektordner mit:

```bash
node server.js
```

Danach stehen diese beiden Seiten zur Verfügung:

| Seite | URL | Zweck |
|---|---|---|
| **Viewer** | `http://localhost:4180/viewer.html` | Kampfarena für OBS/Streamlabs |
| **Kontrollpanel** | `http://localhost:4180/control.html` | Kämpfer, Gegner und Einstellungen steuern |

### Viewer in OBS einbinden

1. Öffne OBS Studio.
2. Füge eine **Browser-Quelle** hinzu.
3. Gib als URL `http://localhost:4180/viewer.html` ein.
4. Passe die Größe der Quelle an deine Szene an.

Der Viewer ist eine reine Anzeige. Die Kämpfe werden über das Kontrollpanel gesteuert.

### Kontrollpanel öffnen

Öffne `http://localhost:4180/control.html` in einem zweiten Browserfenster.

Du kannst das Kontrollpanel auch auf einem Tablet oder Handy im selben Netzwerk verwenden. Ersetze dafür `localhost` durch die lokale IP-Adresse des Computers, auf dem der Server läuft.

## ⚔️ Funktionen

### Kämpfer und Gegner

- Kämpfer und Gegner manuell spawnen
- Auto-Spawn aktivieren oder deaktivieren
- Bewegungsgeschwindigkeit und Schaden einstellen
- Erkennungs- und Angriffsreichweite live anpassen

### 🏆 Rangliste

Die Rangliste kann im Kontrollpanel ein- und ausgeschaltet werden. Sie zeigt im Viewer:

- Namen der Kämpfer
- Anzahl der Kills
- Überlebenszeit

Die Werte werden live aktualisiert.

### ▶️ YouTube-Profile

Du kannst YouTube-Profile direkt im Kontrollpanel abrufen.

**So funktioniert es:**

1. Gib einen YouTube Data API v3-Key ein.
2. Trage eine Kanal-ID oder einen `@Handle` ein.
3. Klicke auf **„Abrufen & speichern“**.
4. Verwende das gespeicherte Profil anschließend als Kämpfer oder Gegner.

Name und Profilbild werden abgerufen und lokal für die weitere Verwendung gespeichert.

Einen API-Key kannst du in der [Google Cloud Console](https://console.cloud.google.com/) erstellen. Aktiviere dafür die **YouTube Data API v3**.

> **Sicherheit:** Veröffentliche deinen API-Key nicht im Repository. Auch lokal im Browser gespeicherte Schlüssel sind nicht vollständig vor anderen Personen geschützt, die Zugriff auf dein Gerät oder Browserprofil haben.

## 🔊 Sound

Der Treffer-Sound benötigt möglicherweise eine erste Benutzerinteraktion, bevor der Browser Audio abspielen darf.

Beim Testen im Browser kannst du einmal in das Viewer-Fenster klicken, um die Audiowiedergabe freizugeben. Bei einer reinen OBS-Browser-Quelle kann der Sound deshalb stumm bleiben.

## 📁 Projektstruktur

```text
png-fighter-server/
├── server.js
└── public/
    ├── viewer.html
    └── control.html
```

| Datei | Beschreibung |
|---|---|
| `server.js` | Node.js-Server, statische Dateien und Server-Sent Events (SSE) |
| `public/viewer.html` | Kampfarena und Anzeige |
| `public/control.html` | Kontrollpanel und Einstellungen |

## ⚙️ Port ändern

Standardmäßig verwendet der Server den Port `4180`.

Unter Windows CMD kannst du einen anderen Port festlegen:

```bat
set PORT=4200
node server.js
```

Danach lauten die Adressen:

- Viewer: `http://localhost:4200/viewer.html`
- Kontrollpanel: `http://localhost:4200/control.html`

## 🔄 Kommunikation zwischen Viewer und Kontrollpanel

Das Kontrollpanel sendet Befehle per HTTP an den Server. Der Server verteilt Änderungen über **Server-Sent Events (SSE)** an alle geöffneten Viewer-Fenster.

Beide Seiten müssen über denselben laufenden Server erreichbar sein.

## 📝 Hinweise

- Der Server muss während der Verwendung laufen.
- Für andere Geräte im Netzwerk kann es erforderlich sein, den Zugriff in der Windows-Firewall freizugeben.
- Die YouTube-Profilfunktion benötigt einen API-Key; die übrigen Funktionen sind davon unabhängig.
