/*
 *
 * Middleware asincrono per la gestione del db
 *
 */

// carichiamo il modulo mysql
// e il modulo util per generare Promise
// da funzioni che non generano promise
import mysql from "mysql";
import util from "util";
import promiseMysql from "promise-mysql";

// Creiamo una funzione "factory"
// questo design pattern è pensato per
// creare oggetti già istanziati con tutte le loro proprietà
// makeDb creerà un database che svolge tutte le transazioni
// in modo asincrono
export const makeDb = async function (config) {
  // creiamo il pool di connessione
  // per gestire efficientemente le richieste concorrenti
  // per una singola connessione si può usare createConnection

  // let pool;
  // if (process.env.FUNCTIONS_EMULATOR) {
  //   pool = mysql.createPool(config);
  // } else {
  //   pool = promiseMysql.createPool(config);
  // }

  let pool = mysql.createPool(config);

  // let pool = await promiseMysql.createPool(config)

  // console.log("Pool created by configuration.");

  // Creiamo la versione asincrona di pool.getConnection
  let getConnection = () => {
    return new Promise((resolve, reject) => {
      pool.getConnection(function (err, connection) {
        if (err) {
          return reject(err);
        }
        resolve(connection);
      });
    });
  };

  // otteniamo la connessione che useremo
  // nelle versioni asincrone dei metodi
  // del nostro middleware
  const connection = await getConnection();
  //console.log("Connection with DBMS established. ");
  //console.log(connection);

  return {
    query(sql, args) {
      return util.promisify(connection.query).call(connection, sql, args);
    },
    connRelease() {
      return util.promisify(connection.release).call(connection);
    },
    beginTransaction() {
      return util.promisify(connection.beginTransaction).call(connection);
    },
    commit() {
      return util.promisify(connection.commit).call(connection);
    },
    rollback() {
      return util.promisify(connection.rollback).call(connection);
    },
    end() {
      return pool.end.call(pool);
    },
  };
};

// Funzione asincrona di gestione di una transazione generica
// callback conterrà le effettive operazioni CRUD da eseguire
export const withTransaction = async function (db, callback) {
  try {
    await db.beginTransaction();
    await callback();
    await db.commit();
  } catch (err) {
    await db.rollback();
    throw err;
  } finally {
    db.end();
  }
};
