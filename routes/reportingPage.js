const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const repFuncs = require('../controllers/reportingFunctions');

router
    .route("/")
    .get(async (req, res, next) => {
    try {
        let allEmployees = await controller.getAllEmployees();
        let employeeInfo = [];
        let errors = [];
        let passedVariable = req.query.valid; //passed from /selectReportingPersonAndMonth
        let emailMonth = passedVariable.split(';');
        let employeeEmail = emailMonth[0];
        let selectedDate = new Date(emailMonth[1]);

        for (const row of allEmployees) {
        let accruedHoursOut = await controller.accruedHours(row.EMPLOYEEID);
        let hourChangePositiveOut = await controller.hourChangePositive(row.EMPLOYEEID, selectedDate);
        let hourChangeNegativeOut = await controller.hourChangeNegative(row.EMPLOYEEID, selectedDate);

        let accruedHours = (accruedHoursOut.ACCRUED != null) ? accruedHoursOut.ACCRUED : 0;
        let hourChangePositive = (hourChangePositiveOut.POSITIVECHANGE != null) ? hourChangePositiveOut.POSITIVECHANGE : 0;
        let hourChangeNegative = (hourChangeNegativeOut.NEGATIVECHANGE != null) ? hourChangeNegativeOut.NEGATIVECHANGE : 0;

        employeeInfo.push({
            name: row.FIRSTNAME + ' ' + row.LASTNAME,
            email: row.EMAIL,
            accrued: accruedHours,
            positiveChange: hourChangePositive,
            negativeChange: hourChangeNegative
        });
        };

        let validatePersonExists = await controller.getEmployee(employeeEmail);
        if (!validatePersonExists) {
        errors.push({ msg: "User not found" });
        res.render("managerReporting", {
            employeeInfo: employeeInfo,
            hoursThisMonth: null,
            datesThisMonth: null,
            commentsArray: null,
            email: emailMonth[0],
            month: emailMonth[1],
            errors: errors
        });
        } else {
        let hoursThisMonth = await controller.hoursWorkedThatMonth(employeeEmail, selectedDate); //outputs hoursThisMonth, datesThisMonthConverted, commentsArray
        res.render("managerReporting", {
            employeeInfo: employeeInfo,
            hoursThisMonth: hoursThisMonth.hoursThisMonth,
            datesThisMonth: hoursThisMonth.datesThisMonthConverted,
            commentsArray: hoursThisMonth.commentsArray,
            email: emailMonth[0],
            month: emailMonth[1],
            errors: errors
        });
        }
    } catch (err) {
        console.log('problem during /go to reporting. Error message: ' + err);
        res.redirect('/');
    }
    })
    .post(async (req, res, next) => {
    try{
    let month;
    let employee;
    if (req.body.employee != null) {
        month = req.body.month;
        employee = req.body.employee;
    } else {
        selectedDate = new Date();
        month = repFuncs.parseDateToYYYYMM(selectedDate);;
        employee = req.session.employeeEmail;
    }
    var string = encodeURIComponent(employee + ';' + month);
    res.redirect('/dashboard/reportingPage?valid=' + string);
    } catch (err) {
    console.log('problem during /dashboard/reportingPage. Error message: ' + err);
    res.redirect('/');
    }
    })

module.exports = router;