import xlsx from 'xlsx';
import { ItemMaster } from './models/associations.js';

async function runLiveUpdate() {
    try {
        console.log("📂 Reading Excel file for live price update...");
        const workbook = xlsx.readFile('20260929 New ERP Price List 3001 - V2.xlsx');
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        // Data rows ko theek se slice karein (headers skip karne ke liye)
        const rows = data.slice(2);
        let updatedCount = 0;
        let notFoundCount = 0;
        let skippedCount = 0;

        console.log(`🔄 Processing and updating items in database...`);

        for (const row of rows) {
            const itemCode = row[1] ? String(row[1]).trim() : null;
            const rawMrp = row[18];

            // Headers ya invalid rows ko skip karein
            if (!itemCode || itemCode === 'Item number' || isNaN(rawMrp)) {
                skippedCount++;
                continue;
            }

            // Floating-point precision fix (round to 2 decimal places)
            const newMrp = parseFloat(Number(rawMrp).toFixed(2));

            // Database mein update chalayein
            const [affectedRows] = await ItemMaster.update(
                {
                    retail_price: newMrp,
                    price_after_discount: newMrp
                },
                { where: { item_code: itemCode } }
            );

            if (affectedRows > 0) {
                updatedCount++;
            } else {
                notFoundCount++;
            }
        }

        console.log(`\n--- LIVE UPDATE COMPLETE ---`);
        console.log(`✅ Successfully Updated: ${updatedCount} items`);
        console.log(`⚠️ Not Found in Database: ${notFoundCount} items`);
        console.log(`⏭️ Skipped / Headers: ${skippedCount} rows`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error during live update:", error);
        process.exit(1);
    }
}

runLiveUpdate();