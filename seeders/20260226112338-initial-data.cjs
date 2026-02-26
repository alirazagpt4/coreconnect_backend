'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Pakistan ki Main Cities
    const citiesList = [
      'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala',
      'Multan', 'Hyderabad', 'Peshawar', 'Quetta', 'Islamabad',
      'Sargodha', 'Sialkot', 'Bahawalpur', 'Sukkur', 'Jhang',
      'Sheikhupura', 'Larkana', 'Gujrat', 'Mardan', 'Kasur',
      'Rahim Yar Khan', 'Sahiwal', 'Okara', 'Wah Cantonment',
      'Dera Ghazi Khan', 'Mirpur Khas', 'Nawabshah', 'Chiniot',
      'Burewala', 'Jhelum', 'Sadiqabad', 'Khanewal', 'Hafizabad',
      'Kohat', 'Jacobabad', 'Muzaffargarh', 'Muridke',
      'Abbottabad', 'Muzaffarabad'
    ].map(name => ({ name, createdAt: new Date(), updatedAt: new Date() }));

    await queryInterface.bulkInsert('Cities', citiesList);

    // 2. Regions
    await queryInterface.bulkInsert('Regions', [
      { name: 'North', createdAt: new Date(), updatedAt: new Date() },
      { name: 'South', createdAt: new Date(), updatedAt: new Date() },
      { name: 'East', createdAt: new Date(), updatedAt: new Date() },
      { name: 'West', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Central', createdAt: new Date(), updatedAt: new Date() }
    ]);

    // 3. Designations
    await queryInterface.bulkInsert('Designations', [
      { name: 'Supervisor', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Sales Executive', createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Cities', null, {});
    await queryInterface.bulkDelete('Regions', null, {});
    await queryInterface.bulkDelete('Designations', null, {});
  }
};