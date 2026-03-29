// Migration file
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ExpiryStockDetails', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
    await queryInterface.addColumn('ExpiryStockDetails', 'picture', {
      type: Sequelize.STRING,
      allowNull: true // Picture optional ho sakti hai ya required as per your need
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ExpiryStockDetails', 'quantity');
    await queryInterface.removeColumn('ExpiryStockDetails', 'picture');
  }
};