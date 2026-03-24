'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Column add karein
    await queryInterface.addColumn('Stores', 'channel_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Shuru mein true taake existing data block na ho
      references: {
        model: 'Channels', // Target table name
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 2. Performance ke liye Index add karein (Very Important for Speed)
    await queryInterface.addIndex('Stores', ['channel_id'], {
      name: 'stores_channel_id_index'
    });
  },

  down: async (queryInterface) => {
    // Rollback ke liye pehle index remove karein phir column
    await queryInterface.removeIndex('Stores', 'stores_channel_id_index');
    await queryInterface.removeColumn('Stores', 'channel_id');
  }
};