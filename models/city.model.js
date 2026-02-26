import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const City = sequelize.define('City', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    name: { type: DataTypes.STRING, allowNull: false }
}, { 
    freezeTableName: true, 
    timestamps: false ,
    tableName: 'Cities'
});

export default City;