import "./DisconnectedScreen.css";

export function DisconnectedScreen() {
  return (
    <div className="disconnected-screen">
      <div className="disconnected-card">
        <div className="disconnected-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>

        <h2 className="disconnected-title">Raspberry Pi déconnecté</h2>
        <p className="disconnected-subtitle">
          Aucune donnée capteur reçue depuis plus de 15 secondes.
        </p>

        <div className="troubleshoot">
          <h3 className="troubleshoot-title">Guide de dépannage</h3>
          <ol className="troubleshoot-steps">
            <li>
              <span className="step-icon">🔌</span>
              <div>
                <strong>Vérifiez l'alimentation</strong>
                <p>Assurez-vous que le Raspberry Pi est allumé et que la LED verte clignote.</p>
              </div>
            </li>
            <li>
              <span className="step-icon">📶</span>
              <div>
                <strong>Vérifiez la connexion réseau</strong>
                <p>Le Pi doit être connecté au WiFi ou en Ethernet avec accès à Internet.</p>
              </div>
            </li>
            <li>
              <span className="step-icon">🐍</span>
              <div>
                <strong>Lancez le script Python</strong>
                <p>
                  Connectez-vous au Pi en SSH et exécutez :<br />
                  <code>cd raspberry-pi && source .env && python3 pi_sensor_sender.py</code>
                </p>
              </div>
            </li>
            <li>
              <span className="step-icon">🔑</span>
              <div>
                <strong>Vérifiez la clé API</strong>
                <p>
                  La variable <code>SENSOR_API_KEY</code> dans le fichier <code>.env</code> du Pi
                  doit correspondre à celle configurée sur le serveur.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="disconnected-hint">
          <span className="hint-pulse" />
          En attente de données…
        </div>
      </div>
    </div>
  );
}
