'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ItemMasters', {
      id: { allowAutoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      item_code: { type: Sequelize.STRING, allowNull: false, unique: true },
      product_name: { type: Sequelize.STRING, allowNull: false },
      category_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Categories', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      subcategory_id: {
        type: Sequelize.INTEGER,
        references: { model: 'SubCategories', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      retail_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      discount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0.00 },
      price_after_discount: { type: Sequelize.DECIMAL(10, 2) },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('ItemMasters'); }
};