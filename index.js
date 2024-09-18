const express = require("express");
const { Pool } = require("pg");
const app = express();
const port = 8080;

const pool = new Pool({
  user: "postgres",
  host: "192.168.12.70",
  database: "metrics",
  password: "nimda",
  port: 5432,
});

app.use(express.json());

async function createMetricsTable() {
  try {
    const query = `
        CREATE TABLE IF NOT EXISTS testmethod (
          id SERIAL PRIMARY KEY,
          appname VARCHAR(255) NOT NULL,
          suitename VARCHAR(255) NOT NULL,
          testclass VARCHAR(255) NOT NULL,
          testname VARCHAR(255) NOT NULL,
          description VARCHAR(255),
          testresult VARCHAR(255) NOT NULL,
          duration NUMERIC(50)
        );
        CREATE TABLE IF NOT EXISTS testrun (
          id SERIAL PRIMARY KEY,
          run_id VARCHAR(255) NOT NULL,
          app_name VARCHAR(255) NOT NULL,
          suite_name VARCHAR(255) NOT NULL,
          total_tests NUMERIC(50),
          total_pass NUMERIC(50),
          total_fail NUMERIC(50),
          total_skips NUMERIC(50)
        );
        CREATE TABLE IF NOT EXISTS testcoverage (
          id SERIAL PRIMARY KEY,
          app_name VARCHAR(255) NOT NULL,
          testmo_tc_id VARCHAR(255) NOT NULL,
          req_id VARCHAR(255),
          test_name VARCHAR(255) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS defects (
          id SERIAL PRIMARY KEY,
          defect_id VARCHAR(255) NOT NULL,
          defect_description VARCHAR(255),
          app_name VARCHAR(255),
          defect_status VARCHAR(255),
          defect_open_date DATE NOT NULL DEFAULT CURRENT_DATE,
          defect_close_date DATE NOT NULL DEFAULT CURRENT_DATE,
          identified_stage VARCHAR(255)
        );
      `;

    await pool.query(query);
    console.log("tables created");
  } catch (err) {
    console.error(err);
    console.error("testmethod table creation failed");
  }
}

createMetricsTable();

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get("/", (req, res) => {
  res.send("Welcome to CNX Quality Metrics Solution!");
});

// testmethod table operations

app.post("/testmethod", async (req, res) => {
  // Validate the incoming JSON data
  const {
    appname,
    suitename,
    testclass,
    testname,
    description,
    testresult,
    duration,
  } = req.body;
  console.log(req.body);
  if (!appname || !suitename || !testclass || !testname || !testresult) {
    return res
      .status(400)
      .send(
        "One of the appname, suitename, or testclass, or result is missing in the data"
      );
  }

  try {
    // try to send data to the database
    const query = `
          INSERT INTO testmethod (appname,suitename, testclass, testname, description, testresult, duration)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id;
        `;
    const values = [
      appname,
      suitename,
      testclass,
      testname,
      description,
      testresult,
      duration,
    ];

    const result = await pool.query(query, values);
    res
      .status(201)
      .send({ message: "New record created", rowId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).send("some error has occured");
  }
});

app.get("/testmethod", async (req, res) => {
  try {
    const query = "SELECT * FROM testmethod;";
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("failed");
  }
});

app.delete("/testmethod/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = "DELETE FROM testmethod WHERE id = $1 RETURNING *;";
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).send("we have not found the test");
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("some error has occured");
  }
});

/* run table operations

   insert operation*/

app.post("/testrun", async (req, res) => {
  // Validate the incoming JSON data
  const {
    run_id,
    app_name,
    suite_name,
    total_tests,
    total_pass,
    total_fail,
    total_skips,
  } = req.body;
  console.log(req.body);
  if (!run_id || !app_name || !suite_name) {
    return res
      .status(400)
      .send(
        "One of the run id, app name, or suite name is missing in the data"
      );
  }

  try {
    // try to send data to the database
    const query = `
        INSERT INTO testrun (run_id,app_name, suite_name, total_tests, total_pass, total_fail, total_skips)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `;
    const values = [
      run_id,
      app_name,
      suite_name,
      total_tests,
      total_pass,
      total_fail,
      total_skips,
    ];

    const result = await pool.query(query, values);
    res
      .status(201)
      .send({ message: "New record created", rowId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).send("some error has occured");
  }
});

/* get operation */
app.get("/testrun", async (req, res) => {
  try {
    const query = "SELECT * FROM testrun;";
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("failed");
  }
});

/* Delete operation */

app.delete("/testrun/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = "DELETE FROM testrun WHERE id = $1 RETURNING *;";
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).send("we have not found the test");
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("some error has occured");
  }
});

/* Test coverage data*/
app.post("/testcoverage", async (req, res) => {
  // Validate the incoming JSON data
  const {
    app_name, 
    testmo_tc_id,
    req_id,
    test_name,
  } = req.body;
  console.log(req.body);
  if (!app_name || !testmo_tc_id || !req_id || !test_name) {
    return res
      .status(400)
      .send(
        "One of the appname, TC ID, or requirement id, or test name is missing in the data"
      );
  }

  try {
    // try to send data to the database
    const query = `
      INSERT INTO testcoverage (app_name,testmo_tc_id, req_id, test_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const values = [
      app_name,
      testmo_tc_id,
      req_id,
      test_name,
    ];

    const result = await pool.query(query, values);
    res
      .status(201)
      .send({ message: "New record created", rowId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).send("some error has occured");
  }
});

app.get("/testcoverage", async (req, res) => {
  try {
    const query = "SELECT * FROM testcoverage;";
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("failed");
  }
});

app.delete("/testcoverage/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = "DELETE FROM testcoverage WHERE id = $1 RETURNING *;";
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).send("we have not found the test");
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("some error has occured");
  }
});

/* Jira Defects operation */

app.post("/defects", async (req, res) => {
  // Validate the incoming JSON data
  const {
    defect_id,
    defect_description,
    app_name,
    defect_status,
    defect_open_date,
    defect_close_date,
    identified_stage,
  } = req.body;
  console.log(req.body);
  if (!defect_id) {
    return res.status(400).send("Defect id is missing in the data");
  }

  try {
    // try to send data to the database
    const query = `
      INSERT INTO defects (defect_id,defect_description, app_name, defect_status, defect_open_date, defect_close_date, identified_stage)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;
    const values = [
      defect_id,
      defect_description,
      app_name,
      defect_status,
      defect_open_date,
      defect_close_date,
      identified_stage,
    ];

    const result = await pool.query(query, values);
    res
      .status(201)
      .send({ message: "New record created", rowId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).send("some error has occured");
  }
});

app.get("/defects", async (req, res) => {
  try {
    const query = "SELECT * FROM defects;";
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("failed");
  }
});

app.delete("/defects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = "DELETE FROM defects WHERE id = $1 RETURNING *;";
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).send("we have not found the test");
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("some error has occured");
  }
});
