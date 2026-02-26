import { User, City, Region, Designation } from "../models/associations.js";;
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


export const createUser = async (req, res) => {
    const { name, phone, password, cnic, address, city_id, region_id, designation_id, role, reportTo } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (!name || !phone || !password) {
            return res.status(400).json({
                message: "name , phone and passowrd are required"
            })
        }

        const existUser = await User.findOne({ where: { phone: phone } });
        if (existUser) {
            return res.status(400).json({
                message: "User Already Exists"
            })
        }

        const user = await User.create({
            name, phone, password: hashedPassword, cnic, address, city_id, region_id, designation_id, role, reportTo
        })

        res.status(201).json({
            message: "User Created Successfully",
            user
        })


    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}


export const loginUser = async (req, res) => {
    const { name, password } = req.body;

    try {
        if (!name || !password) {
            return res.status(400).json({ message: "Name and password are required" });
        }

        // 1. User dhoondna aur sath hi City aur Designation ke tables ko "JOIN" karna
        const user = await User.findOne({
            where: { name: name },
            include: [
                {
                    model: City,
                    as: 'city', // Associations file wala alias
                    attributes: ['name'] // Sirf name chahiye
                },
                {
                    model: Designation,
                    as: 'designation',
                    attributes: ['name']
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Password check
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        // 3. JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET
        );

        // 4. Response (Clean and Sweet)
        res.status(200).json({
            message: "Login Successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                city: user.city ? user.city.name : null, // Table se aya hua naam
                designation: user.designation ? user.designation.name : null // Table se aya hua naam
            }
        });

    } catch (err) {
        console.log("❌ Login Error:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};



export const userProfile = async (req, res) => {
    try {
        // 1. AuthenticateToken ne user ki ID req.user mein daal di thi
        const userId = req.user.id;

        // 2. Database se user ka saara data uthaein (Password chorr kar)
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }, // Security: Password nahi bhejna!
            include: [
                { model: City, as: 'city', attributes: ['name'] },
                { model: Region, as: 'region', attributes: ['name'] },
                { model: Designation, as: 'designation', attributes: ['name'] },
                // Agar dekhna ho ke ye kis ko report karta hai:
                { model: User, as: 'manager', attributes: ['name', 'role'] } 
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "User profile not found!" });
        }

        // 3. Response bhej dein
        res.status(200).json({
            success: true,
            profile: user
        });

    } catch (err) {
        console.log("❌ Profile Error:", err);
        res.status(500).json({ 
            message: "Internal Server Error", 
            error: err.message 
        });
    }
};

