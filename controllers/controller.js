const mysql = require('mysql');
const repFuncs = require('./reportingFunctions');
let session = require('express-session');
let MySQLStore = require('express-mysql-session')(session);
//require('dotenv').config()


// Connection Pool
let connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '********',
  database: 'orlau_whr'
});
let sessionStore = new MySQLStore({
  connectionLimit: 10,
  createDatabaseTable: true
}, connection);


async function getEmployee(email) {
  // User the connection
  return new Promise((resolve) => {
    let SQL_query = `select * from employees where email = '${email}'`
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      ////console.log(rows)
      if (!err) {
        let rowOne = rows[0];
        resolve(rowOne);
      } else {
        resolve('ERROR');
      }
    });
  });
};

async function getAllEmployees() {
  return new Promise((resolve) => {
    let SQL_query = `select EMPLOYEEID, FIRSTNAME, LASTNAME, EMAIL from employees`
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      ////console.log(rows)
      if (!err) {
        resolve(rows);
      } else {
        resolve('ERROR');
      }
    });
  });
};

async function accruedHours(uniqueId) {
  return new Promise((resolve) => {
    let SQL_query = `select sum(HOURCHANGE) AS ACCRUED from whr where EMPLOYEEID = ${uniqueId}`
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        let rowOne = rows[0];
        ////console.log(rowOne);
        resolve(rowOne);
      } else {
        resolve('ERROR');
      }
    });
  })
};

async function hourChangePositive(uniqueId, selectedDate) {
  return new Promise((resolve) => {
    let datesThisMonth = repFuncs.datesInAMonth(selectedDate);
    let datesThisMonthString = datesThisMonth.join(`', '`);
    let SQL_query = `select sum(HOURCHANGE) AS POSITIVECHANGE from whr where EMPLOYEEID = ${uniqueId} AND HOURCHANGE > 0 AND RECORDDATE in ('${datesThisMonthString}')`
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        let rowOne = rows[0];
        ////console.log(rowOne);
        resolve(rowOne);
      } else {
        resolve('ERROR');
      }
    });
  })
};

async function hourChangeNegative(uniqueId, selectedDate) {
  return new Promise((resolve) => {
    let datesThisMonth = repFuncs.datesInAMonth(selectedDate);
    let datesThisMonthString = datesThisMonth.join(`', '`);
    let SQL_query = `select sum(HOURCHANGE) AS NEGATIVECHANGE from whr where EMPLOYEEID = ${uniqueId} AND HOURCHANGE < 0 AND RECORDDATE in ('${datesThisMonthString}')`
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        let rowOne = rows[0];
        ////console.log(rowOne);
        resolve(rowOne);
      } else {
        resolve('ERROR');
      }
    });
  })
};

async function hoursWorkedThatMonth(email, selectedDate) {
  let employee = await getEmployee(email);
  return new Promise((resolve) => {

    let uniqueId = employee.EMPLOYEEID;
  
    let contractedHoursString = employee.CONTRACTEDHOURS;
    let contractedHours = contractedHoursString.split(';');
  
    //arrange an array with all the dates for the selected month in the DDMMYYYY format
    let datesThisMonth = repFuncs.datesInAMonth(selectedDate);
    let datesThisMonthString = datesThisMonth.join(`', '`);
    let datesThisMonthConverted = [];
    let commentsArray = [];
    datesThisMonth.forEach(function(d){
      let dformatted = new Date(d);
      datesThisMonthConverted.push(repFuncs.parseDateToDDMMYYYY(dformatted));
      commentsArray.push('No comment');
    })
  
    //this is the normal hours a person would work in this month
    let hoursThisMonth = repFuncs.usualHoursInAMonth(datesThisMonth, contractedHours);
  
    let SQL_query = `select RECORDDATE, HOURSWORKED, COMMENTS from whr where EMPLOYEEID = ${uniqueId} and RECORDDATE in ('${datesThisMonthString}') order by RECORDDATE desc`
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        //if any rows are returned overwrite hoursThisMonth for the relavant date with the new hours
        rows.forEach(function(row){
          let d = row.RECORDDATE;
          let recordDate = repFuncs.parseDateToDDMMYYYY(d);    
  
          let indexValue = recordDate.substring(0, 2);
          indexValue = parseInt(indexValue) - 1;
          hoursThisMonth[indexValue] = row.HOURSWORKED;
          if (row.COMMENTS){
            let comment_Comma = row.COMMENTS;
            let comment_noComma = comment_Comma.replace(',', '%;%')
            commentsArray[indexValue] = comment_noComma;
          }   
        })
        ////console.log(datesThisMonthConverted, hoursThisMonth);
        let output = {
          hoursThisMonth: hoursThisMonth,
          datesThisMonthConverted: datesThisMonthConverted,
          commentsArray: commentsArray
        } ;
        resolve(output); 
      } else {
        resolve('ERROR');
      }
    });
  })
};

async function checkIfRecordExists(uniqueId, recordDate) {
  return new Promise((resolve) => {
    let SQL_query = `select WHRID, HOURCHANGE from whr where EMPLOYEEID = ${uniqueId} and RECORDDATE = ${recordDate}`;
    ////console.log(SQL_query)
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        let rowOne = rows[0];
        ////console.log(rowOne);
        resolve(rowOne);
      } else {
        resolve('ERROR');
      }
    });
  })
};

async function insertRowInWHR(records) {
  return new Promise((resolve) => {
    let SQL_query = `INSERT INTO WHR (EMPLOYEEID,RECORDDATE,HOURCHANGE,COMMENTS,HOURSWORKED) VALUES (${records})`;
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        //console.log(rows);
        //console.log("Number of rows affected : " + rows.affectedRows);
        //console.log("Number of records affected with warning : " + rows.warningCount);
        //console.log("Message from MySQL Server : " + rows.message);
        resolve();
      } else {
        resolve('ERROR');
      }
    });
  })
};

