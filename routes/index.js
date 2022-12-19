const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const repFuncs = require('../controllers/reportingFunctions');

var dashboard_router = require('./dashboard');

router
    .get('/', async (req, res, next) => {
    res.render('index');
  })

router
    .route('/addUser')
    .get(async (req, res, next) => {
        res.render('newUser');
    })
    .post(async (req, res, next) => {
        try {
        const { firstname, lastname, email, monHours, tueHours, wedHours, thuHours, friHours } = req.body;
        var contractedHours = `${monHours};${tueHours};${wedHours};${thuHours};${friHours};0;0`;
        var weeklyHours = parseFloat(monHours) + parseFloat(tueHours) + parseFloat(wedHours) + parseFloat(thuHours) + parseFloat(friHours);
        var records = [
            `"${firstname}"`,
            `"${lastname}"`,
            `"${email}"`,
            `"${contractedHours}"`,
            `"${weeklyHours}"` //hours worked each week
        ];
        let errors = [];

        //check fields are not null
        if (monHours == null || tueHours == null || wedHours == null || thuHours == null || friHours == null || records[0] == null || records[1] == null || records[2] == null) {
            errors.push({ msg: "Please fill in all fields" });
        };

        //ensure the hours are above 0 and less than 9
        if (parseFloat(monHours) > 9 || parseFloat(tueHours) > 9 || parseFloat(wedHours) > 9 || parseFloat(thuHours) > 9 || parseFloat(friHours) > 9 || parseFloat(monHours) < 0 || parseFloat(tueHours) < 0 || parseFloat(wedHours) < 0 || parseFloat(thuHours) < 0 || parseFloat(friHours) < 0) {
            errors.push({ msg: "You can only work between 0 and 9 hours" });
        };

        //check if user already exists
        let employeeRow = await controller.getEmployee(email);
        if (employeeRow) {
            errors.push({ msg: "There is already an account for this email address" });
        };

        if (errors.length > 0) {
            res.render('newUser', {
            errors: errors,
            firstname: firstname,
            lastname: lastname,
            email: email,
            monHours: monHours,
            tueHours: tueHours,
            wedHours: wedHours,
            thuHours: thuHours,
            friHours: friHours
            });
        } else {
            let formattedDate = repFuncs.parseDateToYYYYMMDD(new Date());
            let auditRecords = [
            1,
            `"${formattedDate}"`,
            `"New user created for ${email}"`
            ];
            await controller.insertAuditRow(auditRecords);

            await controller.insertRowInEmployees(records);
            res.redirect('/');
        }
        } catch (err) {
        console.log('problem during /addUser. Error message: ' + err);
        res.redirect('/');
        }
    })

router
    .post('/login', async (req, res, next) => {
        let employeeEmail = req.body.empEmail;
        let selectedDate = new Date();
        try {
            let errors = [];
            let employeeRow = await controller.getEmployee(employeeEmail);
            if (employeeRow == null) {
            errors.push({ msg: "User not found" });
            res.render('index', {
                errors: errors,
                email: employeeEmail
            });
            } else {
            req.session.employeeEmail = employeeEmail;
            req.session.selectedDate = selectedDate;
            req.session.selectedReportingDate = selectedDate;
            req.session.contractedHours = employeeRow.CONTRACTEDHOURS;
            req.session.employeeId = employeeRow.EMPLOYEEID;
            req.session.isManager = employeeRow.MANAGER;

            let formattedDate = repFuncs.parseDateToYYYYMMDD(new Date());
            let auditRecords = [
                employeeRow.EMPLOYEEID,
                `"${formattedDate}"`,
                `"Logged in"`
            ];
            await controller.insertAuditRow(auditRecords);

            res.redirect('/dashboard');
            };
        } catch (err) {
            console.log('Problem during /login. ' + err);
            res.redirect('/');
        }
    })

router
    .get('/logout', async (req, res, next) => {
    req.session.destroy();
    controller.sessionStore.close();
    res.clearCookie()
    res.redirect('/');
    })

router
    .use('/dashboard', dashboard_router);

module.exports = router;