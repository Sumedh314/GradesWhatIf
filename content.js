const finalGradesByClass = {};
const categoryWeightsByClass = {};
const realGradesByClass = {};
let newGradesByClass = {};

const iframe = document.getElementById('sg-legacy-iframe');
/** @type {HTMLElement} */ let content = null;
/** @type {HTMLElement} */ let allGradeTables = null;

function getData() {
    for (const userClassElement of allGradeTables.querySelectorAll('.AssignmentClass')) {
        const gradeHeader = userClassElement.querySelector('.sg-header.sg-header-square');
        const className = gradeHeader.querySelector('.sg-header-heading').textContent.trim();
        const classGrade = gradeHeader.querySelector('.sg-header-heading.sg-right').textContent.trim();

        finalGradesByClass[className] = classGrade;

        const categoriesTable = userClassElement.querySelector('.sg-content-grid').querySelector('.sg-asp-table-group').querySelector('table');
        const categoryRows = categoriesTable.querySelectorAll('.sg-asp-table-data-row');

        const weightsByCategory = {};
        categoryRows.forEach(row => {
            const rowElements = row.getElementsByTagName('td');
            const categoryName = rowElements[0].textContent.trim();
            
            const originalWeightValue = Number(rowElements[4]?.textContent.trim());
            let categoryWeight = '';
            if (rowElements.length > 4) {
                categoryWeight = originalWeightValue > 1 ? originalWeightValue / 100 : originalWeightValue;
            }
            else {
                categoryWeight = 1;
            }
            
            weightsByCategory[categoryName] = categoryWeight;

            categoryWeightsByClass[className] = weightsByCategory;
        });
        
        const assignmentRows = userClassElement.querySelector('.sg-asp-table').querySelectorAll('.sg-asp-table-data-row');
        
        const gradeDataByAssignment = {};
        assignmentRows.forEach(row => {
            const rowElements = row.getElementsByTagName('td');

            const assignmentName = rowElements[2].querySelector('a').textContent.trim();

            const gradeData = {
                category: '',
                score: '',
                maxScore: '',
                weight: '',
                scoreElement: null
            };
            const assignmentCategory = rowElements[3].textContent.trim();
            const assignmentScore = rowElements[4].textContent.trim();
            const maximumScore = rowElements[5].textContent.trim();
            const assignmentWeight = rowElements[6].textContent.trim();
            const assignmentScoreElement = rowElements[4];

            gradeData.category = assignmentCategory;
            gradeData.score = assignmentScore;
            gradeData.maxScore = maximumScore;
            gradeData.scoreElement = assignmentScoreElement;
            gradeData.weight = assignmentWeight;

            gradeDataByAssignment[assignmentName] = gradeData;

            realGradesByClass[className] = gradeDataByAssignment;

        });
    }

    // chrome.storage.local.get(['newGradesByClass']).then(result => newGradesByClass = result.newGradesByClass);
    // console.log(newGradesByClass);
    // if (newGradesByClass == {}) {
    newGradesByClass = realGradesByClass;
    //     chrome.storage.local.set({'newGradesByClass': newGradesByClass});
    // }
    // else {
    //     console.log(newGradesByClass);
    // }
}

