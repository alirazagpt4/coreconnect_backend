module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'user', 'supervisor', 'brandadmin', 'ccadmin', 'auditor'),
      defaultValue: 'user'
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Reverse logic agar migration roll back karni ho
  }
};