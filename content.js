const overallClassGrades = {}; // Overall grades for each class             {className: classOverallGrade}
const classCategoryWeights = {}; // Category weights in each class          {className: {category: weight}}
const allRealGrades = {}; // Grades for each assignment in each class       {className: {assignmentName: {grade data...}}}
let allNewGrades = {}; // Same as allRealGrades, but based on user entries  {className: {assignmentName: {grade data...}}}

// Content inside Iframe
const iframe = document.getElementById('sg-legacy-iframe');
/** @type {HTMLElement} */ let content = null;
/** @type {HTMLElement} */ let allGradeTables = null;

/**
 * Gets the user's grades and assignment weights and stores them in the corresponding objects.
 */
function getData() {

    // Loop through each class to get all the data
    for (const userClassElement of allGradeTables.querySelectorAll('.AssignmentClass')) {

        // Fill object that stores user's overall class grades
        const gradeHeader = userClassElement.querySelector('.sg-header.sg-header-square');
        const className = gradeHeader.querySelector('.sg-header-heading').textContent.trim();
        const classGrade = gradeHeader.querySelector('.sg-header-heading.sg-right').textContent.trim();
        overallClassGrades[className] = classGrade;

        // Get ready to fill object that stores the weights of each category
        const categoryWeights = {}; // Inner object to store category weights for a specific class {category: weigiht}
        const categoriesTable = userClassElement.querySelector('.sg-content-grid').querySelector('.sg-asp-table-group').querySelector('table');
        const categoryRows = categoriesTable.querySelectorAll('.sg-asp-table-data-row');

        // Loop through each row in the table that stores weights for each category
        categoryRows.forEach(row => {

            // Get category names and original weights
            const rowElements = row.getElementsByTagName('td');
            const categoryName = rowElements[0].textContent.trim();
            const originalWeightValue = Number(rowElements[4]?.textContent.trim());
            let categoryWeight = '';

            // Make sure weight is between 0 and 1. If there is only one category, its weight is 1.
            if (rowElements.length > 4) {
                categoryWeight = originalWeightValue > 1 ? originalWeightValue / 100 : originalWeightValue;
            }
            else {
                categoryWeight = 1;
            }
            
            // Add values to objects
            categoryWeights[categoryName] = categoryWeight;
            classCategoryWeights[className] = categoryWeights;
        });
        
        // Get ready to fill object that stores all the user's real grades
        const assignmentData = {}; // Inner object to store grades for each assignment in a specific class {assignment: grade}
        const assignmentRows = userClassElement.querySelector('.sg-asp-table').querySelectorAll('.sg-asp-table-data-row');
        
        // Loop through each row in the table that stores all the user's assignments for a class
        assignmentRows.forEach(row => {

            // Get the name of the assignment in the current row
            const rowElements = row.getElementsByTagName('td');
            const assignmentName = rowElements[2].querySelector('a').textContent.trim();

            // Store all the relevent data for each assignment grade
            const gradeData = {
                category: rowElements[3].textContent.trim(),
                score: rowElements[4].textContent.trim(),
                maxScore: rowElements[5].textContent.trim(),
                weight: rowElements[6].textContent.trim(),
                scoreElement: rowElements[4]
            };

            // Add values to objects
            assignmentData[assignmentName] = gradeData;
            allRealGrades[className] = assignmentData;

        });
    }

    // chrome.storage.local.get(['newGradesByClass']).then(result => newGradesByClass = result.newGradesByClass);
    // console.log(newGradesByClass);
    // if (newGradesByClass == {}) {
    allNewGrades = structuredClone(allRealGrades);
    //     chrome.storage.local.set({'newGradesByClass': newGradesByClass});
    // }
    // else {
    //     console.log(newGradesByClass);
    // }
}

/**
 * Calculates the new grade of a class after the user enters a new hypothetical grade
 * 
 * @param {object} event Place where user entered a new grade
 */
function updateClassGrade(event) {
    
    // Get assignment name based on the row of the text field that was updated
    const assignmentRowElement = event.target.parentNode.parentNode.getElementsByTagName('td')[2];
    const assignmentName = assignmentRowElement.querySelector('a').textContent.trim();

    // Get class name based on the table that the text field selected was inside
    const classHeader = assignmentRowElement.closest('.AssignmentClass');
    const className = classHeader.querySelector('.sg-header-heading').textContent.trim();

    // Update object and local storage to store new value user entered
    allNewGrades[className][assignmentName].score = event.target.value;
    chrome.storage.local.set({['newGradesByClass']: allNewGrades});

    // Objects to store data for each category to help calculate final grade
    const totalCategoryUserPoints = {}; // Total points user has in each category           {category: points}
    const totalCategoryMaxPoints = {};  // Total points possible to score in each category  {category: points}
    const categoryWeightedScores = {};  // Weighted scores user has in each category        {category: score}

    Object.values(allNewGrades[className]).forEach(assignment => {
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

        totalCategoryUserPoints[category] = (totalCategoryUserPoints[category] || 0) + score;
        totalCategoryMaxPoints[category] = (totalCategoryMaxPoints[category] || 0) + maxScore;
    });

    Object.keys(totalCategoryUserPoints).forEach(category => {
        const weight = Number(classCategoryWeights[className][category]);
        categoryWeightedScores[category] = totalCategoryUserPoints[category] / totalCategoryMaxPoints[category] * weight;
    });

    // Calculate final grade by adding weighted scores user has in each category
    let finalGrade = 0;
    Object.values(categoryWeightedScores).forEach(score => finalGrade += score);
    
    // Update final grade shown to user
    const newGradeArea = classHeader.querySelector('.sg-header.sg-header-square').querySelector('input');
    newGradeArea.value = (finalGrade * 100).toPrecision(4) + '%';
}