function updateClassGrade(event) {
    const gradeElement = event.target.parentNode;

    const assignmentRowElement = gradeElement.parentNode.getElementsByTagName('td')[2];
    const assignmentName = assignmentRowElement.querySelector('a').textContent.trim();

    const classHeader = assignmentRowElement.closest('.AssignmentClass');
    const className = classHeader.querySelector('.sg-header-heading').textContent.trim();

    newGradesByClass[className][assignmentName].score = event.target.value;
    chrome.storage.local.set({['newGradesByClass']: newGradesByClass});

    const totalUserPointsByCategory = {};
    const totalMaxPointsByCategory = {};
    const weightedScoresByCategory = {};
    let finalGrade = 0;

    Object.values(newGradesByClass[className]).forEach(assignment => {
        const category = assignment.category;
        let score = assignment.score;
        let maxScore = Number(assignment.maxScore);
        if (score == '' || score[0].toUpperCase() == 'X') {
            score = 0;
            maxScore = 0;
        }
        else if (score[0].toUpperCase() == 'Z') {
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

function addTextFields() {
    const userClassElements = allGradeTables.querySelectorAll('.AssignmentClass');

    userClassElements.forEach(userClass => {
        const newGradeArea = document.createElement('input');
        newGradeArea.classList.add('extension', 'grade-field');
        newGradeArea.style.width = '110px';
        newGradeArea.style.height = '20px';
        newGradeArea.style.fontSize = '18px';
        newGradeArea.style.textDecoration = 'bold';
        newGradeArea.readOnly = true;
        
        const gradeHeader = userClass.querySelector('.sg-header.sg-header-square');
        const gradeElement = gradeHeader.querySelector('.sg-header-heading.sg-right');

        newGradeArea.defaultValue = gradeElement.textContent.trim();
        gradeElement.appendChild(newGradeArea);

        const newAssignmentButtonRow = document.createElement('tr');
        newAssignmentButtonRow.classList.add('extension', 'assignment-row');

        const newAssignmentButtonCell = document.createElement('td');
        newAssignmentButtonCell.colSpan = 6;

        const newAssignmentButton = document.createElement('button');
        newAssignmentButton.textContent = 'Add assignment';
        newAssignmentButton.type = 'button';
        newAssignmentButton.style.display = 'block';
        newAssignmentButton.style.width = '100%';
        newAssignmentButton.style.height = '12px';
        newAssignmentButton.style.backgroundColor = 'white';
        newAssignmentButton.style.borderWidth = '1px';
        newAssignmentButton.style.borderRadius = '999px';
        newAssignmentButton.classList.add('extention', 'assignment-button')
        
        const gradeTableHeader = userClass.querySelector('.sg-asp-table-header-row');
        newAssignmentButtonCell.appendChild(newAssignmentButton);
        newAssignmentButtonRow.appendChild(newAssignmentButtonCell);
        gradeTableHeader.insertAdjacentElement('afterend', newAssignmentButtonRow);
    });

    Object.values(realGradesByClass).forEach(assignmentsByClass => {
        Object.values(assignmentsByClass).forEach(assignment => {
            const inputArea = document.createElement('input');
            inputArea.classList.add('extension', 'text-field');
            inputArea.style.width = '40px';
            inputArea.style.height = '12px';

            if (assignment.score == '') {
                inputArea.defaultValue = '';
            }
            else if (assignment.score[0] == 'X' || assignment.score[0] == 'x') {
                inputArea.defaultValue = 'X';
            }
            else if (assignment.score[0] == 'Z' || assignment.score[0] == 'z') {
                inputArea.defaultValue = 'Z';
            }
            else if (Math.round(assignment.score) == assignment.score) {
                inputArea.defaultValue = Number(assignment.score).toFixed(0);
            }
            else {
                inputArea.defaultValue = assignment.score;
            }

            assignment.scoreElement.insertAdjacentElement('beforeend', inputArea);
        });
    });

    content.addEventListener('click', detectAssignmentButtonClick);
}

function addAssignment(event) {
    event.target.closest('table').style.tableLayout = 'fixed';
    const newAssignmentRow = document.createElement('tr');
    newAssignmentRow.classList.add('extension', 'assignment-row');
    for (let i = 0; i < 6; i++) {
        const cell = document.createElement('td');
        // cell.style.width = 'auto';
        cell.insertAdjacentElement('beforeend', document.createElement('input'));
        newAssignmentRow.insertAdjacentElement('beforeend', cell);
    }
    event.target.parentNode.parentNode.insertAdjacentElement('afterend', newAssignmentRow);
}

function removeTextFields() {
    const textFields = content.querySelectorAll('.extension');
    textFields.forEach(field => {
        field.parentElement.style.removeProperty('display');
        field.remove();
    });
}

function detectAssignmentButtonClick(event) {
    if (event.target.classList.contains('assignment-button')) {
        addAssignment(event);
    }
}

iframe.addEventListener('load', () => {
    content = iframe.contentDocument || iframe.contentWindow.document;
    allGradeTables = content.getElementById('plnMain_pnlFullPage');

    content.addEventListener('focusout', (event) => {
        if (event.target.classList.contains('text-field')) {
            updateClassGrade(event);
        }
    });
    content.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && content.activeElement.classList.contains('text-field')) {
            event.preventDefault();
            updateClassGrade(event);
        }
    })
});

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === 'toggle') {
        console.log('message');
        const extentionElements = content.querySelectorAll('.extension');
        if (extentionElements.length > 0) {
            removeTextFields();
            content.removeEventListener('click', detectAssignmentButtonClick);
        }
        else {
            getData();
            addTextFields();
        }
    }

    sendResponse();

    return true;
});

// const observer = new MutationObserver(getData);
// observer.observe(document.body, {attributes: true, childList: true, subtree: true});