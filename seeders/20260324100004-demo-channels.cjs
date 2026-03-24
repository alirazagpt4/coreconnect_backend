'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Channels', [
      { name: 'Al-Fatah', is_active: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Metro', is_active: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Carrefour', is_active: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Imtiaz Super Market', is_active: true, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Chase Up', is_active: true, createdAt: new Date(), updatedAt: new Date() }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Channels', null, {});
  }
};