async function updateRowInWHR(records, whrID) {
  return new Promise((resolve) => {
    let SQL_query = `UPDATE whr SET HOURCHANGE = ${records[2]}, COMMENTS = ${records[3]}, HOURSWORKED = ${records[4]} WHERE whrID = ${whrID}`;
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        //console.log(rows);
        //console.log("Number of rows affected : " + rows.affectedRows);
        //console.log("Number of records affected with warning : " + rows.warningCount);
        //console.log("Message from MySQL Server : " + rows.message);
        resolve();
      } else {
        resolve('ERROR');
      }
    });
  })
};

async function insertRowInEmployees(records) {
  return new Promise((resolve) => {
    let SQL_query = `INSERT INTO employees (FIRSTNAME, LASTNAME, EMAIL, CONTRACTEDHOURS, WEEKLYHOURS) VALUES (${records});`;
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        //console.log(rows);
        //console.log("Number of rows affected : " + rows.affectedRows);
        //console.log("Number of records affected with warning : " + rows.warningCount);
        //console.log("Message from MySQL Server : " + rows.message);
        resolve();
      } else {
        resolve('ERROR');
      }
    });
  })
};

async function updateRowInEmployees(records, employeeID) {
  return new Promise((resolve) => {
    let SQL_query = `UPDATE employees SET FIRSTNAME = ${records[0]}, LASTNAME = ${records[1]}, EMAIL = ${records[2]}, CONTRACTEDHOURS = ${records[3]}, WEEKLYHOURS = ${records[4]}, MANAGER = ${records[5]} WHERE EMPLOYEEID = ${employeeID};`;
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        //console.log(rows);
        //console.log("Number of rows affected : " + rows.affectedRows);
        //console.log("Number of records affected with warning : " + rows.warningCount);
        //console.log("Message from MySQL Server : " + rows.message);
        resolve();
      } else {
        resolve('ERROR');
      }
    });
  })
};

async function validateRunningTotal(employeeId, whrRecord, hourChange){
  let accruedHoursOut = await accruedHours(employeeId);
  return new Promise((resolve) => {
    //get current accrued hours
    let accruedHours = (accruedHoursOut.ACCRUED != null ) ? accruedHoursOut.ACCRUED : 0;
    //check if row is going to overwrite another row
    let newRunningTotal;
    if (whrRecord) {
      let oldRecordChange = whrRecord.HOURCHANGE;
      newRunningTotal = parseFloat(accruedHours) - parseFloat(oldRecordChange) + parseFloat(hourChange);
    } else {
      newRunningTotal = parseFloat(accruedHours) + parseFloat(hourChange);
    };
    //validate if new running total is going to be greater than -2 and less than 8
    ////console.log (accruedHours + ' ' + whrRecord.HOURCHANGE + ' ' + newRunningTotal + ' ' + hourChange);
    if (newRunningTotal <= 8 && -2 <= newRunningTotal){
      resolve(true);
    } else {
      resolve(false);
    }
    
  })
};

async function calculateActualHoursOnDay(recordDate, contractedHours, hourChange) {
  return new Promise((resolve) => {
    let d = new Date(recordDate);
    let dayNum = d.getDay(); //0 is sunday
    dayNum = dayNum - 1; //make 0 monday
    if (dayNum == -1) {
      dayNum = 6; //make sunday 6
    };
    contractedHoursArray = contractedHours.split(';');
    let usualHoursOnDay = contractedHoursArray[dayNum];
    let actualHoursOnDay = parseFloat(usualHoursOnDay) + parseFloat(hourChange);
    resolve(actualHoursOnDay)
  })
};

async function validateDate(recordDate) {
  return new Promise((resolve) => {
    let dRecord = new Date(recordDate);
    let dToday = new Date();
    let fiftyOneDaysInMilliSecs = 1000 * 60 * 60 * 24 * 51;

    if (dRecord.getTime() > dToday.getTime()){
      resolve(false);
    } else if (dRecord.getTime() < dToday.getTime() - fiftyOneDaysInMilliSecs) {
      resolve(false);
    } else {
      resolve(true);
    }
  })
};

async function insertAuditRow(records) {
  return new Promise((resolve) => {
    let SQL_query = `INSERT INTO AUDIT (EMPLOYEEID,DATE,OPERATION) VALUES (${records})`;
    connection.query(SQL_query, (err, rows) => {
      // When done with the connection, release it
      if (!err) {
        //console.log(rows);
        //console.log("Number of rows affected : " + rows.affectedRows);
        //console.log("Number of records affected with warning : " + rows.warningCount);
        //console.log("Message from MySQL Server : " + rows.message);
        resolve();
      } else {
        resolve('ERROR');
      }
    });
  })
};

module.exports = {
  getEmployee: getEmployee,
  accruedHours: accruedHours,
  hoursWorkedThatMonth: hoursWorkedThatMonth,
  checkIfRecordExists: checkIfRecordExists,
  insertRowInWHR: insertRowInWHR,
  updateRowInWHR: updateRowInWHR,
  insertRowInEmployees: insertRowInEmployees,
  getAllEmployees: getAllEmployees,
  validateRunningTotal: validateRunningTotal,
  calculateActualHoursOnDay: calculateActualHoursOnDay,
  validateDate: validateDate,
  hourChangePositive: hourChangePositive,
  hourChangeNegative: hourChangeNegative,
  insertAuditRow: insertAuditRow,
  updateRowInEmployees: updateRowInEmployees,
  sessionStore: sessionStore
};
