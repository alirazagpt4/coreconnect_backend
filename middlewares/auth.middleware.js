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