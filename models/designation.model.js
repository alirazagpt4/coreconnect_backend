import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Designation = sequelize.define('Designation', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    name: { type: DataTypes.STRING, allowNull: false }
}, { 
    freezeTableName: true, 
    timestamps: false ,
    tableName: 'Designations'
});

export default Designation;