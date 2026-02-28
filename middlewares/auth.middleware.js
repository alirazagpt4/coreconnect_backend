import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); // 👈 Brackets lazmi hain!

export const AuthenticateToken = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN_VALUE"

    if (!token) {
        return res.status(401).json({
            message: "Access Denied: No Token Provided!"
        });
    }

    try {
        // 2. Token ko verify karna (Secret key wahi ho jo login mein di thi)
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');

        // 3. User ka data request object mein daal dena taake agle functions use kar saken
        req.user = verified;

        console.log(req.user);

        next(); // 🚀 Agle function (Controller) ki taraf barho
    } catch (err) {
        return res.status(403).json({
            message: "Invalid or Expired Token!"
        });
    }
};


export const isAdmin = (req, res, next) => {
    // 1. Check karein ke AuthenticateToken ne user data set kiya hai ya nahi
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: No user data found!" });
    }

    // 2. Role check karein (Uss word 'admin' se compare karein)
    // Note: ensure karein ke login ke waqt JWT sign karte hue aapne 'role' dala tha
    if (req.user.role === 'admin') {
        next(); // ✅ Banda admin hai, janay do aage
    } else {
        return res.status(403).json({
            message: "Access Denied: You are not authorized as an Admin!"
        });
    }
};