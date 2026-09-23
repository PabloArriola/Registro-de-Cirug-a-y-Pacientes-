#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..');
const backupDir = path.resolve(projectDir, 'backups');
const keyPath = path.resolve(projectDir, 'serviceAccountKey.json');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

if (!fs.existsSync(keyPath)) {
  console.error('\n❌ Error: No se encontró el archivo serviceAccountKey.json en la raíz del proyecto.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function runBackup() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  console.log(`\n🔄 [${now.toLocaleTimeString()}] Iniciando backup de CirugíaMed desde Firestore...`);

  const collections = ['patients', 'surgeries', 'profiles', 'daily_snapshots'];
  const fullBackupData = {
    _metadata: {
      appName: 'CirugiaMed - Gestión Quirúrgica y Finanzas',
      backupDate: now.toISOString(),
      timestamp: timestampStr,
      version: '1.0'
    },
    patients: [],
    surgeries: [],
    profiles: [],
    daily_snapshots: []
  };

  for (const colName of collections) {
    const snapshot = await db.collection(colName).get();
    const docs = [];
    snapshot.forEach(doc => {
      docs.push({
        _firestore_id: doc.id,
        ...doc.data()
      });
    });
    fullBackupData[colName] = docs;
    console.log(`   ✓ Colección '${colName}': ${docs.length} registros respaldados.`);
  }

  const backupFilePath = path.join(backupDir, `backup_cirugiamed_${timestampStr}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(fullBackupData, null, 2), 'utf8');

  const latestFilePath = path.join(backupDir, 'latest_backup.json');
  fs.writeFileSync(latestFilePath, JSON.stringify(fullBackupData, null, 2), 'utf8');

  const sizeKb = (fs.statSync(backupFilePath).size / 1024).toFixed(2);
  console.log(`\n✅ Backup completado con éxito:`);
  console.log(`   📁 Archivo: ${backupFilePath} (${sizeKb} KB)`);
  console.log(`   👥 Pacientes: ${fullBackupData.patients.length} | 🩺 Cirugías: ${fullBackupData.surgeries.length}`);

  // Clean old backups (> 30 days)
  try {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const files = fs.readdirSync(backupDir);
    for (const f of files) {
      if (f.startsWith('backup_cirugiamed_') && f.endsWith('.json')) {
        const fp = path.join(backupDir, f);
        const stats = fs.statSync(fp);
        if (stats.mtimeMs < cutoff) {
          fs.unlinkSync(fp);
          console.log(`   🧹 Backup antiguo eliminado (> 30 días): ${f}`);
        }
      }
    }
  } catch (err) {
    // Ignore cleanup error
  }

  return fullBackupData;
}

// Check CLI arguments
const args = process.argv.slice(2);
const dailyArgIndex = args.indexOf('--daily');

if (dailyArgIndex !== -1) {
  const targetTime = args[dailyArgIndex + 1] || '12:00';
  console.log(`🚀 Servicio de Backup Automático Diario activo.`);
  console.log(`⏰ Programado para ejecutarse todos los días a las: ${targetTime} hs.`);
  console.log('Presiona Ctrl+C para detener el proceso.\n');

  function scheduleNext() {
    const now = new Date();
    const [targetHour, targetMinute] = targetTime.split(':').map(Number);
    const target = new Date();
    target.setHours(targetHour, targetMinute, 0, 0);

    if (now >= target) {
      target.setDate(target.getDate() + 1);
    }

    const msUntilRun = target.getTime() - now.getTime();
    const hoursUntil = (msUntilRun / (1000 * 60 * 60)).toFixed(1);
    console.log(`⏳ Próximo backup en ${hoursUntil} horas (${target.toLocaleString()}). Esperando...`);

    setTimeout(async () => {
      console.log(`\n⏰ Son las ${targetTime} hs. Ejecutando backup programado...`);
      await runBackup();
      scheduleNext();
    }, msUntilRun);
  }

  scheduleNext();
} else {
  runBackup().then(() => process.exit(0)).catch((err) => {
    console.error('❌ Error durante el backup:', err);
    process.exit(1);
  });
}
