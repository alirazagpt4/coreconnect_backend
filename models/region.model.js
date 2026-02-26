import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Region = sequelize.define('Region', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: { type: DataTypes.STRING, allowNull: false }
}, {
    freezeTableName: true,
    timestamps: false,
    tableName: 'Regions'
});

export default Region;