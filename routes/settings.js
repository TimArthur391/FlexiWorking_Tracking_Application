const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const repFuncs = require('../controllers/reportingFunctions');

router
    .get('/', async (req, res, next) => {
        let employeeEmail = (req.session.selectedEmployeeEmail) ? req.session.selectedEmployeeEmail : req.session.employeeEmail;
        console.log(employeeEmail);
        let employeeRow = await controller.getEmployee(employeeEmail);
        
        let workingHours = employeeRow.CONTRACTEDHOURS;
        workingHours = workingHours.split(';');

        let allEmployees = await controller.getAllEmployees();
        let employeeInfo = [];
        for (const row of allEmployees) {  
            employeeInfo.push({
                name: row.FIRSTNAME + ' ' + row.LASTNAME,
                email: row.EMAIL,
            });
        };

        res.render('settings', {
            firstname: employeeRow.FIRSTNAME,
            lastname: employeeRow.LASTNAME,
            email: employeeRow.EMAIL,
            monHours: workingHours[0],
            tueHours: workingHours[1],
            wedHours: workingHours[2],
            thuHours: workingHours[3],
            friHours: workingHours[4],
            employeeInfo: employeeInfo,
            isManager: req.session.isManager,
            isSelectedManager: employeeRow.MANAGER
        });
    })

    .post('/saveSettings', async (req, res, next) => {
        try {
            const { firstname, lastname, email, monHours, tueHours, wedHours, thuHours, friHours, isSelectedManager } = req.body;
            let contractedHours = `${monHours};${tueHours};${wedHours};${thuHours};${friHours};0;0`;
            let weeklyHours = parseFloat(monHours) + parseFloat(tueHours) + parseFloat(wedHours) + parseFloat(thuHours) + parseFloat(friHours);
            let isManager = (isSelectedManager) ? 1 : 0; //condition ? exprIfTrue : exprIfFalse
            console.log(isSelectedManager);
            console.log(isManager);
            let records = [
                `"${firstname}"`,
                `"${lastname}"`,
                `"${email}"`,
                `"${contractedHours}"`,
                `"${weeklyHours}"`, //hours worked each week
                `"${isManager}"`
            ];
            let errors = [];
    
            let employeeEmail = (req.session.selectedEmployeeEmail) ? req.session.selectedEmployeeEmail : req.session.employeeEmail;
            let employeeRow = await controller.getEmployee(employeeEmail);
            let employeeId = employeeRow.EMPLOYEEID;

            //check fields are not null
            if (monHours == null || tueHours == null || wedHours == null || thuHours == null || friHours == null || records[0] == null || records[1] == null || records[2] == null) {
                errors.push({ msg: "Please fill in all fields" });
            };
    
            //ensure the hours are above 0 and less than 9
            if (parseFloat(monHours) > 9 || parseFloat(tueHours) > 9 || parseFloat(wedHours) > 9 || parseFloat(thuHours) > 9 || parseFloat(friHours) > 9 || parseFloat(monHours) < 0 || parseFloat(tueHours) < 0 || parseFloat(wedHours) < 0 || parseFloat(thuHours) < 0 || parseFloat(friHours) < 0) {
                errors.push({ msg: "You can only work between 0 and 9 hours" });
            };
    
            let formattedDate = repFuncs.parseDateToYYYYMMDD(new Date());
            let auditRecords = [
                1,
                `"${formattedDate}"`,
                `"User ${email} updated their personal details"`
            ];
            await controller.insertAuditRow(auditRecords);
            await controller.updateRowInEmployees(records, employeeId);
            res.redirect('/dashboard/settings');
        } catch (err) {
            console.log('problem during /saveSettings. Error message: ' + err);
            res.redirect('/');
        }
    })

    .post('/selectUser', async (req, res, next) => {
        try {
            //choose which user to show settings for
            const { employee } = req.body;
            req.session.selectedEmployeeEmail = employee
        
            res.redirect('/dashboard/settings');
        } catch (err) {
            console.log('problem during /selectUser. Error message: ' + err);
            res.redirect('/');
        }
    })
module.exports = router;