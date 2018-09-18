const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM timesheet WHERE Timesheet.id = $timesheetId ';
  const values = { $timesheetId: timesheetId };

  db.get(sql, values, (err, timesheet) => {
    if (err) {
      next(err)
    } else if (timesheet) {
      req.timesheet = timesheet;
      next();
    } else {
      res.sendStatus(404);
    }
  })
})


timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
  const values = {$employeeId: req.params.employeeId}

  db.all( sql, values, (err, timesheets) => {
    if(err) {
      next(err)
    } else {
      res.status(200).json({timesheets: timesheets})
    }
  })
})

timesheetsRouter.post('/', (req, res, next) => {

  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const employeeValues = {$employeeId: req.params.employeeId};
  db.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!req.body.timesheet.hours || !req.body.timesheet.rate || !req.body.timesheet.date) {
        return res.sendStatus(400);
      }

      const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id)' +
          'VALUES ($hours, $rate, $date, $employeeId)';
      const values = {
        $hours: req.body.timesheet.hours,
        $rate: req.body.timesheet.rate,
        $date: req.body.timesheet.date,
        $employeeId: req.params.employeeId};


      db.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
            (error, timesheet) => {
              res.status(201).json({timesheet: timesheet});
            });
        }
      });
    }
  });
});


timesheetsRouter.put('/:timesheetId', (req, res, next) => {

// first check if Employee exists
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const employeeValues = {$employeeId: req.params.employeeId};
  db.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!req.body.timesheet.hours || !req.body.timesheet.rate || !req.body.timesheet.date) {
        return res.sendStatus(400);
      }
     // Employee exists, body-variables are okay so let's move on and update.
      const sql = 'UPDATE Timesheet SET hours=$hours, rate=$rate, date=$date, employee_id=$employeeId WHERE Timesheet.id=$timesheetId';
      const values = {
        $hours: req.body.timesheet.hours,
        $rate: req.body.timesheet.rate,
        $date: req.body.timesheet.date,
        $employeeId: req.params.employeeId,
        $timesheetId: req.params.timesheetId};

      db.run(sql, values, function(error) {
        if (error){
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
            (error, timesheet) => {
              res.status(200).json({timesheet: timesheet});
            });
        }
      });
    }
  });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  // first check if Employee exists
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const employeeValues = {$employeeId: req.params.employeeId};
  db.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      res.sendStatus(404);
      next(error);
    } else {

     //moving on. Employee exists
    const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
    const values = {$timesheetId: req.params.timesheetId};

    db.run(sql, values, (error) => {
      if (error) {
        res.sendStatus(404);
        next(error);
      } else {
        res.sendStatus(204);
      }
    });
    }
  });
});


module.exports = timesheetsRouter;
