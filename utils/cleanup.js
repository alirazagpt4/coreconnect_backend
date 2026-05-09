import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { Attendance } from '../models/associations.js';
import { Op } from 'sequelize';

export const initCleanupTask = () => {
    // Scheduling: Har roz raat 12:01 AM (0 1 0 * * *)
    cron.schedule('55 12 * * *', async () => {
        console.log("🧹 Running Scheduled Cleanup...");
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 54);

            const oldRecords = await Attendance.findAll({
                where: {
                    createdAt: { [Op.lt]: thirtyDaysAgo },
                    image_uri: { [Op.ne]: null }
                },
                attributes: ['image_uri']
            });

            if (oldRecords.length > 0) {
                oldRecords.forEach((record) => {
                    const fileName = record.image_uri.split('/').pop();
                    const filePath = path.join(process.cwd(), 'uploads', fileName);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                });
                console.log(`✅ Deleted ${oldRecords.length} old images.`);
            }
        } catch (error) {
            console.error("❌ Cleanup Error:", error);
        }
    });
};