const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running..!");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
  }
};

initializeDBAndServer();

//API-1 User creation
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const dbSelectQuery = `select * from user where username = '${username}';`;
  const dbUser = await db.get(dbSelectQuery);

  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPass = await bcrypt.hash(password, 10);
      const userCreateQuery = `insert into user (username,name, password, gender, location)
            values('${username}','${name}', '${hashedPass}','${gender}', '${location}');`;
      await db.run(userCreateQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API-2 login User
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectQuery = `select * from user where username = '${username}';`;
  const dbUser = await db.get(selectQuery);
  if (dbUser !== undefined) {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//API -3 Change Password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userDBQuery = `select * from user where username = '${username}';`;
  const dbUser = await db.get(userDBQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isMatch = await bcrypt.compare(oldPassword, dbUser.password);

    if (isMatch) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPass = await bcrypt.hash(newPassword, 10);
        const updateQuery = `update user set password = '${hashedPass}'
            where username = '${username}';`;
        await db.run(updateQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
