function datesInAMonth(inputMonthDate) {
    var mm = String(inputMonthDate.getMonth() + 1).padStart(2, '0');
    var yyyy = String(inputMonthDate.getFullYear());
    var dateArray = [];
    
    switch(mm){
        case '01':
        case '03':
        case '05':
        case '07':
        case '08':
        case '10':
        case '12':
            for (let i = 1; i <= 31; i++) {
                iString = i.toString();
                if (iString.length < 2) 
                    iString = '0' + iString;
                var dateString = yyyy + '-' + mm + '-' + iString;
                dateArray.push(dateString);
            }
            break
        case '02':
            for (let i = 1; i <= 28; i++) {
                iString = i.toString();
                if (iString.length < 2) 
                    iString = '0' + iString;
                var dateString = yyyy + '-' + mm + '-' + iString;
                dateArray.push(dateString);
            }
            break
        case '04':
        case '06':
        case '09':
        case '11':
            for (let i = 1; i <= 30; i++) {
                iString = i.toString();
                if (iString.length < 2) 
                    iString = '0' + iString;
                var dateString = yyyy + '-' + mm + '-' + iString;
                dateArray.push(dateString);
            }
            break
    }
    if (parseInt(yyyy)%4===0 && mm == '02'){
        //console.log('leap year & feb')
        dateArray.push(yyyy+'-02-29');
    } else {
        //console.log('not a leap year')
    }
    return dateArray;
}

function parseDateToDDMMYYYY(inputDate) {
    var month = '' + (inputDate.getMonth() + 1);
    var day = '' + inputDate.getDate();
    var year = inputDate.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;                                
    var recordDate = [day, month, year].join('-');
    //console.log('parseDateToDDMMYYYY completed')
    return recordDate;   
}

function parseDateToYYYYMMDD(inputDate) {
    var month = '' + (inputDate.getMonth() + 1);
    var day = '' + inputDate.getDate();
    var year = inputDate.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;                                
    var recordDate = [year, month, day].join('-');
    //console.log(recordDate)
    return recordDate;   
}

function parseDateToYYYYMM(inputDate) {
    var month = '' + (inputDate.getMonth() + 1);
    var year = inputDate.getFullYear();

    if (month.length < 2) 
        month = '0' + month;                              
    var recordDate = [year, month].join('-');
    //console.log(recordDate)
    return recordDate;   
}

function usualHoursInAMonth(inputDatesInAMonth,inputUsualHoursInAWeek) {
    var hoursInMonth = [];
    inputDatesInAMonth.forEach(function(dateString){
        const d = new Date(dateString);
        var dayNum = d.getDay(); //0 is sunday
        dayNum = dayNum - 1; //make 0 monday
        if (dayNum == -1)
            dayNum = 6; //make sunday 6
        hoursInMonth.push(parseFloat(inputUsualHoursInAWeek[dayNum]));
    })
    return hoursInMonth;
}

function addMonths(date, months) {
    var d = date.getDate();
    date.setMonth(date.getMonth() + +months);
    if (date.getDate() != d) {
        date.setDate(0);
    }
    return date;
}

module.exports = {
    datesInAMonth: datesInAMonth,
    parseDateToDDMMYYYY: parseDateToDDMMYYYY,
    parseDateToYYYYMMDD: parseDateToYYYYMMDD,
    usualHoursInAMonth: usualHoursInAMonth,
    addMonths: addMonths,
    parseDateToYYYYMM, parseDateToYYYYMM
};