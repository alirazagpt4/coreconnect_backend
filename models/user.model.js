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
    fullname: {
        type: DataTypes.STRING,
        allowNull: false,
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
    // Role ENUM ko update kiya
    role: {
        type: DataTypes.ENUM('admin', 'user', 'supervisor', 'brandadmin', 'ccadmin'),
        defaultValue: 'user'
    },
    reportTo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'User', key: 'id' } // Yahan 'User' hi rakhein agar freezeTableName true hai
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    freezeTableName: true, // Taake table ka naam 'User' hi rahe
    timestamps: true,
    tableName: 'Users'
});

export default User;