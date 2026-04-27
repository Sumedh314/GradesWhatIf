const overallClassGrades = {}; // Overall grades for each class             {className: classOverallGrade}
const classCategoryWeights = {}; // Category weights in each class          {className: {category: weight}}
const allRealGrades = {}; // Grades for each assignment in each class       {className: {assignmentIndex: {grade data...}}}
let allNewGrades = {}; // Same as allRealGrades, but based on user entries  {className: {assignmentIndex: {grade data...}}}

// Content inside Iframe
const iframe = document.getElementById('sg-legacy-iframe');
/** @type {HTMLElement} */ let content = null;
/** @type {HTMLElement} */ let allGradeTables = null;

/**
 * Calculates the new grade of a class after the user enters a new hypothetical grade
 * 
 * @param {object} event Place where user entered a new grade
 */
function updateClassGrade(event) {
    
    // Get assignment name based on the row of the text field that was updated
    const assignmentRowElement = event.target.parentNode.parentNode;
    const gradeArray = Array.from(assignmentRowElement.parentNode.children);
    console.log(gradeArray);
    const assignmentIndex = gradeArray.length - gradeArray.indexOf(assignmentRowElement) - 1;
    
    // Get class name based on the table that the text field selected was inside
    const classHeader = assignmentRowElement.closest('.AssignmentClass');
    const className = classHeader.querySelector('.sg-header-heading').textContent.trim();

    // Update object and local storage to store new value user entered
    // console.log(assignmentData);
    allNewGrades[className][assignmentIndex][event.target.dataset.type] = event.target.value;
    chrome.storage.local.set({ allNewGrades: allNewGrades });
    console.log(allNewGrades);

    // Objects to store data for each category to help calculate final grade
    const totalCategoryUserPoints = {}; // Total points user has in each category           {category: points}
    const totalCategoryMaxPoints = {};  // Total points possible to score in each category  {category: points}
    const categoryWeightedScores = {};  // Weighted scores user has in each category        {category: score}

    Object.values(allNewGrades[className]).forEach(assignment => {
        const category = assignment.category;
        let score = assignment.score;
        let maxScore = Number(assignment.maxScore);
        if (score == '' || score == 'X') {
            score = 0;
            maxScore = 0;
        }
        else if (score == 'Z') {
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
 * Adds an extra row to the class where the user clicked the button. This allows the user to enter
 * a new hypothetical assignment rather than only editing an already existing grade.
 * 
 * @param {object} event Button which user clicked to add assignment
 */
function addAssignment(event) {
    const className = event.target.closest('.AssignmentClass').querySelector('.sg-header-heading').textContent.trim();
    const newIndex = Math.max(...Object.keys(allNewGrades[className])) + 1;

    event.target.closest('table').style.tableLayout = 'fixed';
    const newAssignmentRow = document.createElement('tr');
    newAssignmentRow.classList.add('extension', 'assignment-row');

    let scoreElement = null;
    const inputData = ['dateDue', 'dateAssigned', 'name', 'category', 'score', 'maxScore']
    for (let index = 0; index < 6; index++) {
        const cell = document.createElement('td');
        const textInput = document.createElement('input');
        textInput.classList.add('extension', 'grade-entry');
        cell.insertAdjacentElement('beforeend', textInput);
        newAssignmentRow.insertAdjacentElement('beforeend', cell);

        textInput.dataset.type = inputData[index];
        if (index == 5) {
            scoreElement = textInput;
        }
    }

    const gradeData = {
        name: '',
        category: '',
        score: '',
        maxScore: '',
        weight: '',
        scoreElement: scoreElement,
        userCreated: true
    }

    event.target.parentNode.parentNode.insertAdjacentElement('afterend', newAssignmentRow);

    allNewGrades[className][newIndex] = gradeData;
}

/**
 * Adds all texts boxes and buttons that make this thing useful.
 */
async function addFunctionality() {

    // All the div elements that contain class grades
    const userClassElements = allGradeTables.querySelectorAll('.AssignmentClass');

    // Add displays for new hypothetical overall class grades and add "Add assignment" buttons at the top of each class's grade table
    userClassElements.forEach(userClass => {

        // Create element to display new grade
        const newGradeArea = document.createElement('input');
        newGradeArea.classList.add('extension', 'grade-field');
        newGradeArea.readOnly = true;
        
        // Find place where current grade is displayed and add new grade to the end of it
        const gradeElement = userClass.querySelector('.sg-header-heading.sg-right');
        newGradeArea.defaultValue = gradeElement.textContent.trim();
        gradeElement.insertAdjacentElement('beforeend', newGradeArea);

        // Add row in table for "Add assignment" button
        const newAssignmentButtonRow = document.createElement('tr');
        newAssignmentButtonRow.classList.add('extension', 'assignment-row');

        // Add cell in row for button
        const newAssignmentButtonCell = document.createElement('td');
        newAssignmentButtonCell.colSpan = 6;

        // Create "Add assignment" button
        const newAssignmentButton = document.createElement('button');
        newAssignmentButton.classList.add('extension', 'new-assignment-button')
        newAssignmentButton.type = 'button';
        newAssignmentButton.textContent = 'Add assignment';
        
        // Add the button right below the table header
        const gradeTableHeader = userClass.querySelector('.sg-asp-table-header-row');
        newAssignmentButtonCell.appendChild(newAssignmentButton);
        newAssignmentButtonRow.appendChild(newAssignmentButtonCell);
        gradeTableHeader.insertAdjacentElement('afterend', newAssignmentButtonRow);
    });

    // Add text fields next to each grade in every class
    for (const userClass of Object.keys(allRealGrades)) {
        console.log(allNewGrades);
        
        // Loop through all classes
        let index = 1;
        for (const assignmentIndex of Object.keys(allRealGrades[userClass])) {
            // console.log(index);
            index++;
            
            // Create text field
            const inputArea = document.createElement('input');
            inputArea.classList.add('extension', 'grade-entry');
            inputArea.id = 'score';
            
            // Set the default value of grades to be from what the user entered from previous uses of the extension
            let gradeShown = '';
            if (allNewGrades[userClass]?.[assignmentIndex]?.score != undefined) {
                gradeShown = allNewGrades[userClass][assignmentIndex].score;
            }
            inputArea.defaultValue = gradeShown;
            
            // console.log(allNewGrades[userClass]);
            allNewGrades[userClass][assignmentIndex].scoreElement.insertAdjacentElement('beforeend', inputArea);
            allNewGrades[userClass][assignmentIndex].score = gradeShown;
        }
    }
    console.log('asdf;klajs;dlfkas');

    // When the content is clicked, see if the "Add assignment" button was clicked
    content.addEventListener('click', detectAssignmentButtonClick);

    // Make sure CSS is injected to style additional features
    await chrome.runtime.sendMessage({ action: 'injectCSS' });
}

/**
 * Gets the user's grades and assignment weights and stores them in the corresponding objects.
 */
async function getData() {

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
        const assignmentRows = Array.from(userClassElement.querySelector('.sg-asp-table').querySelectorAll('.sg-asp-table-data-row')).reverse();
        
        // Loop through each row in the table that stores all the user's assignments for a class
        let index = 0;
        assignmentRows.forEach(row => {

            // Get the name of the assignment in the current row
            const rowElements = row.getElementsByTagName('td');
            
            // Store all the relevent data for each assignment grade
            const gradeData = {
                name: rowElements[2].querySelector('a').textContent.trim(),
                category: rowElements[3].textContent.trim(),
                score: rowElements[4].textContent.trim(),
                maxScore: rowElements[5].textContent.trim(),
                weight: rowElements[6].textContent.trim(),
                scoreElement: rowElements[4],
                userCreated: false
            };

            // If the grade starts with X (exempt) or Z (late), make those the default value
            if (gradeData.score[0]?.toUpperCase() == 'X' || gradeData.score[0]?.toUpperCase() == 'Z') {
                gradeData.score = gradeData.score[0].toUpperCase();
            }
            
            // If the grade is not blank and the grade is an integer, remove its decimals
            else if (gradeData.score != '' && Math.round(gradeData.score) == gradeData.score) {
                gradeData.score = Number(gradeData.score).toFixed(0);
            }
            
            // Add values to objects
            assignmentData[index] = gradeData;
            allRealGrades[className] = assignmentData;

            index++;
        });
    }

    // const allNewGradesData = await chrome.storage.local.get('allNewGrades');
    // allNewGrades = allNewGradesData.allNewGrades;

    // if (Object.keys(allNewGrades).length == 0) {
    allNewGrades = allRealGrades;
    //     chrome.storage.local.set({ allNewGrades: allNewGrades });
    // }
    console.log(allNewGrades);
}

/**
 * Calls function to calculate and update user's new grade after entering in a new hypothetical grade
 */
function detectUserGradeUpdate()  {
    
    // Set Iframe's content and area with all grades
    content = iframe.contentDocument || iframe.contentWindow.document;
    allGradeTables = content.getElementById('plnMain_pnlFullPage');

    // Update grade when user focuses out of a text box or presses enter
    content.addEventListener('focusout', (event) => {
        if (event.target.classList.contains('grade-entry')) {
            updateClassGrade(event);
        }
    });
    content.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && content.activeElement.classList.contains('grade-entry')) {
            event.preventDefault();
            updateClassGrade(event);
        }
    });

    // Adjust Iframe size when content is changed
    const observer = new MutationObserver(resizeContent);
    observer.observe(content.querySelector('body'), {attributes: true, childList: true, subtree: true});
}

/**
 * Removes all of the extension's functionality. Runs when user clicks icon again.
 */
function removeFunctionality() {
    iframe.removeEventListener('load', detectUserGradeUpdate);

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
    if (event.target.classList.contains('new-assignment-button')) {
        addAssignment(event);
    }
}

/**
 * Adjusts height of Iframe that contains grades when content changes
 */
function resizeContent() {
    iframe.style.height = `${content.querySelector('html').querySelector('body').clientHeight}px`;
    // console.log(iframe.style.height);
}

// Runs when the user's grades are loaded
iframe.addEventListener('load', detectUserGradeUpdate);

chrome.runtime.onMessage.addListener(async (message, _, sendResponse) => {

    // Add or remove extension functionality if user clicks extension icon
    if (message.action == 'activate') {
        await getData();
        await addFunctionality();
    }
    else if (message.action == 'deactivate') {
        removeFunctionality();
        content.removeEventListener('click', detectAssignmentButtonClick);
    }

    sendResponse();
    return true;
});