'use strict';
import {Model, DataTypes} from 'sequelize';
import db  from '../managers/databaseSequelize.js'; // Importe o sequelize configurado
class Config extends Model {
  static associate(models) {
  }
}
  Config.init({
    entry : DataTypes.STRING,
    value : DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize:db.sequelize,
    modelName: 'config',
    tableName: 'configs', // Defina o nome da tabela aqui
    timestamps: true
  });
export default Config;