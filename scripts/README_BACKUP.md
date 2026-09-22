# CirugíaMed - Sistema de Backup Diario y Repositorio de Datos

Este sistema cuenta con **dos mecanismos complementarios de respaldo**:

1. **Repositorio Diario dentro de la misma Base de Datos (Firestore):** Se ejecuta automáticamente en la nube sin necesidad de tener la PC encendida.
2. **Script en Python automatizado (`backup_firestore.py`):** Descarga una copia completa en formato `.json` a tu computadora y puede programarse todos los días a las 12:00 hs.

---

## 1. Repositorio Diario en Firestore (Nube)
* Cada día que se utiliza la aplicación, se genera automáticamente un documento inmutable en la colección `daily_snapshots/{userId}_{fecha}`.
* Guarda el estado completo de:
  - Fichas de pacientes (`patients`)
  - Intervenciones quirúrgicas (`surgeries`)
  - Configuración y perfil del cirujano (`profiles`)
* **Seguridad:** Los snapshots están aislados por usuario y protegidos por las reglas de seguridad de Firestore.

---

## 2. Script de Backup en Python (`backup_firestore.py`)

### Requisitos Previos (Solo se hace una vez):
1. **Instalar dependencias de Python:**
   ```bash
   pip install -r scripts/requirements.txt
   ```
2. **Descargar la clave de acceso de Firebase:**
   - Abre la consola de Firebase: [https://console.firebase.google.com](https://console.firebase.google.com)
   - Selecciona el proyecto **cirugiamed-gestion**.
   - Haz clic en el ícono de **⚙️ (Configuración del proyecto)** > pestaña **Cuentas de servicio**.
   - Haz clic en el botón azul **"Generar nueva clave privada"**.
   - Se descargará un archivo `.json`. Guárdalo en la raíz de este proyecto con el nombre:
     `serviceAccountKey.json`
   *(Nota: Este archivo ya está protegido en `.gitignore` para que nunca se suba a GitHub).*

---

### Modos de Ejecución:

#### Opción A: Backup Inmediato (Manual)
Ejecuta en tu terminal:
```bash
python scripts/backup_firestore.py
```
Creará un archivo fechado en la carpeta `backups/`, por ejemplo:
`backups/backup_cirugiamed_2026-09-22_120000.json`

#### Opción B: Modo Automático a las 12:00 hs (Servicio Continuo)
Para dejarlo corriendo y que realice el backup todos los días a las 12 del mediodía:
```bash
python scripts/backup_firestore.py --daily 12:00
```

#### Opción C: Programador de Tareas de Windows (Sin terminal abierta)
Para que Windows lo ejecute en segundo plano todos los días a las 12:00 hs:
1. Abre el menú Inicio y escribe **Programador de tareas**.
2. Haz clic en **Crear tarea básica...**
3. Nombre: `CirugiaMed_Backup_Diario`.
4. Desencadenador: **Diariamente** a las `12:00:00`.
5. Acción: **Iniciar un programa**.
6. En *Programa o script*, selecciona el archivo:
   `d:\DESARROLLO\WEB Antigravity\cirugiamedGestionquirurgicayfinanzas\scripts\run_daily_backup.bat`
7. En *Iniciar en (opcional)*, escribe:
   `d:\DESARROLLO\WEB Antigravity\cirugiamedGestionquirurgicayfinanzas`
8. Haz clic en **Finalizar**. ¡Listo! Windows ejecutará la copia todos los días a las 12 hs de forma automática.
