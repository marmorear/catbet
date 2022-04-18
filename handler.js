"use strict";
const express = require("express");
const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true}))

app.use( (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next();
})

const AWS = require("aws-sdk");
AWS.config.update({ region:'us-east-1' });
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

module.exports.listarAposta = async (event,context,callback) => {

  try {
    const { catName } = event.pathParameters;
    const data = await dynamoDb
      .get({
        ...params,
        Key: {
          cat_name: catName,
        },
      })
      .promise();

    if (!data.Item) {
      callback (null,{
        body: JSON.stringify("Apostador não localizado."),
        headers: { 'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'},
        statusCode: 400,
      });
    }

    const apostas = data.Item;
  return callback(null,{
    body: JSON.stringify(apostas),
    headers: { 'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'},
    statusCode: 200,
  });
} catch (err) {
  console.log("Error", err);
  callback(null,{
    body: JSON.stringify("Erro interno."),
    headers: { 'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'},
    statusCode: 500,
  });
}
};


module.exports.listarPeixes = async (event,context, callback) => {
  const {long, lat} = event.queryStringParameters;
  const peixes = 
  [
    { id: 1, nomePeixe: "Atum"},
    { id: 2, nomePeixe: "Sardinha"},
    { id: 3, nomePeixe: "Salmão"},
    { id: 4, nomePeixe: "Cação"},
    { id: 5, nomePeixe: "Tilapia"},
    { id: 6, nomePeixe: "Pintado"}
  ];
  await (async () => {
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
        callback(null,{
          body: JSON.stringify(peixes),
          headers: { 'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'},
          statusCode: 200,
        });
        
      }else{
        console.log("Frio demais para os peixes competirem.")
        callback (null,{
          body: JSON.stringify("Frio demais para os peixes competirem."),
          headers: { 'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'},
          statusCode: 400,
        });
      }
    }else{
      console.log("API externa com problema.")
      callback(null, {
        body: JSON.stringify("API externa com problema."),
        headers: { 'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'},
        statusCode: 400,
      });
    }
  } catch (error) {
    console.log(error.response);
    callback(null,{
      body: JSON.stringify("Erro interno."),
      headers: { 'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'},
      statusCode: 500,
    });
  }
  })();
};

module.exports.criaAposta = async (event,context,callback) => {
  try {
    const json = JSON.parse(event.body);

    // YOUR CODE HERE

} catch (e) {
    console.error(e);
    callback(null, { statusCode: 504, headers: { "Content-Type": "application/json"}, body: JSON.stringify({ message: "Internal Error" }) });
}
  // console.log(event);
  // const timestamp = new Date().getTime();
 
  // try {
  //   const timestamp = new Date().getTime();

  //   let dados = JSON.parse(event.body);

  //   const { nomeGato, idPeixe, qtdRacao } = dados;

  //   const aposta = {
  //     aposta_id: uuidv4(),
  //     nomeGato,
  //     idPeixe,
  //     qtdRacao,
  //     criado_em: timestamp
  //   };

  //   await dynamoDb
  //     .put({
  //       TableName: "CATS_TABLE",
  //       Item: aposta,
  //     })
  //     .promise();
  //     console.log(aposta);

  //   return {
  //     statusCode: 204,
  //   };
  // } catch (err) {
  //   console.log("Error", err);
  //   return {
  //     statusCode: err.statusCode ? err.statusCode : 500,
  //     body: JSON.stringify({
  //       error: err.name ? err.name : "Exception",
  //       message: err.message ? err.message : "Unknown error",
  //     }),
  //   };
  // }
};


