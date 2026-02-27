import User from './user.model.js';
import City from './city.model.js';
import Region from './region.model.js';
import Designation from './designation.model.js';
import Attendance from './attendance.model.js';
// Relationships
User.belongsTo(City, { foreignKey: 'city_id', as: 'city' });
User.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
User.belongsTo(Designation, { foreignKey: 'designation_id', as: 'designation' });


// Self-referencing association (Hierarchy)
User.belongsTo(User, { as: 'manager', foreignKey: 'reportTo' });
User.hasMany(User, { as: 'subordinates', foreignKey: 'reportTo' });


Attendance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Ek User ki bohat saari Attendance records ho sakti hain
User.hasMany(Attendance, { foreignKey: 'user_id', as: 'attendances' });


export { User, City, Region, Designation, Attendance };