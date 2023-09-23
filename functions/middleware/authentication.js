import { getAuth } from "firebase-admin/auth";

export const verifyToken = async function (req, res, next) {
  try {
    const { authorization } = req.headers;
    if (authorization) {
      const decodedToken = await getAuth().verifyIdToken(authorization);
      const { email, uid } = decodedToken;
      req.decodedUID = uid;
      req.decodedEMAIL = email;
      next();
    } else {
      res.status(401).send("user not authorized");
    }
  } catch (err) {
    if (err?.errorInfo?.code === "auth/argument-error") {
      res.status(401).send("user not authorized");
    } else {
      // console.log(err);
      res.status(500).send("internal error");
    }
  }
};
