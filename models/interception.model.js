import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Interception = sequelize.define('Interception', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    report_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    intercepted: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    converted: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    // Yeh field ratio percentage (%) store karegi
    ratio: {
        type: DataTypes.DECIMAL(5, 2), // Example: 20.50, 100.00
        allowNull: false,
        defaultValue: 0
    },
    ba_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    store_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'interceptions',
    timestamps: true,
    hooks: {
        // Data save hone se pehle auto-calculation ka hook
        beforeSave: (instance) => {
            if (instance.intercepted > 0) {
                const calculatedRatio = (instance.converted / instance.intercepted) * 100;
                instance.ratio = parseFloat(calculatedRatio.toFixed(2));
            } else {
                instance.ratio = 0;
            }
        }
    }
});

export default Interception;