'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SaleItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sale_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Sales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Master delete toh detail bhi khatam
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ItemMasters', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Item delete nahi hone deni agar sale ho chuki hai
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      subtotal: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('SaleItems');
  }
};

