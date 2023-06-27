export default {
  connectionLimit: 75,
  host: process.env.RDS_HOSTNAME || "localhost",
  user: process.env.RDS_USERNAME || "root",
  password: process.env.RDS_PASSWORD || "root",
  // port: process.env.RDS_PORT,
  database: process.env.RDS_DB_NAME || "s3_db",
  multipleStatements: true,
};
