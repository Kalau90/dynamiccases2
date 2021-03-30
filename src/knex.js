const Knex = require("knex");

const knex = Knex({client: 'mysql', connection: process.env.DB_URL, path: '../../'})

module.exports = knex;
