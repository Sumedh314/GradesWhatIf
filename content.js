const allClassGrades = {};
const classCategoryWeights = {};
const realClassAssignmentGrades = {};
let userClassAssignmentGrades = {};

const iframe = document.getElementById('sg-legacy-iframe');
/** @type {HTMLElement} */ let content = null;
/** @type {HTMLElement} */ let allGradeTables = null;

function getData() {
    for (const userClass of allGradeTables.querySelectorAll('.AssignmentClass')) {
        const gradeHeader = userClass.querySelector('.sg-header.sg-header-square');
        const className = gradeHeader.querySelector('.sg-header-heading').textContent.trim();
        const classGrade = gradeHeader.querySelector('.sg-header-heading.sg-right').textContent.trim();

        allClassGrades[className] = classGrade;

        const categoriesTable = userClass.querySelector('.sg-content-grid').querySelector('.sg-asp-table-group').querySelector('table');
        const categoryRows = categoriesTable.querySelectorAll('.sg-asp-table-data-row');

        const weights = {};
        categoryRows.forEach(row => {
            const rowElements = row.getElementsByTagName('td');
            const categoryName = rowElements[0].textContent.trim();
            const categoryWeight = rowElements.length > 4 ? rowElements[4].textContent.trim() : '100';
            
            weights[categoryName] = categoryWeight;

            classCategoryWeights[className] = weights;
        });
        
        const assignmentRows = userClass.querySelector('.sg-asp-table').querySelectorAll('.sg-asp-table-data-row');
        
        const grades = {};
        assignmentRows.forEach(row => {
            const rowElements = row.getElementsByTagName('td');

            const assignmentName = rowElements[2].querySelector('a').textContent.trim();

            const gradeData = {
                category: '',
                score: '',
                maxScore: ''
            };
            const assignmentCategory = rowElements[3];
            const assignmentScore = rowElements[4];
            const maximumScore = rowElements[5];

            gradeData.category = assignmentCategory;
            gradeData.score = assignmentScore;
            gradeData.maxScore = maximumScore;

            grades[assignmentName] = gradeData;

            realClassAssignmentGrades[className] = grades;
            userClassAssignmentGrades = realClassAssignmentGrades;
        });
    }
}

function addTextFields() {
    const userClasses = allGradeTables.querySelectorAll('.AssignmentClass');
    userClasses.forEach(userClass => {
        const newGradeArea = document.createElement('input');
        newGradeArea.style.width = '110px';
        newGradeArea.style.height = '25px';
        newGradeArea.style.fontSize = '18px';
        newGradeArea.style.textDecoration = 'bold';
        
        const gradeHeader = userClass.querySelector('.sg-header.sg-header-square');
        const gradeElement = gradeHeader.querySelector('.sg-header-heading.sg-right');

        newGradeArea.defaultValue = gradeElement.textContent.trim();
        gradeElement.appendChild(newGradeArea);
    });

    Object.values(realClassAssignmentGrades).forEach(grades => {
        Object.values(grades).forEach(data => {
            const inputArea = document.createElement('input');
            inputArea.style.width = '40px';
            inputArea.defaultValue = data.score.textContent.trim();

            data.score.appendChild(inputArea);
        });
    });
}

function updateGrade(event) {
    const score = event.target.parentNode;

    const assignmentElement = score.parentNode.getElementsByTagName('td')[2];
    const assignmentName = assignmentElement.querySelector('a').textContent.trim();
    const assignmentWeight = score.parentNode.getElementsByTagName('td')[3].textContent.trim();
    
    const classHeader = assignmentElement.closest('.AssignmentClass');
    const className = classHeader.querySelector('.sg-header-heading').textContent.trim();

    userClassAssignmentGrades[className][assignmentName].score = event.target.value;

    console.log(classCategoryWeights[className][assignmentWeight]);
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