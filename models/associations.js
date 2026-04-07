import User from './user.model.js';
import City from './city.model.js';
import Region from './region.model.js';
import Designation from './designation.model.js';
import Attendance from './attendance.model.js';
import Store from './store.model.js';
import Category from './category.model.js';
import SubCategory from './subCategory.model.js';
import ItemMaster from './itemMaster.model.js';
import Sale from './sale.model.js';
import SaleItem from './saleItems.model.js';
import ShortItem from './shortItem.model.js';
import ShortItemDetail from './shortItemDetail.model.js';
import Interception from './interception.model.js';
import Channel from './channel.model.js';
import ExpiryStock from './expiryStock.model.js';
import ExpiryStockDetail from './expiryStockDetail.model.js';
import ShortTester from './shortTesters.model.js';
import ShortTesterDetail from './shortTesterDetail.model.js';


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


Store.belongsTo(City, { foreignKey: 'city_id', as: 'city' });
City.hasMany(Store, { foreignKey: 'city_id', as: 'stores' });

Store.belongsTo(Region, { foreignKey: 'region_id', as: 'region' });
Region.hasMany(Store, { foreignKey: 'region_id', as: 'stores' });


Store.belongsTo(User, { foreignKey: 'ba_user_id', as: 'beauty_advisor' });

User.hasMany(Store, { foreignKey: 'ba_user_id', as: 'assigned_stores' });


Store.belongsTo(User, { foreignKey: 'ba_user_id_2', as: 'beauty_advisor_2' });
User.hasMany(Store, { foreignKey: 'ba_user_id_2', as: 'secondary_assigned_stores' });


// Supervisors and stores relationship

Store.belongsTo(User, {
    foreignKey: 'supervisor_id',
    as: 'supervisor'
});

User.hasMany(Store, {
    foreignKey: 'supervisor_id',
    as: 'supervised_stores'
});




// associations.js mein ye add karein:
Category.hasMany(SubCategory, { foreignKey: 'category_id', as: 'subcategories' });
SubCategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });


// Item Master belongs to Category and SubCategory
ItemMaster.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
ItemMaster.belongsTo(SubCategory, { foreignKey: 'subcategory_id', as: 'subcategory' });

// Reverse (Optional but good for reporting)
Category.hasMany(ItemMaster, { foreignKey: 'category_id' });
SubCategory.hasMany(ItemMaster, { foreignKey: 'subcategory_id' });



// 1. Sale Master Relationships
Sale.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Store.hasMany(Sale, { foreignKey: 'store_id', as: 'sales' });

Sale.belongsTo(User, { foreignKey: 'ba_user_id', as: 'beauty_advisor' });
User.hasMany(Sale, { foreignKey: 'ba_user_id', as: 'sales' });


// 2. Sale Master & Detail Link (The Core)
Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'items', onDelete: 'CASCADE' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale_header' });


// 3. Sale Items & Products (ItemMaster)
SaleItem.belongsTo(ItemMaster, { foreignKey: 'item_id', as: 'product' });
ItemMaster.hasMany(SaleItem, { foreignKey: 'item_id', as: 'sold_items' })


// ShortItem Associations
ShortItem.hasMany(ShortItemDetail, { foreignKey: 'short_item_id', as: 'details' });
ShortItemDetail.belongsTo(ShortItem, { foreignKey: 'short_item_id' });

// Yeh missing associations add karein:
ShortItem.belongsTo(Store, { foreignKey: 'store_id', as: 'store' }); // Store ke saath link
ShortItem.belongsTo(User, { foreignKey: 'ba_user_id', as: 'beauty_advisor' }); // BA ke saath link

// Item Master ke saath link
ShortItemDetail.belongsTo(ItemMaster, { foreignKey: 'item_id', as: 'itemInfo' });


Interception.belongsTo(User, { foreignKey: 'ba_user_id', as: 'beauty_advisor' });
User.hasMany(Interception, { foreignKey: 'ba_user_id', as: 'interceptions' });

// Ek interception record ek hi Store ka hota hai
Interception.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Store.hasMany(Interception, { foreignKey: 'store_id', as: 'interceptions' });


// Ek Store (Branch) ek hi Channel (Brand) ka hissa hota hai
Store.belongsTo(Channel, { foreignKey: 'channel_id', as: 'channel' });

// Ek Channel (e.g., Al-Fatah) ke Pakistan mein bohat saare Stores ho sakte hain
Channel.hasMany(Store, { foreignKey: 'channel_id', as: 'stores' });



// --- ShortTester Associations ---
ShortTester.hasMany(ShortTesterDetail, { foreignKey: 'short_tester_id', as: 'details', onDelete: 'CASCADE' });
ShortTesterDetail.belongsTo(ShortTester, { foreignKey: 'short_tester_id', as: 'header' });

ShortTester.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
ShortTester.belongsTo(User, { foreignKey: 'ba_user_id', as: 'beauty_advisor' });

ShortTesterDetail.belongsTo(ItemMaster, { foreignKey: 'item_id', as: 'itemInfo' });


// --- ExpiryStock Associations ---
ExpiryStock.hasMany(ExpiryStockDetail, { foreignKey: 'expiry_stock_id', as: 'details', onDelete: 'CASCADE' });
ExpiryStockDetail.belongsTo(ExpiryStock, { foreignKey: 'expiry_stock_id', as: 'header' });

ExpiryStock.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
ExpiryStock.belongsTo(User, { foreignKey: 'ba_user_id', as: 'beauty_advisor' });

ExpiryStockDetail.belongsTo(ItemMaster, { foreignKey: 'item_id', as: 'itemInfo' });

export { User, City, Region, Designation, Attendance, Store, SubCategory, Category, ItemMaster, Sale, SaleItem, ShortItem, ShortItemDetail, Interception, Channel, ExpiryStock, ExpiryStockDetail, ShortTester, ShortTesterDetail };