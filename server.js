import express from "express";
import dotenv from "dotenv";
dotenv.config();

import sequelize from "./config/db.js";
import "./models/associations.js";
import userRoutes from "./routes/user.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import designationRoutes from "./routes/designations.routes.js";
import cityRoutes from "./routes/cities.routes.js";
import regionRoutes from "./routes/regions.routes.js"
import storeRoutes from "./routes/store.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import subCategoryRoutes from "./routes/subCategory.routes.js";
import itemRoutes from "./routes/item.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import shortItemRoutes from "./routes/shortItem.routes.js";
import interceptionRoutes from "./routes/interceptions.routes.js";
import reportRoutes from "./routes/report.routes.js"
import statusRoutes from "./routes/status.routes.js"

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import cors from "cors";
import morgan from "morgan";
const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'build')));



app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/subCategory", subCategoryRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/shortitems", shortItemRoutes);
app.use("/api/interceptions" , interceptionRoutes);
app.use("/api/reports" , reportRoutes);
app.use("/api/status" , statusRoutes);


app.get("/api", (req, res) => {
    res.json({
        "message": "API of coreconnect backend is running ...."
    })
});


app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Database Connected Successfully!');

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
};

startServer();