const functions = require("firebase-functions");

const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const usersRef = db.collection("portfolio-authenticator-users");

const isValidFields = (fields) => {
  return (
    fields &&
        fields.username &&
        fields.username.trim().length > 0 &&
        fields.password &&
        fields.password.trim().length > 0 &&
        fields.domain &&
        fields.domain.trim().length > 0 &&
        (fields.method === "login" || fields.method === "signup")
  );
};


const auth = functions.https.onRequest(async (req, res) => {
  const {body} = req;

  if (!isValidFields(body)) {
    return res.sendStatus(400);
  }

  const {username, password, domain, method} = body;

  try {
    if (method === "login") {
      const snapshot = await usersRef
          .where("username", "==", username)
          .where("password", "==", password)
          .where("domain", "==", domain)
          .get();

      if (snapshot.empty) {
        return res.sendStatus(404);
      }

      const user = snapshot.docs[0].data();
      return res.status(200).json({username, id: user.id});
    }

    if (method === "signup") {
      const existingUser = await usersRef
          .where("username", "==", username)
          .where("domain", "==", domain)
          .get();

      if (!existingUser.empty) {
        return res.sendStatus(409);
      }

      const newUserRef = await usersRef.add({
        username: username.trim(),
        password: password.trim(),
        domain: domain.trim(),
      });

      const newUserSnapshot = await newUserRef.get();
      const newUser = newUserSnapshot.data();
      return res.status(200).json({username, id: newUser.id});
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


exports.auth = auth;
