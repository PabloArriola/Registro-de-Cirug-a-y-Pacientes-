#!/usr/bin/env python3
"""
CirugíaMed - Script de Backup Automático de Firestore (Python)
-------------------------------------------------------------
Este script realiza una copia de seguridad completa de las colecciones de Firestore:
- Pacientes (patients)
- Cirugías e intervenciones (surgeries)
- Perfiles médicos (profiles)
- Snapshots diarios (daily_snapshots)

Modos de uso:
  1. Ejecución única inmediata:
       python backup_firestore.py
  2. Programador continuo (ej: todos los días a las 12:00 hs):
       python backup_firestore.py --daily 12:00
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime, timedelta

# Directorio base para guardar los backups
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
BACKUP_DIR = os.path.join(PROJECT_DIR, 'backups')

# Buscar credenciales de Service Account de Firebase
DEFAULT_KEY_PATHS = [
    os.path.join(PROJECT_DIR, 'serviceAccountKey.json'),
    os.path.join(SCRIPT_DIR, 'serviceAccountKey.json'),
    os.path.join(PROJECT_DIR, 'credentials.json'),
]

def ensure_backup_dir():
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR, exist_ok=True)
        print(f"[+] Carpeta de backups creada: {BACKUP_DIR}")

def get_service_account_path(custom_path=None):
    if custom_path and os.path.exists(custom_path):
        return custom_path
    
    env_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
    if env_path and os.path.exists(env_path):
        return env_path

    for p in DEFAULT_KEY_PATHS:
        if os.path.exists(p):
            return p
    return None

def run_backup(service_account_path=None):
    ensure_backup_dir()

    key_path = get_service_account_path(service_account_path)
    if not key_path:
        print("\n" + "="*70)
        print("⚠️  ATENCIÓN: No se encontró 'serviceAccountKey.json'")
        print("="*70)
        print("Para que el script pueda descargar la base de datos de Firebase:")
        print("1. Abre la consola de Firebase: https://console.firebase.google.com")
        print("2. Ve a: Configuración del Proyecto (ícono de engranaje) > Cuentas de servicio")
        print("3. Haz clic en: 'Generar nueva clave privada'")
        print("4. Guarda el archivo descargado como 'serviceAccountKey.json' en la carpeta")
        print(f"   del proyecto: {PROJECT_DIR}")
        print("="*70 + "\n")
        return False

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("\n❌ Error: La librería 'firebase-admin' no está instalada.")
        print("Por favor instala las dependencias ejecutando:")
        print("   pip install -r requirements.txt")
        print("   (o: pip install firebase-admin)\n")
        return False

    # Inicializar Firebase Admin SDK si no está inicializado
    if not firebase_admin._apps:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)

    db = firestore.client()
    timestamp_str = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    date_str = datetime.now().strftime("%Y-%m-%d")

    collections_to_export = ['patients', 'surgeries', 'profiles', 'daily_snapshots']
    full_backup_data = {
        "_metadata": {
            "appName": "CirugiaMed - Gestión Quirúrgica y Finanzas",
            "backupDate": datetime.now().isoformat(),
            "timestamp": timestamp_str,
            "version": "1.0",
        },
        "patients": [],
        "surgeries": [],
        "profiles": [],
        "daily_snapshots": [],
    }

    print(f"\n🔄 [{datetime.now().strftime('%H:%M:%S')}] Iniciando backup de Firestore...")

    for col_name in collections_to_export:
        docs = db.collection(col_name).stream()
        count = 0
        for doc in docs:
            doc_data = doc.to_dict()
            doc_data['_firestore_id'] = doc.id
            full_backup_data[col_name].append(doc_data)
            count += 1
        print(f"   ✓ Colección '{col_name}': {count} registros descargados.")

    # Guardar archivo JSON fechado
    backup_file_path = os.path.join(BACKUP_DIR, f"backup_cirugiamed_{timestamp_str}.json")
    with open(backup_file_path, 'w', encoding='utf-8') as f:
        json.dump(full_backup_data, f, ensure_ascii=False, indent=2, default=str)

    # Guardar copia de 'latest_backup.json'
    latest_file_path = os.path.join(BACKUP_DIR, "latest_backup.json")
    with open(latest_file_path, 'w', encoding='utf-8') as f:
        json.dump(full_backup_data, f, ensure_ascii=False, indent=2, default=str)

    file_size_kb = os.path.getsize(backup_file_path) / 1024
    print(f"✅ Backup completado exitosamente:")
    print(f"   📁 Archivo: {backup_file_path} ({file_size_kb:.2f} KB)")
    print(f"   👥 Pacientes: {len(full_backup_data['patients'])} | 🩺 Cirugías: {len(full_backup_data['surgeries'])}")

    # Opcional: Registrar metadatos del backup en Firestore
    try:
        db.collection('backups_metadata').document(f"backup_{date_str}").set({
            "backupDate": datetime.now().isoformat(),
            "date": date_str,
            "patientsCount": len(full_backup_data['patients']),
            "surgeriesCount": len(full_backup_data['surgeries']),
            "fileSizeKb": round(file_size_kb, 2),
            "status": "success"
        })
        print(f"   ☁️ Registro del backup guardado en Firestore (backups_metadata/backup_{date_str})")
    except Exception as e:
        print(f"   ⚠️ No se pudo registrar en Firestore: {e}")

    # Limpieza de backups antiguos (retención de últimos 30 días)
    cleanup_old_backups(max_days=30)
    return True

def cleanup_old_backups(max_days=30):
    try:
        now = time.time()
        cutoff = now - (max_days * 86400)
        for fname in os.listdir(BACKUP_DIR):
            if fname.startswith("backup_cirugiamed_") and fname.endswith(".json"):
                fpath = os.path.join(BACKUP_DIR, fname)
                if os.path.isfile(fpath) and os.stat(fpath).st_mtime < cutoff:
                    os.remove(fpath)
                    print(f"   🧹 Backup antiguo eliminado (> {max_days} días): {fname}")
    except Exception as e:
        pass

def run_scheduler(target_time_str="12:00", service_account=None):
    print(f"🚀 Servicio de Backup Automático Diario activo.")
    print(f"⏰ Programado para ejecutarse todos los días a las: {target_time_str} hs.")
    print("Presiona Ctrl+C para detener el proceso.\n")

    while True:
        now = datetime.now()
        target_hour, target_minute = map(int, target_time_str.split(':'))
        
        target_today = now.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
        if now >= target_today:
            # Si la hora ya pasó hoy, programar para mañana a la misma hora
            next_run = target_today + timedelta(days=1)
        else:
            next_run = target_today

        seconds_until_run = (next_run - now).total_seconds()
        hours_until_run = seconds_until_run / 3600
        print(f"⏳ Próximo backup en {hours_until_run:.1f} horas ({next_run.strftime('%Y-%m-%d %H:%M:%S')}). Esperando...")

        # Dormir hasta la hora programada
        time.sleep(seconds_until_run)

        print(f"\n⏰ Son las {target_time_str} hs. Ejecutando backup programado...")
        run_backup(service_account)
        # Esperar 65 segundos para no ejecutar dos veces en el mismo minuto
        time.sleep(65)

def main():
    parser = argparse.ArgumentParser(description="CirugíaMed - Backup diario de Firestore")
    parser.add_argument('--key', help="Ruta a serviceAccountKey.json", default=None)
    parser.add_argument('--daily', help="Ejecutar en modo daemon diario (ej: --daily 12:00)", default=None)
    args = parser.parse_args()

    if args.daily:
        run_scheduler(target_time_str=args.daily, service_account=args.key)
    else:
        success = run_backup(args.key)
        sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
