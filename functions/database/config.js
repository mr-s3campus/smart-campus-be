const DEV_CONFIG = {
  connectionLimit: 75,
  host: "localhost",
  user: "root",
  password: "rootroot",
  port: "3306",
  database: "s3_db",
  multipleStatements: true,
};

const TEST_CONFIG = {
  connectionLimit: 75,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: "3306",
  database: "s3_db",
  multipleStatements: true,
  // socketPath: process.env.DB_SOCKETPATH, // e.g. '/cloudsql/project:region:instance'. When used, host and port are ignored
};

export default process.env.FUNCTIONS_EMULATOR ? DEV_CONFIG : TEST_CONFIG;
