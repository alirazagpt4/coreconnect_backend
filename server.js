import express from "express";
import dotenv from "dotenv";
import sequelize from "./config/db.js";
import "./models/associations.js";
import userRoutes from "./routes/user.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import cors from "cors";
import morgan from "morgan";
const PORT = process.env.PORT || 5000;
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);


app.get("/api", (req, res) => {
    res.json({
        "message": "API of coreconnect backend is running ...."
    })
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