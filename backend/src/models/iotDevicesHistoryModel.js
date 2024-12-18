'use strict';
import {Model, DataTypes} from 'sequelize';
import db  from '../managers/databaseSequelize.js'; // Importe o sequelize configurado

class iotDevicesHistory extends Model {
    static associate(models) {
    }
}

iotDevicesHistory.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
    sensor_name: DataTypes.STRING,
    deveui: DataTypes.STRING,
    battery: DataTypes.STRING,
    co2: DataTypes.STRING,
    humidity: DataTypes.STRING,
    temperature: DataTypes.STRING,
    leak: DataTypes.STRING,
    pir: DataTypes.STRING,
    light_level: DataTypes.STRING,
    hcho: DataTypes.STRING,
    pm2_5: DataTypes.STRING,
    pm10: DataTypes.STRING,
    o3: DataTypes.STRING,
    tvoc: DataTypes.STRING,
    pressure: DataTypes.STRING,
    magnet_status: DataTypes.BIGINT,
    tamper_status: DataTypes.BIGINT,
    daylight: DataTypes.STRING,
    image: DataTypes.STRING,
    wind_direction: DataTypes.STRING,
    wind_speed: DataTypes.STRING,
    rainfall_total: DataTypes.STRING,
    rainfall_counter: DataTypes.STRING,
    power: DataTypes.STRING,
    total_current: DataTypes.STRING,
    current: DataTypes.STRING,
    alarm: DataTypes.STRING,
    press_short: DataTypes.STRING,
    press_long: DataTypes.STRING,
    press_double: DataTypes.STRING,
    'adc-1': DataTypes.INTEGER,
    'adc-1-avg': DataTypes.NUMBER,
    'adc-1-max': DataTypes.INTEGER,
    'adc-1-min': DataTypes.INTEGER,
    'adc-2': DataTypes.INTEGER,
    'adc-2-avg': DataTypes.NUMBER,
    'adc-2-max': DataTypes.INTEGER,
    'adc-2-min': DataTypes.INTEGER,
    'adv-1': DataTypes.INTEGER,
    'adv-2': DataTypes.INTEGER,
    'counter-1': DataTypes.INTEGER,
    'counter-2': DataTypes.INTEGER,
    'counter-3': DataTypes.INTEGER,
    'counter-4': DataTypes.INTEGER,
    'gpio-in-1': DataTypes.STRING,
    'gpio-in-2': DataTypes.STRING,
    'gpio-in-3': DataTypes.STRING,
    'gpio-in-4': DataTypes.STRING,
    'gpio-out-1': DataTypes.STRING,
    'gpio-out-2': DataTypes.STRING,
    'pt100-1': DataTypes.INTEGER,
    'pt100-2': DataTypes.INTEGER,
    'people_count_all': DataTypes.INTEGER,
    'people_count_max': DataTypes.INTEGER,
    'people_in': DataTypes.INTEGER,
    'people_out': DataTypes.INTEGER,
    'people_total_in': DataTypes.INTEGER,
    'people_total_out': DataTypes.INTEGER,
    'region_1': DataTypes.INTEGER,
    'region_2': DataTypes.INTEGER,
    'region_3': DataTypes.INTEGER,
    'region_4': DataTypes.INTEGER,
    'region_5': DataTypes.INTEGER,
    'region_6': DataTypes.INTEGER,
    'region_7': DataTypes.INTEGER,
    'region_8': DataTypes.INTEGER,
    'region_9': DataTypes.INTEGER,
    'region_10': DataTypes.INTEGER,
    'region_11': DataTypes.INTEGER,
    'region_12': DataTypes.INTEGER,
    'region_13': DataTypes.INTEGER,
    'region_14': DataTypes.INTEGER,
    'region_15': DataTypes.INTEGER,
    'region_16': DataTypes.INTEGER,
    'a_to_a': DataTypes.INTEGER,
    'a_to_b': DataTypes.INTEGER,
    'a_to_c': DataTypes.INTEGER,
    'a_to_d': DataTypes.INTEGER,
    'b_to_a': DataTypes.INTEGER,
    'b_to_b': DataTypes.INTEGER,
    'b_to_c': DataTypes.INTEGER,
    'b_to_d': DataTypes.INTEGER,
    'c_to_a': DataTypes.INTEGER,
    'c_to_b': DataTypes.INTEGER,
    'c_to_c': DataTypes.INTEGER,
    'c_to_d': DataTypes.INTEGER,
    'd_to_a': DataTypes.INTEGER,
    'd_to_b': DataTypes.INTEGER,
    'd_to_c': DataTypes.INTEGER,
    'd_to_d': DataTypes.INTEGER,
    date: DataTypes.DATE
  }, {
    sequelize: db.sequelize,
    modelName: 'iotDevicesHistory',
    tableName: 'iot_devices_history', // Defina o nome da tabela aqui
    timestamps: false  
});
export default iotDevicesHistory;;