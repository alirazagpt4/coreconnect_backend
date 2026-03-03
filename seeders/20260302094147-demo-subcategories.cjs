'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const subCategories = [];
    const brands = [
      { id: 1, name: 'AMRIJ' },
      { id: 2, name: 'EVERNOYA' },
      { id: 3, name: 'NO!MO!' },
      { id: 4, name: 'RHD' },
      { id: 5, name: 'RIVAJ' }
    ];
    const types = ['COSMETIC', 'FRAGRANCES', 'GROCERY', 'HAIR CARE', 'SKIN CARE'];

    let count = 1;
    brands.forEach(brand => {
      types.forEach(type => {
        subCategories.push({
          id: count++,
          subcategory_name: type,
          category_id: brand.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    });

    await queryInterface.bulkInsert('SubCategories', subCategories, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SubCategories', null, {});
  }
};