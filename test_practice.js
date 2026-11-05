import xlsx from 'xlsx';
import { ItemMaster } from './models/associations.js'; // Aapke export kiye huye models se import

async function testPriceMapping() {
    try {
        console.log("📂 Reading Excel file for price mapping dry-run...");
        const workbook = xlsx.readFile('20260929 New ERP Price List 3001 - V2.xlsx');
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        const rows = data.slice(1); // Header row skip kar di
        let matchCount = 0;
        let missingCount = 0;

        console.log("\n--- DRY RUN START (Checking first 10 items) ---");

        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const row = rows[i];
            const itemCode = row[1] ? String(row[1]).trim() : null; // Index 1 = Item Number
            const newMrp = row[18] ? parseFloat(row[18]) : null;     // Index 18 = MRP Price Incl. Tax
            const productName = row[3] || 'Unknown';

            if (itemCode) {
                // Database se item dhoondo
                const dbItem = await ItemMaster.findOne({ where: { item_code: itemCode } });

                if (dbItem) {
                    matchCount++;
                    console.log(`✅ [MATCH] Code: ${itemCode} | Name: ${productName}`);
                    console.log(`   -> Old DB Price: ${dbItem.retail_price} | New Excel MRP: ${newMrp}`);
                } else {
                    missingCount++;
                    console.log(`⚠️ [NOT IN DB] Code: ${itemCode} | Name: ${productName}`);
                }
            }
        }

        console.log(`\n--- DRY RUN COMPLETE ---`);
        console.log(`Sample Matches Found: ${matchCount}, Not Found: ${missingCount}`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error in dry-run:", error);
        process.exit(1);
    }
}

testPriceMapping();