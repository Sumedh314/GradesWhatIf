const finalGradesByClass = {};
const categoryWeightsByClass = {};
const realGradesByClass = {};
let newGradesByClass = {};

const iframe = document.getElementById('sg-legacy-iframe');
/** @type {HTMLElement} */ let content = null;
/** @type {HTMLElement} */ let allGradeTables = null;

function getData() {
    for (const userClass of allGradeTables.querySelectorAll('.AssignmentClass')) {
        const gradeHeader = userClass.querySelector('.sg-header.sg-header-square');
        const className = gradeHeader.querySelector('.sg-header-heading').textContent.trim();
        const classGrade = gradeHeader.querySelector('.sg-header-heading.sg-right').textContent.trim();

        finalGradesByClass[className] = classGrade;

        const categoriesTable = userClass.querySelector('.sg-content-grid').querySelector('.sg-asp-table-group').querySelector('table');
        const categoryRows = categoriesTable.querySelectorAll('.sg-asp-table-data-row');

        const weightsByCategory = {};
        categoryRows.forEach(row => {
            const rowElements = row.getElementsByTagName('td');
            const categoryName = rowElements[0].textContent.trim();
            
            const originalWeightValue = Number(rowElements[4]?.textContent.trim());
            const categoryWeight = rowElements.length > 4 ? originalWeightValue > 1 ? originalWeightValue / 100 : originalWeightValue : 1;
            
            weightsByCategory[categoryName] = categoryWeight;

            categoryWeightsByClass[className] = weightsByCategory;
        });
        
        const assignmentRows = userClass.querySelector('.sg-asp-table').querySelectorAll('.sg-asp-table-data-row');
        
        const gradeDataByAssignment = {};
        assignmentRows.forEach(row => {
            const rowElements = row.getElementsByTagName('td');

            const assignmentName = rowElements[2].querySelector('a').textContent.trim();

            const gradeData = {
                category: '',
                score: '',
                maxScore: '',
                scoreElement: null
            };
            const assignmentCategory = rowElements[3].textContent.trim();
            const assignmentScore = rowElements[4].textContent.trim();
            const maximumScore = rowElements[5].textContent.trim();
            const assignmentScoreElement = rowElements[4];

            gradeData.category = assignmentCategory;
            gradeData.score = assignmentScore;
            gradeData.maxScore = maximumScore;
            gradeData.scoreElement = assignmentScoreElement;

            gradeDataByAssignment[assignmentName] = gradeData;

            realGradesByClass[className] = gradeDataByAssignment;
            newGradesByClass = realGradesByClass;
        });
    }
}

function addTextFields() {
    const userClassElements = allGradeTables.querySelectorAll('.AssignmentClass');

    userClassElements.forEach(userClass => {
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

    Object.values(realGradesByClass).forEach(grades => {
        Object.values(grades).forEach(data => {
            const inputArea = document.createElement('input');
            inputArea.style.width = '40px';
            inputArea.defaultValue = data.score;

            data.scoreElement.appendChild(inputArea);
        });
    });
}

function updateClassGrade(event) {
    const gradeElement = event.target.parentNode;

    const assignmentElement = gradeElement.parentNode.getElementsByTagName('td')[2];
    const assignmentName = assignmentElement.querySelector('a').textContent.trim();

    const classHeader = assignmentElement.closest('.AssignmentClass');
    const className = classHeader.querySelector('.sg-header-heading').textContent.trim();

    newGradesByClass[className][assignmentName].score = event.target.value;

    const totalUserPointsByCategory = {};
    const totalMaxPointsByCategory = {};
    const weightedScoresByCategory = {};
    let finalGrade = 0;

    Object.values(newGradesByClass[className]).forEach(assignment => {
        const category = assignment.category;
        let score = assignment.score;
        let maxScore = Number(assignment.maxScore);
        if (score[0] == 'X' || score[0] == 'x' || score == '') {
            score = 0;
            maxScore = 0;
        }
        else if (score[0] == 'Z' || score[0] == 'z') {
            score = 0;
        }
        score = Number(score);

        totalUserPointsByCategory[category] = (totalUserPointsByCategory[category] || 0) + score;
        totalMaxPointsByCategory[category] = (totalMaxPointsByCategory[category] || 0) + maxScore;
    });

    Object.keys(totalUserPointsByCategory).forEach(category => {
        const weight = Number(categoryWeightsByClass[className][category]);
        weightedScoresByCategory[category] = totalUserPointsByCategory[category] / totalMaxPointsByCategory[category] * weight;
    });

    Object.values(weightedScoresByCategory).forEach(score => finalGrade += score);
    
    const newGradeArea = classHeader.querySelector('.sg-header.sg-header-square').querySelector('input');
    newGradeArea.value = (finalGrade * 100).toPrecision(4) + '%';
}

iframe.addEventListener('load', () => {
    content = iframe.contentDocument || iframe.contentWindow.document;
    allGradeTables = content.getElementById('plnMain_pnlFullPage');

    content.addEventListener('input', (event) => updateClassGrade(event));
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