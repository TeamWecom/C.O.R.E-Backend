// controllers/webServerController.js
import { send } from '../managers/webSocketManager.js';
import { getDateNow } from '../utils/getDateNow.js';
import { triggerActionByImagem, triggerActionBySensor } from './actionController.js';
import db from '../managers/databaseSequelize.js';
import { QueryTypes, Op, fn, col } from 'sequelize';
import { stringToBase64 } from '../utils/typeHelpers.js';
import { log } from '../utils/log.js';
import {getParametersByDeviceName} from '../utils/milesightParameters.js';
import {sendHttpPostRequest, sendHttpGetRequest } from '../managers/httpClient.js'
import {licenseFileWithUsage} from '../controllers/licenseController.js'
import { thresholdManager } from './buttonController.js';
let devices = [];

export const receiveSensor = async (obj) => {
    try {
        let resultAction = {};
        //
        // Verificar ações cadastradas para esse sensor
        //
        obj.date = getDateNow();
        
        try {
            resultAction = await triggerActionBySensor(obj);
            log("milesightController:receiveSensor:triggerActionBySensor result "+resultAction);
        } catch (e) {
            log("milesightController:receiveSensor:triggerActionBySensor error "+ e);
        }

        //
        // Atualizar botões dos usuários sobre info recebida do sensor
        //
        let count = 0;

        const distinctSensorsButtons = await db.button.findAll({
            where: {
                button_prt: obj.deveui
            },
            attributes: [
                [fn('DISTINCT', col('button_user')), 'button_user'], // Filtrar por button_user distinto
            ]
        });

        
        //Atualizar valores dos botões na console dos usuários
        if (distinctSensorsButtons.length > 0) {
            distinctSensorsButtons.forEach((bs) => {
                // log("danilo-req sensorReceived: sensors.forEach " + JSON.stringify(bs));
                const userConnected = send(bs.button_user, { api: "user", mt: "SensorReceived", value: obj });
                if(userConnected){
                    count++;
                }
                
            });
        }

        await thresholdManager(obj);

        const result = await db.iotDevicesHistory.create(obj);
        log("milesightController:receiveSensor: event inserted into DB with id " + result.id+" and "+count+" users notified");
        return { msg: result, usersNotified: count };
    } catch (e) {
        log("milesightController:receiveSensor: Body not present! Erro " + e);
        throw new Error(e);
    }
};

