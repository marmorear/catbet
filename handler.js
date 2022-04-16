"use strict";

const gatos = [
  { id: 1, nome: "Maria", dataNascimento: "1984-11-01" },
  { id: 2, nome: "Joao", dataNascimento: "1980-01-16" },
  { id: 3, nome: "Jose", dataNascimento: "1998-06-06" },
];

var bodyParser = require('body-parser')

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const superagent = require('superagent');

const dynamodbOfflineOptions = {
  region: "localhost",
  endpoint: "http://localhost:8000"
}

const isOffline = () => process.env.IS_OFFLINE;

const dynamoDb = isOffline() 
  ? new AWS.DynamoDB.DocumentClient(dynamodbOfflineOptions) 
  : new AWS.DynamoDB.DocumentClient();


const params = {
  TableName: process.env.CATS_TABLE,
};

module.exports.listarAposta = async (event) => {
  console.log(event)
  return {
    statusCode: 201
  };
  
};

module.exports.listarPeixes = async (event) => {
  
  // const {long,lat} = dados;
//   (async () => {
//     try {
//       const queryArguments = {
//         lat: long,
//         lon: lat,
//         appid: 'c6e29887c71721b155d59554f3e2c620',
//       }

//     const response = await superagent.get('https://api.openweathermap.org/data/2.5/weather').query(queryArguments)
//     console.log(response.body.main.temp);
//     console.log(response.status)

//     if (response.status == 200){
//       const kelvinToCelsius = require('kelvin-to-celsius');
//       conversaoCelsius = kelvinToCelsius(response.body.main.temp);
//       console.log(conversaoCelsius);
//       return {
//         statusCode: 200,
//         body: JSON.stringify(response.body),
//       };
//     }
    
//   } catch (error) {
//     console.log(error.response);
//   }
// })();
  
};

module.exports.apostar = async (event) => {
  try {
    console.log(event);
    const timestamp = new Date().getTime();

    let dados = JSON.parse(event.body);

    const { nome, id_peixe, unidades_racao } = dados;

    const aposta = {
      aposta_id: uuidv4(),
      nome,
      id_peixe,
      unidades_racao,
      criado_em: timestamp,
      atualizado_em: timestamp,
    };

    await dynamoDb
      .put({
        TableName: "APOSTA",
        Item: aposta,
      })
      .promise();
      console.log(aposta);

    return {
      statusCode: 204,
    };
  } catch (err) {
    console.log("Error", err);
    return {
      statusCode: err.statusCode ? err.statusCode : 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};


