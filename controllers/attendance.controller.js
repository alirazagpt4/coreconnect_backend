import { User, Attendance } from '../models/associations.js';
import { Op } from 'sequelize';

export const startDay = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { latitude, longitude, time, isLeave } = req.body;
        const leaveStatus = isLeave === 'true' || isLeave === true;

        // --- IDEMPOTENCY CHECK (Date-wise) ---
        // Aaj ki date ke start aur end points nikalna
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Check if attendance already exists for today
        const existingAttendance = await Attendance.findOne({
            where: {
                user_id: user_id,
                createdAt: {
                    [Op.between]: [startOfToday, endOfToday]
                }
            }
        });

        if (existingAttendance) {
            return res.status(409).json({
                success: false,
                message: "Attendance for today is already marked!"
            });
        }

        let db_image_uri = null;
        let lat = null;
        let lng = null;

        if (!leaveStatus) {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Live camera photo is required!" });
            }
            if (!latitude || !longitude) {
                return res.status(400).json({ success: false, message: "Location is required!" });
            }

            db_image_uri = `/uploads/${req.file.filename}`;
            lat = latitude;
            lng = longitude;
        }

        // --- ATOMIC CREATE ---
        const newAttendance = await Attendance.create({
            user_id: user_id,
            image_uri: db_image_uri,
            latitude: lat,
            longitude: lng,
            mobile_time: time,
            isLeave: leaveStatus,
            status: leaveStatus ? 'absent' : 'present'
        });

        res.status(201).json({
            success: true,
            message: leaveStatus ? "Leave marked successfully!" : "Day started successfully!",
            data: newAttendance
        });

    } catch (error) {
        // Agar DB level unique constraint trigger ho jaye (Race Condition)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                message: "Duplicate entry blocked: Attendance already exists."
            });
        }

        console.error("❌ Attendance Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};