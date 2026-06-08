import time

try:
    import smbus2
except ImportError:
    print("Erreur : la librairie smbus2 n'est pas installée.")
    print("Installez-la avec : pip install smbus2")
    exit(1)

# Le bus I2C standard sur Raspberry Pi est le 1
I2C_BUS = 1
# L'adresse I2C donnée par tes spécifications
ADDRESS = 0x40

def read_hm3301(bus):
    try:
        # Le HM3301 crache un bloc de 29 octets contenant toutes les mesures.
        # On lit 29 octets depuis le registre par défaut (0x88)
        data = bus.read_i2c_block_data(ADDRESS, 0x88, 29)
        
        # Vérification d'intégrité (Checksum)
        checksum = sum(data[:28]) & 0xFF
        if checksum != data[28]:
            return None, "Erreur de Checksum (Parasites sur la ligne)"
            
        # Lecture des particules standards (Standard particulate matter)
        pm1_0 = (data[4] << 8) | data[5]
        pm2_5 = (data[6] << 8) | data[7]
        pm10  = (data[8] << 8) | data[9]
        
        return (pm1_0, pm2_5, pm10), "OK"
        
    except Exception as e:
        return None, f"Le capteur ne répond pas (Câblage ou I2C non activé) : {e}"

# ==========================================
# BOUCLE PRINCIPALE
# ==========================================
if __name__ == "__main__":
    print("==========================================")
    print(" TEST CAPTEUR HM3301 (Particules Fines)")
    print(" Communication : I2C (Adresse 0x40)")
    print("==========================================")
    
    try:
        bus = smbus2.SMBus(I2C_BUS)
    except Exception as e:
        print(f"[ ERREUR CRITIQUE ] Impossible d'ouvrir le port I2C: {e}")
        print("-> Avez-vous bien activé l'I2C dans 'sudo raspi-config' ?")
        exit(1)
        
    print("Démarrage du ventilateur (préchauffage 3s)...")
    time.sleep(3)
    
    try:
        while True:
            mesures, status = read_hm3301(bus)
            if mesures:
                pm1, pm25, pm10 = mesures
                print(f"[ SUCCÈS ] PM1.0: {pm1:3} µg/m³  |  PM2.5: {pm25:3} µg/m³  |  PM10: {pm10:3} µg/m³")
            else:
                print(f"[ ERREUR ] {status}")
            time.sleep(2)
    except KeyboardInterrupt:
        print("\nArrêt manuel du programme.")
    finally:
        try:
            bus.close()
        except:
            pass
