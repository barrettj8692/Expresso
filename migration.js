const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

db.serialize( () => {
  // Drop and Create Employee Table
  db.run(`DROP TABLE IF EXISTS Employee`);
  db.run(`CREATE TABLE Employee (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    wage INTEGER NOT NULL,
    is_current_employee INTEGER NOT NULL DEFAULT 1
  )`);

  // Drop and Create Timesheet Table
  db.run(`DROP TABLE IF EXISTS Timesheet`);
  db.run(`CREATE TABLE Timesheet (
    id INTEGER PRIMARY KEY,
    hours INTEGER NOT NULL,
    rate INTEGER NOT NULL,
    date INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    FOREIGN KEY(employee_id) REFERENCES Employee(id)
  )`);

  //Drop and Create Menu Table
  db.run(`DROP TABLE IF EXISTS Menu`);
  db.run(`CREATE TABLE Menu (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL
  )`);

  //Drop and Create MenuItem Table
  db.run(`DROP TABLE IF EXISTS MenuItem`);
  db.run(`CREATE TABLE MenuItem (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    inventory INTEGER NOT NULL,
    price INTEGER NOT NULL,
    menu_id INTEGER NOT NULL,
    FOREIGN KEY(menu_id) REFERENCES Menu(id)
  )`);
});
