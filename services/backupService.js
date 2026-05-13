import dotenv from 'dotenv';
dotenv.config();
import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES6 mein __dirname manually define karna parta hai
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupTask = () => {
    const { DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    // '../backups' ka matlab hai services folder se bahar nikal kar root mein backups dhoondo
    const backupDir = path.join(__dirname, '../backups');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    const fileName = `${DB_NAME}_${date}.sql`;
    const filePath = path.join(backupDir, fileName);

    console.log(`[${new Date().toLocaleString()}] Starting Daily Backup...`);

    // MySQL Dump command
    const cmd = `mysqldump -u ${DB_USER} -p'${DB_PASSWORD}' ${DB_NAME} > ${filePath}`;

    exec(cmd, (error) => {
        if (error) {
            console.error(`[Backup Error]: ${error.message}`);
            return;
        }
        console.log(`[Backup Success]: File created at ${filePath}`);

        // Cleanup: 7 din se purani files delete karein
        const cleanupCmd = `find ${backupDir} -type f -mtime +7 -name "*.sql" -delete`;
        exec(cleanupCmd);
    });
};

// --- SCHEDULE SETTINGS ---
// Abhi ke liye 3:00 PM (15:00) PKT:
cron.schedule('0 15 * * *', () => {
    backupTask();
}, {
    scheduled: true,
    timezone: "Asia/Karachi"
});

console.log("Backup Service is running... Next backup scheduled for 3:00 PM PKT.");

// Testing ke liye ek baar manually run karein (pehli file foran ban jaye gi)
// backupTask();