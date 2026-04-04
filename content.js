const allClassGrades = new Map();
const classCategoryWeights = new Map();
const realClassAssignmentGrades = new Map();
let userClassAssignmentGrades = new Map();

const iframe = document.getElementById('sg-legacy-iframe');
/** @type {HTMLElement} */ let content = null;
/** @type {HTMLElement} */ let allGradeTables = null;

function getData() {
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
}

function addTextFields() {
    realClassAssignmentGrades.forEach((grades, _) => {
        grades.forEach((data, _) => {
            const inputArea = document.createElement('input');
            inputArea.style.width = '40px';
            inputArea.defaultValue = data.get('score').textContent.trim();
            data.get('score').appendChild(inputArea);
        });
    });
}

function updateGrade(event) {
    console.log(event);
}

iframe.addEventListener('load', () => {
    content = iframe.contentDocument || iframe.contentWindow.document;
    allGradeTables = content.getElementById('plnMain_pnlFullPage');

    content.addEventListener('input', (event) => updateGrade(event));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('message');
    if (message.action === 'start') {
        getData();
        addTextFields();
    }

    return true;
});

// const observer = new MutationObserver(getData);
// observer.observe(document.body, {attributes: true, childList: true, subtree: true});