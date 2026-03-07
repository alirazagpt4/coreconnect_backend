'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ShortItems', {
      id: { allowSmtNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      store_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Stores', key: 'id' } },
      ba_user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
      report_date: { type: Sequelize.DATEONLY, defaultValue: Sequelize.NOW },
      createdAt: { allowSmtNull: false, type: Sequelize.DATE },
      updatedAt: { allowSmtNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ShortItems');
  }
};