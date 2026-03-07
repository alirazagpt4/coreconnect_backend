import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users', // Table ka naam database mein 'Users' hai
            key: 'id'
        }
    },
    image_uri: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Path of the uploaded image in uploads folder"
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8), // Precision for GPS coordinates
        allowNull: true
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
    },
    mobile_time: {
        type: DataTypes.STRING, // Jo mobile se 24hr format mein aa raha hai
        allowNull: true
    },
    isLeave: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.ENUM('absent', 'present'), // Takay pata chalay din shuru hua ya khatam
        defaultValue: 'present'
    }
}, {
    freezeTableName: true,
    tableName: 'Attendances',
    timestamps: true // Ye 'createdAt' (Server Time) khud manage karega
});

export default Attendance;