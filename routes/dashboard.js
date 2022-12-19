const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const repFuncs = require('../controllers/reportingFunctions');

const reporting_router = require('./reportingPage');
const settings_router = require('./settings');


router
  .get('/', async (req, res, next) => {
    try {
      let employeeEmail = req.session.employeeEmail;
      let selectedDate = new Date(req.session.selectedDate);
      let passedVariable = req.query.valid; //passed from /addWorkingHourRow
      let errors = [];
      if (passedVariable) {
        if (passedVariable == 'failure_with_accrued') {
          errors.push({ msg: "Failure to insert record: your accrued hours must be between -2 and 8" });
        } else if (passedVariable == 'failure_with_date') {
          errors.push({ msg: "Failure to insert record: the selected date cannot be in the future or more than 50 days in the past" });
        }
      }

      let employeeRow = await controller.getEmployee(employeeEmail);
      let accruedHoursOut = await controller.accruedHours(employeeRow.EMPLOYEEID);
      let accruedHours = (accruedHoursOut.ACCRUED != null) ? accruedHoursOut.ACCRUED : 0;
      let hoursThisMonth = await controller.hoursWorkedThatMonth(employeeEmail, selectedDate); //outputs hoursThisMonth, datesThisMonthConverted, commentsArray
      let monthYearSelected = repFuncs.parseDateToYYYYMM(selectedDate);

      res.render("loginPage", {
        accruedHours: accruedHours,
        hoursThisMonth: hoursThisMonth.hoursThisMonth,
        datesThisMonth: hoursThisMonth.datesThisMonthConverted,
        isManager: req.session.isManager,
        commentsArray: hoursThisMonth.commentsArray,
        month: monthYearSelected,
        errors: errors
      });
    } catch (err) {
      console.log('problem during /dashboard. Error message: ' + err);
      res.redirect('/');
    }
  })

router
  .post("/addWorkedHourRecord", async (req, res, next) => {
  try {
    let validateDate = await controller.validateDate(req.body.date);
    if (!validateDate) {
      var string = encodeURIComponent('failure_with_date');
      res.redirect('/dashboard?valid=' + string);
    };
    let actualHoursOnDay = await controller.calculateActualHoursOnDay(req.body.date, req.session.contractedHours, req.body.change);

    let records = [
      req.session.employeeId,
      `"${req.body.date}"`,
      req.body.change,
      `"${req.body.comments}"`,
      actualHoursOnDay
    ];

    let whrRecord = await controller.checkIfRecordExists(records[0], records[1]); //input employeeID and the selected date

    let validateRunningTotal = await controller.validateRunningTotal(records[0], whrRecord, records[2]); //input employeedID, the whr SQL result and the selected change
    if (!validateRunningTotal) {
      var string = encodeURIComponent('failure_with_accrued');
      res.redirect('/dashboard?valid=' + string);
    };

    if (validateRunningTotal && validateDate) {
      if (!whrRecord) {

        let formattedDate = repFuncs.parseDateToYYYYMMDD(new Date());
        let auditRecords = [
          req.session.employeeId,
          `"${formattedDate}"`,
          `"WHR record inserted"`
        ];
        await controller.insertAuditRow(auditRecords);

        await controller.insertRowInWHR(records);
      } else {

        let formattedDate = repFuncs.parseDateToYYYYMMDD(new Date());
        let auditRecords = [
          req.session.employeeId,
          `"${formattedDate}"`,
          `"WHR record updated"`
        ];
        await controller.insertAuditRow(auditRecords);

        await controller.updateRowInWHR(records, whrRecord.WHRID);
      };
      res.redirect('/dashboard');
    }
  } catch (err) {
    console.log('problem during /addWorkedHourRecord. Error message: ' + err);
    res.redirect('/');
  }
  })

router
  .post("/changeRecordMonth", async (req, res, next) => {
    try {
      selectedDate = new Date(req.body.month);
      req.session.selectedDate = selectedDate;
      res.redirect('/dashboard');
    } catch (err) {
      console.log('problem during /changeRecordMonth. Error message: ' + err);
      res.redirect('/');
    }
  })

router
  .use('/settings', settings_router);

router
  .use('/reportingPage', reporting_router);

module.exports = router;