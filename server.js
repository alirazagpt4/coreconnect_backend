import express from "express";
import dotenv from "dotenv";
import sequelize from "./config/db.js";
import "./models/associations.js";
import userRoutes from "./routes/user.routes.js";

import cors from "cors";
import morgan from "morgan";
const PORT = process.env.PORT || 5000;
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));



app.use("/api/users", userRoutes);


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