export const receiveImage = async (obj) => {
    try {
        //log("milesightController:receiveImage: " + JSON.stringify(obj));
        let values = obj.values;
        let devMac = values.devMac;
        values.devMac = devMac.replace(/:/g, '');;
        values.date = getDateNow();

        //
        // Atualizar botões dos usuários sobre info recebida do sensor
        //
        let count = 0;
        let result;
        const sensorsButtons = await db.button.findAll({
            where: {
                button_prt: values.devMac,
            },
        });

    //Localiza o nome cadastrado para o MAC da camera
        const iotCam = await db.camera.findOne(
            {
                where: {
                mac: values.devMac
            }
        })

        if (sensorsButtons.length > 0) {
            let objToReturn = {sensor_name: iotCam.nickname, deveui: values.devMac, date: values.date, image: values.image}
            sensorsButtons.forEach((bs) => {
                // log("danilo-req sensorReceived: sensors.forEach " + JSON.stringify(bs));
                const userConnected = send(bs.button_user, { api: "user", mt: "ImageReceived", result: [objToReturn] });
                if(userConnected){
                    count++;
                }
                
            });
        }

        
        if(iotCam){
            try {
                const license = await licenseFileWithUsage();
                if (license.openai && license.openai.total == true){
                    const resultAction = await triggerActionByImagem(obj.values);
                    log("milesightController:receiveImagem:triggerActionByImagem result "+resultAction);
                }else{
                    log("milesightController:receiveImagem: Sem licença OpenAI para triggerActionByImagem");
                }   
            } catch (e) {
                log("milesightController:receiveImagem:triggerActionByImagem error "+ e);
            }

            // Insere na tabela de histórico dos sensores
            let objToInsert = { deveui: values.devMac, sensor_name: iotCam.nickname, battery: values.battery, image: values.image, date: values.date}

            result = await db.iotDevicesHistory.create(objToInsert);
            log("milesightController:receiveImage: event inserted into DB with id " + result.id+" and "+count+" users notified");
        }else{
            log("milesightController:receiveImage: event skiped Cam not in DB");
        }
        
        return { msg: result, usersNotified: count };
    } catch (e) {
        log("milesightController:receiveImage: Body not present! Erro " + e);
        throw new Error(e);
    }
};
//
// Verificar ações cadastradas para o alarme recebido
//
export const receiveAlarm = async (obj) => {
    try {
        let triggerAlarmResult = 0;
        //
        // Verificar ações cadastradas para esse sensor
        //
        obj.date = getDateNow();
        //log("danilo-req sensorReceived:value " + JSON.stringify(obj));
        
        try {
            const resultAction = await triggerActionBySensor(obj);
            log("milesightController:receiveAlarm:triggerActionBySensor result "+resultAction);
        } catch (e) {
            log("milesightController:receiveAlarm:triggerActionBySensor error "+ e);
        }
        //
        // Atualizar botões dos usuários sobre info recebida do sensor
        //
        const pressType = Object.keys(obj).find(key => key.startsWith("press_")); // Encontrar chave dinâmica


        const phisicalButtons = await db.button.findAll({
            where: {
                button_prt: obj.deveui,
                sensor_type: pressType,
                button_device: obj[pressType].toString() // Converte o valor para string
            },
        });

        if (phisicalButtons.length > 0) {
            phisicalButtons.forEach(async (b) => {

                const isAlarmed = await db.activeAlarms.findOne({
                    where: {
                        btn_id: b.id
                    }
                })
                if(!isAlarmed){
                    // log("danilo-req sensorReceived: sensors.forEach " + JSON.stringify(bs));
                    const sendResult = await send(b.button_user, { api: "user", mt: "SmartButtonReceived", alarm: pressType, btn_id: b.id, src: obj.deveui, date: getDateNow() })
                    if(sendResult){triggerAlarmResult +=1}
                    //intert into DB the event
                    var msg = { 
                        guid: b.button_user, 
                        from: obj.deveui, 
                        name: "button", 
                        date: getDateNow(), 
                        status: "start", 
                        details: b.id, //details.id para obter o id que antes era direto no details
                        prt: b.sensor_type+'_'+b.button_device, 
                        min_threshold: b.sensor_min_threshold, 
                        max_threshold: b.sensor_max_threshold
                    }
                    //log("milesightController:receiveAlarm: will insert it on DB : " + JSON.stringify(msg));
                    let resultInsert = await db.activity.create(msg)
                    resultInsert.details = b
                    send(b.button_user, { api: "user", mt: "getHistoryResult", result: [resultInsert]});

                    // insert active Alarmed Button for user
                    const objAlarm = { from: obj.deveui, prt: pressType, date: getDateNow(), btn_id: b.id }
                    const result = await db.activeAlarms.create(objAlarm)
                    log('milesightController:receiveAlarm: ActiveAlarm create result ' + result.id)
                }else{
                    log("milesightController:receiveAlarm: button is alarmed");
                }
            });
        }

        const resultInsert = await db.iotDevicesHistory.create(obj);
        log("milesightController:receiveAlarm: event inserted into DB with id " + resultInsert.id);
        return { msg: resultInsert, alarmResult: triggerAlarmResult };

    } catch (e) {
        return { msg: 'Error', e: e };
    }
};

export const receiveController = async (obj) =>{
    try{
        //log("milesightController:receiveController received "+ JSON.stringify(obj));
        obj.date = getDateNow();
        //
        // Atualizar botões dos usuários sobre info recebida do sensor
        //
        let count = 0;

        const sensorsButtons = await db.button.findAll({
            where: {
                button_device: obj.deveui,
            },
        });

        if (sensorsButtons.length > 0) {
            sensorsButtons.forEach((bs) => {
                // log("danilo-req sensorReceived: sensors.forEach " + JSON.stringify(bs));
                let value = obj[bs.button_prt]
                const userConnected = send(bs.button_user, { api: "user", mt: "ControllerReceived", btn_id: bs.id, prt: bs.button_prt, value: value });
                if(userConnected){
                    count++;
                }
            });
        }

        const result = await db.iotDevicesHistory.create(obj);
        log("milesightController:receiveController: event inserted into DB with id " + result.id+" and "+count+" users notified");
        return { msg: result, usersNotified: count };

    }catch(e){
        log('danilo-req: error '+e)

    }
    

}