/**
 * Adds all texts boxes and buttons that make this thing useful.
 */
function addFunctionality() {

    // All the divs that contain class grades
    const userClassElements = allGradeTables.querySelectorAll('.AssignmentClass');

    // Add displays for new hypothetical overall class grades and add "Add assignment" buttons at the top of each class's grade table
    userClassElements.forEach(userClass => {

        // Create element to display new grade
        const newGradeArea = document.createElement('input');
        newGradeArea.classList.add('extension', 'grade-field');
        newGradeArea.style.width = '110px';
        newGradeArea.style.height = '20px';
        newGradeArea.style.fontSize = '18px';
        newGradeArea.style.textDecoration = 'bold';
        newGradeArea.readOnly = true;
        
        // Find place where current grade is displayed and add new grade to the end of it
        const gradeElement = userClass.querySelector('.sg-header-heading.sg-right');
        newGradeArea.defaultValue = gradeElement.textContent.trim();
        gradeElement.insertAdjacentElement('afterend', newGradeArea);

        // Add row in table for "Add assignment" button
        const newAssignmentButtonRow = document.createElement('tr');
        newAssignmentButtonRow.classList.add('extension', 'assignment-row');

        // Add cell in row for button
        const newAssignmentButtonCell = document.createElement('td');
        newAssignmentButtonCell.colSpan = 6;

        // Create "Add assignment" button
        const newAssignmentButton = document.createElement('button');
        newAssignmentButton.textContent = 'Add assignment';
        newAssignmentButton.type = 'button';
        newAssignmentButton.style.display = 'block';
        newAssignmentButton.style.width = '100%';
        newAssignmentButton.style.height = '12px';
        newAssignmentButton.style.backgroundColor = 'white';
        newAssignmentButton.style.borderWidth = '1px';
        newAssignmentButton.style.borderRadius = '999px';
        newAssignmentButton.classList.add('extension', 'assignment-button')
        
        // Add the button right below the table header
        const gradeTableHeader = userClass.querySelector('.sg-asp-table-header-row');
        newAssignmentButtonCell.appendChild(newAssignmentButton);
        newAssignmentButtonRow.appendChild(newAssignmentButtonCell);
        gradeTableHeader.insertAdjacentElement('afterend', newAssignmentButtonRow);
    });

    // Add text fields next to each grade in every class
    Object.values(allRealGrades).forEach(classAssignments => {

        // Loop through all classes
        Object.values(classAssignments).forEach(assignment => {

            // Create text field
            const inputArea = document.createElement('input');
            inputArea.classList.add('extension', 'text-field');
            inputArea.style.width = '40px';
            inputArea.style.height = '12px';

            // Update default value of text fields to represent the same value as original grades
            // If the grade starts with X (exempt) or Z (late), make those the default value
            if (assignment.score[0].toUpperCase() == 'X' || assignment.score[0].toUpperCase() == 'Z') {
                inputArea.defaultValue = assignment.score.toUpperCase();
            }

            // If the grade is an integer, remove its decimals
            else if (Math.round(assignment.score) == assignment.score) {
                inputArea.defaultValue = Number(assignment.score).toFixed(0);
            }

            // Otherwise, simply use the same value
            else {
                inputArea.defaultValue = assignment.score;
            }

            // Add text field right next to actual grade
            assignment.scoreElement.insertAdjacentElement('beforeend', inputArea);
        });
    });

    // When the content is clicked, see if the "Add assignment" button was clicked
    content.addEventListener('click', detectAssignmentButtonClick);
}

/**
 * Adds an extra row to the class where the user clicked the button. This allows the user to enter
 * a new hypothetical assignment rather than only editing an already existing grade.
 * 
 * @param {object} event Button which user clicked to add assignment
 */
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

/**
 * Removes all of the extension's functionality. Runs when user clicks icon again.
 */
function removeFunctionality() {
    const textFields = content.querySelectorAll('.extension');
    textFields.forEach(field => {
        field.parentElement.style.removeProperty('display');
        field.remove();
    });
}

/**
 * If the "Add assignment" button is clicked, the function to add a assignment runs
 * 
 * @param {object} event Place where user clicked
 */
function detectAssignmentButtonClick(event) {
    if (event.target.classList.contains('assignment-button')) {
        addAssignment(event);
    }
}

// Runs when the user's grades are loaded
iframe.addEventListener('load', () => {
    
    // Set Iframe's content and area with all grades
    content = iframe.contentDocument || iframe.contentWindow.document;
    allGradeTables = content.getElementById('plnMain_pnlFullPage');

    // Update grade when user focuses out of a text box or presses enter
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

// Listen for messages
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {

    // Add or remove extension functionality if user clicks extension icon
    if (message.action === 'toggle') {
        const extensionElements = content.querySelectorAll('.extension');
        if (extensionElements.length > 0) {
            removeFunctionality();
            content.removeEventListener('click', detectAssignmentButtonClick);
        }
        else {
            getData();
            addFunctionality();
        }
    }

    sendResponse();

    return true;
});

// const observer = new MutationObserver(getData);
// observer.observe(document.body, {attributes: true, childList: true, subtree: true});