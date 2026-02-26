import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        unique: true
    },
    cnic: {
        type: DataTypes.STRING,
        unique: true
    },
    address: {
        type: DataTypes.TEXT
    },
    // Missing Foreign Keys yahan add kardi hain:
    city_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'City', key: 'id' }
    },
    region_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Region', key: 'id' }
    },
    designation_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Designation', key: 'id' }
    },
    role: {
        type: DataTypes.ENUM('user', 'admin', 'supervisor'),
        defaultValue: 'user'
    },
    reportTo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'User', key: 'id' } // Yahan 'User' hi rakhein agar freezeTableName true hai
    }
}, {
    freezeTableName: true, // Taake table ka naam 'User' hi rahe
    timestamps: true,
    tableName: 'Users'
});

export default User;