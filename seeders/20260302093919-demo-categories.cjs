'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Categories', [
      { id: 1, category_name: 'AMRIJ', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, category_name: 'EVERNOYA', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, category_name: 'NO!MO!', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, category_name: 'RHD', createdAt: new Date(), updatedAt: new Date() },
      { id: 5, category_name: 'RIVAJ', createdAt: new Date(), updatedAt: new Date() }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Ye saari categories ko urha dega agar rollback karna ho
    await queryInterface.bulkDelete('Categories', null, {});
  }
};