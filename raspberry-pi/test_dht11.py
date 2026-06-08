import time
import board
import adafruit_dht

# ==========================================
# CONFIGURATION DU CAPTEUR DHT11
# ==========================================
# board.D4 correspond à la broche physique n°7 (GPIO 4)
# Si vous le branchez ailleurs, changez board.D4 par board.DXX
try:
    dht_device = adafruit_dht.DHT11(board.D4)
except Exception as e:
    print(f"Erreur d'initialisation du DHT11: {e}")
    exit()

# ==========================================
# BOUCLE PRINCIPALE
# ==========================================
try:
    print("==========================================")
    print("TEST CAPTEUR DHT11 (Température & Humidité)")
    print("Appuyez sur Ctrl+C pour quitter.")
    print("==========================================")
    time.sleep(2)

    while True:
        try:
            # Demande des données au capteur
            temperature = dht_device.temperature
            humidity = dht_device.humidity
            
            print(f"[ SUCCÈS ] Température : {temperature}°C  |  Humidité : {humidity}%")

        except RuntimeError as error:
            # Le DHT11 est un capteur très sensible au timing, il rate souvent des lectures.
            # C'est normal d'avoir quelques erreurs "RuntimeError" de temps en temps.
            print(f"[ ATTENTE ] Le capteur a raté sa lecture, nouvelle tentative... ({error.args[0]})")
        except Exception as error:
            dht_device.exit()
            raise error

        # Le DHT11 a besoin d'au moins 2 secondes entre chaque lecture
        time.sleep(2.5)

except KeyboardInterrupt:
    print("\nArrêt manuel du programme.")
finally:
    try:
        dht_device.exit()
    except:
        pass
