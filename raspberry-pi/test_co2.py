import serial
import time

# ==========================================
# CONFIGURATION DU CAPTEUR CO2 (UART)
# ==========================================
# On essaie par défaut /dev/serial0. 
# Si tu vois une erreur de port, tu pourras essayer '/dev/ttyS0' ou '/dev/ttyAMA0'
try:
    ser = serial.Serial('/dev/serial0', 9600, timeout=2) # Timeout de 2s
except Exception as e:
    print(f"Erreur d'ouverture du port série: {e}")
    exit()

def read_co2():
    """Envoie la commande, décode la réponse et diagnostique l'état."""
    cmd = b'\xff\x01\x86\x00\x00\x00\x00\x00\x79'
    ser.reset_input_buffer() # Vider le buffer avant de lire
    ser.write(cmd)
    
    result = ser.read(9)
    
    # 1. Aucune donnée reçue (Capteur éteint ou RX/TX inversés)
    if len(result) == 0:
        return None, "AUCUN SIGNAL (Pas d'alimentation ou RX/TX inversés / mal branchés)"
    
    # 2. Données incomplètes (Câble mal branché ou parasites)
    elif len(result) < 9:
        return None, f"SIGNAL PARTIEL (Reçu seulement {len(result)} octets sur 9)"
    
    # 3. Mauvais format de données (Mauvais capteur ou parasites)
    elif result[0] != 0xff or result[1] != 0x86:
        return None, f"DONNÉES CORROMPUES (Parasites ou capteur en chauffe). Entête: {hex(result[0])} {hex(result[1])}"
    
    # 4. Données valides !
    else:
        ppm = result[2] * 256 + result[3]
        return ppm, "OK"

# ==========================================
# BOUCLE PRINCIPALE
# ==========================================
try:
    print("==========================================")
    print("TEST CO2 SIMPLIFIÉ (SANS ÉCRAN LCD)")
    print("Appuyez sur Ctrl+C pour quitter.")
    print("==========================================")
    time.sleep(2)

    while True:
        ppm, status = read_co2()
        
        if ppm is not None:
            print(f"[ SUCCÈS ] Concentration CO2 : {ppm} PPM")
        else:
            print(f"[ ERREUR ] {status}")

        time.sleep(5)

except KeyboardInterrupt:
    print("\nArrêt manuel du programme.")
finally:
    try:
        ser.close()
    except:
        pass
