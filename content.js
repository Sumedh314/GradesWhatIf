function printThing() {
    const iframe = document.getElementById('sg-legacy-iframe');
    /** @type {HTMLElement} */ const content = iframe.contentDocument || iframe.contentWindow.document;
    /** @type {HTMLElement} */ const allGradeTables = content.getElementById('plnMain_pnlFullPage');

    const allClassGrades = new Map();
    const classCategoryWeights = new Map();
    const realClassAssignmentGrades = new Map();
    let userClassAssignmentGrades = new Map();
    
    for (const userClass of allGradeTables.querySelectorAll('.AssignmentClass')) {
        const gradeHeader = userClass.querySelector('.sg-header.sg-header-square');
        const className = gradeHeader.querySelector('.sg-header-heading');
        const classGrade = gradeHeader.querySelector('.sg-header-heading.sg-right');

        allClassGrades.set(className, classGrade);

        const categoriesTable = userClass.querySelector('.sg-content-grid').querySelector('.sg-asp-table-group').querySelector('table');
        const categoryRows = categoriesTable.querySelectorAll('.sg-asp-table-data-row');

        const weights = new Map();
        categoryRows.forEach(row => {
            const categoryName = row.getElementsByTagName('td')[0];
            const categoryWeight = row.getElementsByTagName('td').length > 4 ? row.getElementsByTagName('td')[4] : '100';
            
            weights.set(categoryName, categoryWeight);

            classCategoryWeights.set(className, weights);
        });
        
        const assignmentRows = userClass.querySelector('.sg-asp-table').querySelectorAll('.sg-asp-table-data-row');
        
        const grades = new Map();
        assignmentRows.forEach(row => {
            const assignmentName = row.getElementsByTagName('td')[2];

            const gradeData = new Map();
            const assignmentCategory = row.getElementsByTagName('td')[3];
            const assignmentScore = row.getElementsByTagName('td')[4];
            const maximumScore = row.getElementsByTagName('td')[5];

            gradeData.set('category', assignmentCategory);
            gradeData.set('score', assignmentScore);
            gradeData.set('maxScore', maximumScore);

            grades.set(assignmentName, gradeData);

            realClassAssignmentGrades.set(className, grades);
            userClassAssignmentGrades = realClassAssignmentGrades;
        });
        
    }
    console.log(classCategoryWeights);
    console.log(allClassGrades);
    console.log(userClassAssignmentGrades);

    realClassAssignmentGrades.forEach((grades, className) => {
        grades.forEach((data, dataName) => {
            const inputArea = document.createElement('input');
            inputArea.style.width = '40px';
            inputArea.defaultValue = data.get('score').textContent.trim();
            data.get('score').appendChild(inputArea);
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('message');
    if (message.action === 'printThing') {
        printThing();
    }

    return true;
});

// const observer = new MutationObserver(printThing);
// observer.observe(document.body, {attributes: true, childList: true, subtree: true});