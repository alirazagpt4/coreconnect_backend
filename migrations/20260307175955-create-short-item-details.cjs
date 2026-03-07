'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ShortItemDetails', {
      id: { allowSmtNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      short_item_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'ShortItems', key: 'id' }, onDelete: 'CASCADE' },
      item_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'ItemMasters', key: 'id' } },
      createdAt: { allowSmtNull: false, type: Sequelize.DATE },
      updatedAt: { allowSmtNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ShortItemDetails');
  }
};