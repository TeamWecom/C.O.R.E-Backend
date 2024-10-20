'use strict';
import {Model, DataTypes} from 'sequelize';
import db  from '../managers/databaseSequelize.js'; // Importe o sequelize configurado
class Preference extends Model {
    static associate(models) {
    }
}

Preference.init({
    guid: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: 'user',  // Faz referência ao modelo User
        key: 'guid',  // A coluna guid no modelo User
      },
      onDelete: 'CASCADE',  // Remove as preferências se o usuário for deletado
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    page1 : DataTypes.STRING,
    page2 : DataTypes.STRING,
    page3 : DataTypes.STRING,
    page4 : DataTypes.STRING,
    page5 : DataTypes.STRING
  }, {
    sequelize:db.sequelize,
    tableName: 'user_preferences', // Defina o nome da tabela aqui
    modelName: 'preference',
  });
  // Definir a associação no próprio modelo
  Preference.associate = (models) => {
    Preference.belongsTo(models.User, { foreignKey: 'guid' });
  };

export default Preference;