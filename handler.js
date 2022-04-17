"use strict";

const peixes = 
  [
    { id: 1, nomePeixe: "Atum"},
    { id: 2, nomePeixe: "Sardinha"},
    { id: 3, nomePeixe: "Salmão"},
    { id: 4, nomePeixe: "Cação"},
    { id: 5, nomePeixe: "Tilapia"},
    { id: 6, nomePeixe: "Pintado"}
    
  ];


const bp = require("body-parser");
const express = require("express");
const app = express();

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const superagent = require('superagent');
const temperatures = require("temperatures").default;

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
  try {
  const { catname } = event.pathParameters;
  const data = await dynamoDb
      .get({
        ...params,
        Key: {
          name: catname,
        },
      })
      .promise();

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Apostador não existe" }, null, 2),
      };
    }

    const apostas = data.Item;
  return {
        "body": JSON.stringify(apostas),
        "headers": {},
        "statusCode": 200
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


module.exports.listarPeixes = async (event) => {
  const {long, lat} = event.queryStringParameters;
  (async () => {
    try {
      const queryArguments = {
        lat: lat,
        lon: long,
        appid: 'c6e29887c71721b155d59554f3e2c620',
      }

    const response = await superagent.get('https://api.openweathermap.org/data/2.5/weather').query(queryArguments)
    console.log(response.body.main.temp);

    if (response.status == 200){
      var tempCelsius = (temperatures.convert({
        from: "K",
        to: "C",
        value:response.body.main.temp 
      }));
      console.log(tempCelsius)
      if(tempCelsius >= 22){
        console.log("Deu certo!")
        var retorno = {
          "body": JSON.stringify(peixes),
          "headers": {},
          "statusCode": 200,
        };
        return retorno
      }else{
        console.log("Frio demais para os peixes competirem.")
        return {
          "body": JSON.stringify("Frio demais para os peixes competirem."),
          "headers": {},
          "statusCode": 400,
        };
      }
    }else{
      console.log("API externa com problema.")
      return {
        "body": JSON.stringify("API externa com problema."),
        "headers": {},
        "statusCode": 400,
      };
    }
  } catch (error) {
    console.log(error.response);
    return {
      "body": JSON.stringify("Erro interno."),
      "headers": {},
      "statusCode": 500,
    };
  }
  })();
};

module.exports.apostar = async (event) => {
  console.log(event);
  try {
    const timestamp = new Date().getTime();

    let dados = JSON.parse(event.body);

    const { nome, id_peixe, unidades_racao } = dados;

    const aposta = {
      aposta_id: uuidv4(),
      nome,
      id_peixe,
      unidades_racao,
      criado_em: timestamp
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


