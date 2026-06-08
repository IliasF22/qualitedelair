import time

print("==========================================")
print(" ATTENTION : LECTURE ANALOGIQUE REQUISE")
print("==========================================")
print("Le Raspberry Pi ne possède AUCUNE broche analogique native.")
print("Pour faire fonctionner ce script, vous devez utiliser :")
print(" 1. Soit un Grove Base Hat (branché sur le port A0)")
print(" 2. Soit une puce ADC externe (comme MCP3008)")
print("==========================================\n")

try:
    from grove.grove_air_quality_sensor_v1_3 import GroveAirQualitySensor
except ImportError:
    print("Erreur : La librairie grove.py n'est pas installée.")
    print("Pour le Grove Base Hat, installez-la avec :")
    print("curl -sL https://github.com/Seeed-Studio/grove.py/raw/master/install.sh | sudo bash -s -")
    exit()

# Initialisation du capteur sur le port Analogique 0 (A0) du Grove Base Hat
pin = 0
sensor = GroveAirQualitySensor(pin)

print("Démarrage du test Grove Air Quality (Port A0)...")
print("Patientez, le capteur a besoin de 20s de préchauffage.")
time.sleep(2)

try:
    while True:
        # La valeur lue est généralement un indice entre 0 et 1000+
        # (0-50 = Très bon, > 300 = Mauvais)
        val = sensor.value
        
        if val is not None:
            print(f"[ LECTURE ] Indice Qualité de l'Air (ADC) : {val}")
        else:
            print("[ ERREUR ] Impossible de lire la broche A0.")
            
        time.sleep(2)

except KeyboardInterrupt:
    print("\nArrêt manuel du programme.")
