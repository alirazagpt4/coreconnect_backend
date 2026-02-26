'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, unique: true },
      cnic: { type: Sequelize.STRING, unique: true },
      city_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Cities', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      designation_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Designations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};