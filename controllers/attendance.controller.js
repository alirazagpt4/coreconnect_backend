import { User, Attendance } from '../models/associations.js';

export const startDay = async (req, res) => {
    try {
        // 1. Frontend se data pakarna
        const user_id = req.user.id;
        const { latitude, longitude, time, isLeave } = req.body;

        // Check karna ke leave string hai ya boolean
        const leaveStatus = isLeave === 'true' || isLeave === true;

        let db_image_uri = null;
        let lat = null;
        let lng = null;

        // --- Logic: Agar banda kaam par aaya hai (Leave NAHI hai) ---
        if (!leaveStatus) {
            // Check 1: Kya camera se photo aayi?
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Live camera photo is required to start the day!"
                });
            }

            // Check 2: Kya location aayi?
            if (!latitude || !longitude) {
                return res.status(400).json({
                    success: false,
                    message: "Location is required for attendance!"
                });
            }

            // Multer ne file save kar di hai, hum sirf uska PATH (URI) database ke liye le rahe hain
            db_image_uri = `/uploads/${req.file.filename}`;
            lat = latitude;
            lng = longitude;
        }

        // --- Logic: Agar Leave hai ---
        else {
            console.log("User is on leave. Saving entry without photo/location.");
            // image_uri, lat, lng sab NULL hi rahenge
        }

        // 2. Database (Attendance Table) mein entry maarna
        const newAttendance = await Attendance.create({
            user_id: user_id, // AuthenticateToken se aaya
            image_uri: db_image_uri, // Database mein sirf path jayega
            latitude: lat,
            longitude: lng,
            mobile_time: time,
            isLeave: leaveStatus,
            status: 'start'
        });

        // 3. Final Response
        res.status(201).json({
            success: true,
            message: leaveStatus ? "Leave marked successfully!" : "Day started successfully!",
            data: {
                id: newAttendance.id,
                time: newAttendance.mobile_time,
                image: newAttendance.image_uri, // Frontend ko batana ke ye path save hua hai
                isLeave: newAttendance.isLeave
            }
        });

    } catch (error) {
        console.error("❌ Attendance Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};