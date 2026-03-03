import { User, City, Region, Designation, Store } from "../models/associations.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


export const createUser = async (req, res) => {
    const { name, fullname, phone, password, cnic, address, city_id, region_id, designation_id, role, reportTo } = req.body;
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
            name, fullname, phone, password: hashedPassword, cnic, address, city_id, region_id, designation_id, role, reportTo
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
                fullname: user.fullname,
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
                { model: User, as: 'manager', attributes: ['name', 'role'] },
                // --- Store Include yahan add hoga ---
                {
                    model: Store,
                    as: 'assigned_stores',
                    attributes: ['id', 'store_name']
                }

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


export const getAllUsers = async (req, res) => {
    try {
        // 1. Query parameters se values uthaein (Default values set hain)
        const page = parseInt(req.query.page) || 1; // Konsa page chahiye?
        const limit = parseInt(req.query.limit) || 10; // Ek page par kitne users?
        const search = req.query.search || ""; // Searching keyword

        const offset = (page - 1) * limit; // Kitne records skip karne hain

        // 2. Searching Filter (Name ya Phone par search karega)
        let whereClause = {};
        if (search) {
            whereClause = {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { phone: { [Op.like]: `%${search}%` } }
                ]
            };
        }

        // 3. Database se "findAndCountAll" use karein (Ye total count bhi deta hai)
        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            // attributes: { exclude: ['password'] }, // Security: Password nahi chahiye
            // order: [['createdAt', 'DESC']], // Latest users sabse upar
            include: [
                { model: City, as: 'city', attributes: ['name'] },
                { model: Designation, as: 'designation', attributes: ['name'] },
                { model: Region, as: 'region', attributes: ['name'] },
                {
                    model: User,
                    as: 'manager',
                    attributes: ['id', 'name']
                }
            ]
        });

        // 4. Response with Pagination Info
        res.status(200).json({
            success: true,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            users: rows
        });

    } catch (err) {
        console.log("❌ Get Users Error:", err);
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
};


export const updateUser = async (req, res) => {
    const { id } = req.params; // URL se ID uthayenge e.g. /api/users/5
    const { name, fullname, phone, password, cnic, address, city_id, region_id, designation_id, role, reportTo } = req.body;

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User nahi mila!" });
        }

        // Agar password update karna hai toh hash karo
        let updatedData = { name, fullname, phone, cnic, address, city_id, region_id, designation_id, role, reportTo };
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updatedData.password = hashedPassword;
        }

        // Database mein update karo
        await user.update(updatedData);

        res.status(200).json({
            message: "User successfully updated.",
            user
        });

    } catch (err) {
        console.log("❌ Update Error:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};



export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        await user.destroy();

        res.status(200).json({
            message: "User successfully deleted!"
        });

    } catch (err) {
        console.log("❌ Delete Error:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};