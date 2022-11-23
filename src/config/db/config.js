const Sequelize = require('sequelize');

const database = "Portafolio";
const host = "localhost";
const userDb = "fabian";
const userPass = 'oracle';
const dialectDb = "mssql";
const port = 1433;


module.exports = new Sequelize(database, userDb, userPass, {
    host: host,
    port: port,
    dialect: dialectDb,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});