export const getDevices = async () =>{
    let gateways = await db.gateway.findAll();
    devices = []
    async function fetchDevices(gateways) {
        for (const gateway of gateways) {
            // Dados de autenticação
            const authData = {"password": gateway.password, "username": gateway.userapi};
    
            try {
                // Solicitação de autenticação
                const authResponse = await sendHttpPostRequest(gateway.host + '/api/internal/login', JSON.stringify(authData), '{}');
                
                if (authResponse && authResponse.data && authResponse.data.jwt) {
                    const token = authResponse.data.jwt;
    
                    // Cabeçalho de autorização
                    const customHeaders = JSON.stringify({
                        'Authorization': `Bearer ${token}`
                    });
    
                    // Solicitação para obter dispositivos
                    const devicesResponse = await sendHttpGetRequest(gateway.host + '/api/devices?limit=100&offset=0', customHeaders);
    
                    if (devicesResponse && devicesResponse.data) {
                        const result = devicesResponse.data;

                        const deviceObjs = result.devices;
                        log('milesightController:getDevices::fetchDevices::: result devices lenght: '+deviceObjs.length)
                        deviceObjs.forEach(async(d)=>{
                            const parameters = getParametersByDeviceName(d.description)
                            d.parameters = parameters
                        })

                        // Cria um novo objeto com a chave dinâmica baseada no gateway.id
                        var device = {};
                        device[gateway.id] = result;

                        // Adiciona o objeto à lista
                        devices.push(device);
                    } else {
                        // Trata caso de falha ao obter dispositivos
                        // conn.send(JSON.stringify({ api: "admin", mt: "SelectSensorNameResult", error: "Failed to fetch devices" }));
                    }
                } else {
                    // Trata caso de falha na autenticação
                    // conn.send(JSON.stringify({ api: "admin", mt: "SelectSensorNameResult", error: "Authentication failed" }));
                }
            } catch (error) {
                log('milesightController:getDevices: error '+error.message);
            }
        }
    }
    
    // Chama a função assíncrona e aguarda a conclusão antes de enviar a resposta via websocket
    await fetchDevices(gateways);
    return devices;
}
//
// Função para retornar o gatewayId
//
export const findGatewayIdByDevEUI = async (gateways, targetDevEUI) =>{
    for (const gateway of gateways) {
      for (const [gatewayId, data] of Object.entries(gateway)) {
        if (data.devices) {
          for (const device of data.devices) {
            if (device.devEUI === targetDevEUI) {
              return gatewayId;
            }
          }
        }
      }
    }
    return null; // Retorna null se o device com o devEUI não for encontrado
  }

export const TriggerCommand = async(gateway_id, device, prt) => {
    try{
        const gateways = await db.gateway.findAll({
            where: {
                id: gateway_id
            }
        })
        async function fetchDevices(gateways) {
            for (const gateway of gateways) {
                // Dados de autenticação
                const authData = {"password": gateway.password, "username": gateway.userapi};
        
                try {
                    // Solicitação de autenticação
                    const authResponse = await sendHttpPostRequest(gateway.host + '/api/internal/login', JSON.stringify(authData), '{}');
                    
                    if (authResponse && authResponse.data && authResponse.data.jwt) {
                        const token = authResponse.data.jwt;
        
                        // Cabeçalho de autorização
                        const customHeaders = JSON.stringify({
                            'Authorization': `Bearer ${token}`
                        });
                        
                        const command = {
                            "confirmed": false,
                            "data": stringToBase64(prt),
                            "devEUI": device,
                            "fPort": 85
                        }
                        // Solicitação para obter dispositivos
                        const commandResponse = await sendHttpPostRequest(gateway.host + '/api/devices/'+device+'/queue', JSON.stringify(command), customHeaders);
                    
                        if (commandResponse && commandResponse.data.length>0) {
                            const result = commandResponse.data;
                            log('milesightController:TriggerCommand result data: '+ JSON.stringify(result))
                            
                        } else {
                        }
                        return commandResponse.statusText;
                    } else {
                        // Trata caso de falha na autenticação
                        return authResponse.statusText;
                    }
                } catch (error) {
                    // Trata qualquer erro que ocorra durante as requisições
                    return error.message;
                }
            }
        }
                            
        // Chama a função assíncrona e aguarda a conclusão antes de enviar a resposta via websocket
        return await fetchDevices(gateways);
    }catch(e){
        log('milesightController:TriggerCommand error '+ e)
        // Trata qualquer erro que ocorra durante as requisições
        return e.message;
    }
}

export const returnModelByEUI = async(devEUI) =>{

    if(devices.length==0){
        await getDevices()
    }
    for (const deviceGroup of devices) {
        for (const group of Object.values(deviceGroup)) {
            const device = group.devices.find(d => d.devEUI === devEUI);
            if (device) {
                return device.description;
            }
        }
    }
    return null;
}

export const addGateway = async (obj) => {
    let objResult = { api: "admin"}
    const license = await licenseFileWithUsage();
    if (license.gateway && license.gateway.used >= license.gateway.total){
        log("milesightController:addGateway: Limite de gateways atingido, contratar nova licença");
        objResult.mt = "AddGatewayError"
        objResult.result = 'noMoreLicenses'
        return objResult;
    }

    const insertResult = await db.gateway.create(obj)
    objResult.mt = "AddGatewaySuccess"
    objResult.result = insertResult;
    
    return objResult;
}