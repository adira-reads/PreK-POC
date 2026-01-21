// ====================================================================
// ============ ALL CONFIGURATION CONSTANTS ===========================
// ====================================================================

// --- BASE CONFIGURATION ---
const ROSTER_SHEET_NAME = "Roster";
const PRE_SCHOOL_SHEET_NAME = "Pre-School";
const PRE_K_SHEET_NAME = "Pre-K";
const PACING_SHEET_NAME = "Pacing";
const HEADER_ROW = 5; // The row number with Lesson Names (e.g., "Letter A Form")
const DATA_START_ROW = 6; // The row number where student data begins

// --- SUMMARY REPORT CONFIGURATION ---
const SUMMARY_SHEET_NAME = "Skill Summary Page";
const SUMMARY_START_ROW = 6;
const TOTAL_LESSONS = 26; // Total letters in the curriculum
const SUMMARY_PRE_SCHOOL_IN_PROGRESS_COL = 3; // Col C
const SUMMARY_PRE_SCHOOL_CUMULATIVE_COL = 4; // Col D
const SUMMARY_PRE_K_FORM_IN_PROGRESS_COL = 5; // Col E
const SUMMARY_PRE_K_FORM_CUMULATIVE_COL = 6; // Col F
const SUMMARY_PRE_K_NAME_IN_PROGRESS_COL = 7; // Col G
const SUMMARY_PRE_K_NAME_CUMULATIVE_COL = 8; // Col H
const SUMMARY_PRE_K_SOUND_IN_PROGRESS_COL = 9; // Col I
const SUMMARY_PRE_K_SOUND_CUMULATIVE_COL = 10; // Col J
const SUMMARY_LAST_COL = 10; // The last column we are writing to

// --- PARENT REPORT CONFIGURATION ---
const TEMPLATE_DOC_ID = "13Ps1lPM3Xo4KfjihLgue415kWlkZG85XviO8ZJoM2W8"; // Your Template ID
const REPORT_FOLDER_ID = "1UsH17cwCWD2U5VVLxIRB88VxssbkK2GJ"; // Your Folder ID

// --- TUTOR APP CONFIGURATION ---
const TUTOR_SHEET_NAME = "Tutors";
const TUTOR_LOG_SHEET_NAME = "Tutor Log"; // Corrected name with space


// ====================================================================
// ============ MAIN WEB APP & MENU FUNCTIONS =========================
// ====================================================================

/**
 * Serves the correct HTML file based on a URL parameter.
 * ?page=tutor will load the TutorForm.
 * Anything else will load the main teacher form (Index.html).
 */
function doGet(e) {
  var page = e.parameter.page;
  
  if (page == "tutor") {
    // This is the Tutor App
    return HtmlService.createHtmlOutputFromFile('TutorForm')
      .setTitle('Tutor Session Tracker')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } else {
    // This is the main Teacher App
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Student Assessment Tracker')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
}

/**
 * Creates a custom menu in the spreadsheet when it opens.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Reports')
    .addItem('Update Summary Page', 'calculateAllSummaries')
    .addItem('Update Pacing Sheet Colors', 'updatePacingSheetFormatting')
    .addSeparator() 
    .addItem('Generate All Parent Reports', 'generateParentReports')
    .addToUi();
}

// ====================================================================
// ============ SUMMARY REPORT FUNCTIONS ==============================
// ====================================================================

/**
 * Main function to calculate all student summaries.
 * This is triggered by the custom menu.
 */
function calculateAllSummaries() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summarySheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!summarySheet) {
    SpreadsheetApp.getUi().alert("Error: 'Skill Summary Page' not found.");
    return;
  }
  
  // Get all data from sheets one time for efficiency
  const rosterData = ss.getSheetByName(ROSTER_SHEET_NAME).getDataRange().getValues();
  const preSchoolData = ss.getSheetByName(PRE_SCHOOL_SHEET_NAME).getDataRange().getValues();
  const preKData = ss.getSheetByName(PRE_K_SHEET_NAME).getDataRange().getValues();

  // Get headers from Pre-K sheet (Row 5)
  const preKHeaders = preKData[HEADER_ROW - 1];
  
  // Create quick-lookup "Maps" for performance
  const rosterMap = new Map(rosterData.slice(1).map(row => [row[0], row[2]])); // Map<StudentName, Program>
  const preSchoolMap = new Map(preSchoolData.slice(DATA_START_ROW - 1).map(row => [row[0], row])); // Map<StudentName, DataRow>
  const preKMap = new Map(preKData.slice(DATA_START_ROW - 1).map(row => [row[0], row])); // Map<StudentName, DataRow>

  // Get the data from the summary sheet
  const numStudents = summarySheet.getLastRow() - SUMMARY_START_ROW + 1;
  if (numStudents <= 0) {
    SpreadsheetApp.getUi().alert("No students found on the summary page.");
    return;
  }
  
  const summaryRange = summarySheet.getRange(SUMMARY_START_ROW, 1, numStudents, SUMMARY_LAST_COL);
  const summaryData = summaryRange.getValues();
  
  const outputData = []; // This array will hold our new calculated values

  // Loop through each student on the summary sheet
  for (const row of summaryData) {
    const studentName = row[0];
    const program = rosterMap.get(studentName);
    
    // Initialize all 8 values to "" (blank)
    let psInProgress = "", psCumulative = "";
    let pkFormInProgress = "", pkFormCumulative = "";
    let pkNameInProgress = "", pkNameCumulative = "";
    let pkSoundInProgress = "", pkSoundCumulative = "";

    if (program === "Pre-School") {
      const studentData = preSchoolMap.get(studentName);
      if (studentData) {
        const scores = calculateScores(studentData); // No filter needed
        psInProgress = scores.inProgress;
        psCumulative = scores.cumulative;
      }
    } else if (program === "Pre-K") {
      const studentData = preKMap.get(studentName);
      if (studentData) {
        // Form
        const formScores = calculateScores(studentData, preKHeaders, " - Form");
        pkFormInProgress = formScores.inProgress;
        pkFormCumulative = formScores.cumulative;
        
        // Name
        const nameScores = calculateScores(studentData, preKHeaders, " - Name");
        pkNameInProgress = nameScores.inProgress;
        pkNameCumulative = nameScores.cumulative;

        // Sound
        const soundScores = calculateScores(studentData, preKHeaders, " - Sound");
        pkSoundInProgress = soundScores.inProgress;
        pkSoundCumulative = soundScores.cumulative;
      }
    }
    
    // Add all 8 values to our output array, in order
    outputData.push([
      psInProgress, psCumulative,
      pkFormInProgress, pkFormCumulative,
      pkNameInProgress, pkNameCumulative,
      pkSoundInProgress, pkSoundCumulative
    ]);
  }
  
  // Write all the new data back to the sheet in one operation
  const outputRange = summarySheet.getRange(SUMMARY_START_ROW, SUMMARY_PRE_SCHOOL_IN_PROGRESS_COL, numStudents, 8); // 8 columns wide
  outputRange.setValues(outputData);
  outputRange.setNumberFormat("0.0%"); // Format the cells as a percentage
  
  SpreadsheetApp.getUi().alert("Success!", "Skill Summary Page has been updated.", SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Helper function to calculate percentages for a given student's data.
 * @param {Array} studentDataRow - The full row of data for one student.
 * @param {Array} [headers] - (Optional) The header row for Pre-K.
 * @param {string} [skillFilter] - (Optional) The skill to filter by (e.g., " - Form").
 * @returns {object} An object { inProgress: number, cumulative: number }.
 */
function calculateScores(studentDataRow, headers = null, skillFilter = null) {
  let y_count = 0;
  let n_count = 0;
  
  // Start from column C (index 2)
  for (let i = 2; i < studentDataRow.length; i++) {
    const value = studentDataRow[i];
    
    let include = true;
    if (skillFilter) {
      // If we are filtering (Pre-K), check the header
      include = headers[i] && headers[i].endsWith(skillFilter);
    }
    
    if (include) {
      if (value === "Y") {
        y_count++;
      } else if (value === "N") {
        n_count++;
      }
    }
  }
  
  const inProgressScore = (y_count + n_count === 0) ? 0 : (y_count / (y_count + n_count));
  const cumulativeScore = y_count / TOTAL_LESSONS; // Total lessons is 26
  
  return {
    inProgress: inProgressScore,
    cumulative: cumulativeScore
  };
}

// ====================================================================
// ============ PACING SHEET FORMATTING FUNCTIONS =====================
// ====================================================================

/**
 * Main function to update the Pacing sheet colors based on completion percentage.
 */
function updatePacingSheetFormatting() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get all sheets
  const pacingSheet = ss.getSheetByName(PACING_SHEET_NAME);
  const rosterSheet = ss.getSheetByName(ROSTER_SHEET_NAME);
  const preKSheet = ss.getSheetByName(PRE_K_SHEET_NAME);
  const preSchoolSheet = ss.getSheetByName(PRE_SCHOOL_SHEET_NAME);

  if (!pacingSheet || !rosterSheet || !preKSheet || !preSchoolSheet) {
    SpreadsheetApp.getUi().alert("Error: A required sheet (Pacing, Roster, Pre-K, or Pre-School) could not be found.");
    return;
  }

  // Get all data into memory
  const rosterData = rosterSheet.getDataRange().getValues();
  const preKData = preKSheet.getDataRange().getValues();
  const preSchoolData = preSchoolSheet.getDataRange().getValues();
  
  const pacingRange = pacingSheet.getRange(6, 1, pacingSheet.getLastRow() - 5, pacingSheet.getLastColumn());
  const pacingValues = pacingRange.getValues();
  const pacingColors = pacingRange.getBackgrounds(); // Get existing colors

  // Get header rows
  const preKHeaders = preKData[HEADER_ROW - 1]; // Row 5
  const preSchoolHeaders = preSchoolData[HEADER_ROW - 1]; // Row 5
  const pacingSetHeaders = pacingSheet.getRange(5, 1, 1, pacingSheet.getLastColumn()).getValues()[0]; // Row 5

  // Create lookup maps for efficiency
  // Map<StudentName, DataRow>
  const preKMap = new Map(preKData.slice(DATA_START_ROW - 1).map(row => [row[0], row])); 
  const preSchoolMap = new Map(preSchoolData.slice(DATA_START_ROW - 1).map(row => [row[0], row]));
  
  // Map<GroupName, [StudentName, StudentName, ...]>
  const rosterGroupMap = new Map();
  rosterData.slice(1).forEach(row => { // slice(1) skips header
    const studentName = row[0];
    const groupName = row[1];
    if (!rosterGroupMap.has(groupName)) {
      rosterGroupMap.set(groupName, []);
    }
    rosterGroupMap.get(groupName).push(studentName);
  });

  // --- Main Loop ---
  // Loop through each data row in the Pacing sheet (from row 6)
  for (let i = 0; i < pacingValues.length; i++) {
    const groupName = pacingValues[i][0]; // Col A
    const programString = pacingValues[i][1]; // Col B
    
    if (!groupName) continue; // Skip empty rows

    const isPreK = programString.includes("Form");
    const studentDataMap = isPreK ? preKMap : preSchoolMap;
    const headers = isPreK ? preKHeaders : preSchoolHeaders;
    const studentsInGroup = rosterGroupMap.get(groupName) || [];

    // Loop through the columns in the Pacing sheet
    // Start at j=2 (Col C) and jump 2 columns at a time (C, E, G, ...)
    for (let j = 2; j < pacingValues[i].length; j += 2) {
      
      // Check if this is a "Set" column (e.g., "Set 1, (Sept 1-12)")
      if (pacingSetHeaders[j] && pacingSetHeaders[j].toLowerCase().startsWith("set")) {
        const lettersString = pacingValues[i][j]; // e.g., "A, M, S, T"
        const targetColorColIndex = j + 1; // The "Assess" column (D, F, H, ...)

        if (targetColorColIndex >= pacingColors[i].length) continue; // Safety check

        let assessedStudentCount = 0;
        if (studentsInGroup.length > 0 && lettersString) {
          const letters = lettersString.split(',').map(l => l.trim());
          const requiredLessons = buildLessonNames(letters, isPreK);
          
          // Loop through each student in the group
          for (const studentName of studentsInGroup) {
            // Check if THIS student is complete for THIS set
            if (isStudentAssessedForSet(studentName, studentDataMap, headers, requiredLessons)) {
              assessedStudentCount++;
            }
          }
        }
        
        // Calculate the completion percentage
        let completionPercentage = 0;
        if (studentsInGroup.length > 0) {
          completionPercentage = (assessedStudentCount / studentsInGroup.length);
        }

        // Apply new color logic
        if (completionPercentage === 0) {
          pacingColors[i][targetColorColIndex] = "#f4cccc"; // Light Red (Skipped)
        } else if (completionPercentage < 0.5) {
          pacingColors[i][targetColorColIndex] = "#fff2cc"; // Light Yellow (< 50%)
        } else if (completionPercentage >= 0.8) {
          pacingColors[i][targetColorColIndex] = "#d9ead3"; // Light Green (>= 80%)
        } else {
          // This is the gap: 50% <= percentage < 80%
          pacingColors[i][targetColorColIndex] = "#ffffff"; // White (default)
        }
      }
    }
  }
  
  // Write all the colors back to the sheet in one operation
  pacingRange.setBackgrounds(pacingColors);
  SpreadsheetApp.getUi().alert("Pacing sheet colors have been updated!");
}

/**
 * Helper to build lesson names from letters
 */
function buildLessonNames(letters, isPreK) {
  const builtLessons = [];
  letters.forEach(letter => {
    if (isPreK) {
      builtLessons.push(letter + " - Form");
      builtLessons.push(letter + " - Name");
      builtLessons.push(letter + " - Sound");
    } else {
      builtLessons.push("Letter Sound " + letter);
    }
  });
  return builtLessons;
}

/**
 * Helper to check if a single student is fully assessed for a set of lessons.
 * @returns {boolean} True if the student has a "Y", "N", or "A" for all required lessons.
 */
function isStudentAssessedForSet(studentName, studentDataMap, headers, requiredLessons) {
  const studentData = studentDataMap.get(studentName);
  
  // If student isn't in the data sheet, they are not assessed
  if (!studentData) return false; 
  
  // Loop through every lesson required for this set
  for (const lesson of requiredLessons) {
    const colIndex = headers.indexOf(lesson);
    
    // If the lesson isn't in the header, something is wrong.
    if (colIndex === -1) {
      Logger.log("Warning: Lesson '" + lesson + "' not found in headers.");
      return false; 
    }
    
    const value = studentData[colIndex];
    
    // If the cell is blank (not Y, N, or A), they are not fully assessed
    if (value !== "Y" && value !== "N" && value !== "A") {
      return false;
    }
  }
  
  // If we get here, this student had a value for every required lesson
  return true;
}

// ====================================================================
// ============ PARENT REPORT GENERATOR FUNCTIONS =====================
// ====================================================================

/**
 * Generates a Google Doc report for every student on the summary page.
 */
function generateParentReports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summarySheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  const rosterSheet = ss.getSheetByName(ROSTER_SHEET_NAME);
  
  if (!summarySheet || !rosterSheet) {
    SpreadsheetApp.getUi().alert("Error: 'Skill Summary Page' or 'Roster' sheet not found.");
    return;
  }

  // Get the template and folder
  try {
    var templateFile = DriveApp.getFileById(TEMPLATE_DOC_ID);
    var outputFolder = DriveApp.getFolderById(REPORT_FOLDER_ID);
  } catch (e) {
    Logger.log(e);
    SpreadsheetApp.getUi().alert("Error: Could not find Template Doc or Report Folder. Please check your IDs in the 'Code.gs' file.");
    return;
  }
  
  // Get all data from sheets
  const summaryData = summarySheet.getRange(SUMMARY_START_ROW, 1, summarySheet.getLastRow() - SUMMARY_START_ROW + 1, SUMMARY_LAST_COL).getValues();
  const rosterData = rosterSheet.getRange(2, 1, rosterSheet.getLastRow() - 1, 3).getValues(); // Get Name, Group, Program

  // Create a Map for easy program lookup
  const rosterMap = new Map(rosterData.map(row => [row[0], row[2]])); // Map<StudentName, Program>
  
  const ui = SpreadsheetApp.getUi();
  ui.alert("Starting Report Generation", "This may take several minutes. Please do not close this sheet. You will be notified when it's complete.", ui.ButtonSet.OK);
  
  let filesCreated = 0;
  
  // Loop through each student on the summary sheet
  for (const row of summaryData) {
    const studentName = row[0];
    if (!studentName) continue; // Skip empty rows

    const program = rosterMap.get(studentName) || "Unknown";
    
    // Get all 8 percentage values
    // We use || 0 to make sure we have a number, not a blank string
    const psMastery = (row[2] || 0) * 100; // Col C
    const psCumulative = (row[3] || 0) * 100; // Col D
    const pkFormMastery = (row[4] || 0) * 100; // Col E
    const pkFormCumulative = (row[5] || 0) * 100; // Col F
    const pkNameMastery = (row[6] || 0) * 100; // Col G
    const pkNameCumulative = (row[7] || 0) * 100; // Col H
    const pkSoundMastery = (row[8] || 0) * 100; // Col I
    const pkSoundCumulative = (row[9] || 0) * 100; // Col J
    
    // 1. Create a new copy of the template
    const newFileName = `${studentName} - HWT Report`;
    const newFile = templateFile.makeCopy(newFileName, outputFolder);
    
    // 2. Open the new doc to edit it
    const doc = DocumentApp.openById(newFile.getId());
    const body = doc.getBody();
    
    // 3. Replace all merge fields with the student's data
    body.replaceText("{{StudentName}}", studentName);
    body.replaceText("{{Program}}", program);
    
    // Format as "0.0%"
    body.replaceText("{{PS_Mastery}}", psMastery.toFixed(1) + "%");
    body.replaceText("{{PS_Cumulative}}", psCumulative.toFixed(1) + "%");
    body.replaceText("{{PK_Form_Mastery}}", pkFormMastery.toFixed(1) + "%");
    body.replaceText("{{PK_Form_Cumulative}}", pkFormCumulative.toFixed(1) + "%");
    body.replaceText("{{PK_Name_Mastery}}", pkNameMastery.toFixed(1) + "%");
    body.replaceText("{{PK_Name_Cumulative}}", pkNameCumulative.toFixed(1) + "%");
    body.replaceText("{{PK_Sound_Mastery}}", pkSoundMastery.toFixed(1) + "%");
    body.replaceText("{{PK_Sound_Cumulative}}", pkSoundCumulative.toFixed(1) + "%");
    
    // 4. Save and close
    doc.saveAndClose();
    filesCreated++;
  }
  
  ui.alert("Report Generation Complete!", `${filesCreated} reports have been created in your 'Parent Reports' folder.`, ui.ButtonSet.OK);
}

// ====================================================================
// ============ WEB APP BACKEND FUNCTIONS (TEACHER) ===================
// ====================================================================

/**
 * Gets the unique list of groups from the Roster sheet.
 * @returns {string[]} A list of group names.
 */
function getGroups() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ROSTER_SHEET_NAME);
    if (!sheet) throw new Error("Roster sheet not found");
    
    // Get all data from column B, starting from row 2
    const range = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1);
    const values = range.getValues();
    
    // Get unique, non-blank values
    const uniqueGroups = [...new Set(values.flat())].filter(g => g);
    return uniqueGroups.sort();
  } catch (e) {
    Logger.log(e);
    return [];
  }
}

/**
 * Gets the students for a specific group.
 * @param {string} groupName The selected group.
 * @returns {Object[]} A list of student objects {name, program}.
 */
function getStudentsByGroup(groupName) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ROSTER_SHEET_NAME);
    if (!sheet) throw new Error("Roster sheet not found");

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues(); // Get Name, Group, Program
    
    const students = data
      .filter(row => row[1] === groupName) // Filter by selected group
      .map(row => ({ name: row[0], program: row[2] })); // Return object
      
    return students.sort((a, b) => a.name.localeCompare(b.name)); // Sort by name
  } catch (e) {
    Logger.log(e);
    return [];
  }
}

/**
 * Gets all necessary data to build the assessment form for a student.
 * (This is a helper function for getFilteredAssessmentData)
 * @param {string} studentName The name of the selected student.
 * @param {string} program The student's program ('Pre-School' or 'Pre-K').
 * @returns {Object} An object { lessons: [], currentData: {} }.
 */
function getStudentAssessmentData(studentName, program) {
  try {
    const sheetName = (program === 'Pre-School') ? PRE_SCHOOL_SHEET_NAME : PRE_K_SHEET_NAME;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error("Data sheet not found: " + sheetName);

    // 1. Get Lesson Headers from HEADER_ROW
    const headersRange = sheet.getRange(HEADER_ROW, 3, 1, sheet.getLastColumn() - 2);
    const lessonHeaders = headersRange.getValues().flat().filter(h => h); // Get all non-blank headers

    // 2. Find Student Row and Get Current Data
    const studentNameColumn = sheet.getRange(DATA_START_ROW, 1, sheet.getLastRow() - DATA_START_ROW + 1, 1).getValues().flat();
    const studentRowIndex = studentNameColumn.indexOf(studentName);
    
    let currentData = {};
    let studentRow = -1;

    if (studentRowIndex !== -1) {
      studentRow = studentRowIndex + DATA_START_ROW; // Actual row number
      const dataRange = sheet.getRange(studentRow, 3, 1, lessonHeaders.length);
      const dataValues = dataRange.getValues().flat();
      
      lessonHeaders.forEach((header, index) => {
        currentData[header] = dataValues[index] || ''; // Store current value (Y, N, A, or blank)
      });
    } else {
      Logger.log("Student not found in sheet: " + studentName);
    }

    return {
      lessons: lessonHeaders,
      currentData: currentData
    };

  } catch (e) {
    Logger.log(e);
    return { lessons: [], currentData: {} };
  }
}


/**
 * Saves the assessment data back to the sheet.
 * @param {Object} data - The data from the form { studentName, program, assessments }.
 * @returns {string} A success or error message.
 */
function saveAssessmentData(data) {
  const { studentName, program, assessments } = data;
  
  try {
    const sheetName = (program === 'Pre-School') ? PRE_SCHOOL_SHEET_NAME : PRE_K_SHEET_NAME;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error("Data sheet not found: " + sheetName);

    // 1. Find the student's row
    const studentNameColumn = sheet.getRange(DATA_START_ROW, 1, sheet.getLastRow() - DATA_START_ROW + 1, 1).getValues().flat();
    const studentRowIndex = studentNameColumn.indexOf(studentName);
    
    if (studentRowIndex === -1) {
      return "Error: Student '" + studentName + "' not found in sheet '" + sheetName + "'.";
    }
    const studentRow = studentRowIndex + DATA_START_ROW; // Actual row number

    // 2. Get all headers to find column indexes
    const headersRange = sheet.getRange(HEADER_ROW, 1, 1, sheet.getLastColumn());
    const allHeaders = headersRange.getValues().flat();

    // 3. Get the whole row, update it, and write it back
    const rowRange = sheet.getRange(studentRow, 1, 1, sheet.getLastColumn());
    const rowValues = rowRange.getValues()[0]; 

    for (const [lessonName, status] of Object.entries(assessments)) {
      const colIndex = allHeaders.indexOf(lessonName);
      if (colIndex !== -1) {
        rowValues[colIndex] = status; // Update the value in our local array
      }
    }
    
    // Now write the entire updated array back to the row
    rowRange.setValues([rowValues]); 

    return "Success! Data saved for " + studentName + ".";
  } catch (e) {
    Logger.log(e);
    return "Error: " + e.message;
  }
}

/**
 * Gets the list of instructional sequences AND their corresponding letters for a specific group.
 * @param {string} groupName The group (e.g., "Goldfish").
 * @returns {object[]} A list of objects {sequenceName: string, letters: string}.
 */
function getSequences(groupName) { // <-- Added groupName parameter
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PACING_SHEET_NAME);
    if (!sheet) throw new Error("Pacing sheet not found");

    const data = sheet.getDataRange().getValues();
    const sequences = [];

    // Find the row for the group
    const groupRowIndex = data.findIndex((row, index) => index >= 5 && row[0] === groupName); // Assumes groups start row 6 (index 5)
    if (groupRowIndex === -1) {
      Logger.log("Group '" + groupName + "' not found in Pacing sheet for sequence lookup.");
      return []; // Return empty if group not found
    }

    // Loop through Row 4 (index 3) to find sequence names and their columns
    const sequenceRow = data[3]; 
    for (let colIndex = 0; colIndex < sequenceRow.length; colIndex++) {
      const sequenceName = sequenceRow[colIndex];
      // Check if it's a non-blank sequence name AND corresponds to a "Set" column (C, E, G...)
      if (sequenceName && colIndex >= 2 && (colIndex % 2 === 0)) { 
        const letters = data[groupRowIndex][colIndex] || ""; // Get letters from group's row, sequence's column
        sequences.push({ sequenceName: sequenceName, letters: letters });
      }
    }

    return sequences; // Return array of objects

  } catch (e) {
    Logger.log(e);
    return [];
  }
}

/**
 * Gets the specific lesson names for a given group and sequence.
 * @param {string} groupName The group (e.g., "Goldfish").
 * @param {string} sequenceName The sequence (e.g., "Instructional Sequence 1").
 * @returns {string[]} A list of final lesson names (e.g., "A - Form", "Letter Sound B").
 */
function getLessonsForSequence(groupName, sequenceName) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PACING_SHEET_NAME);
    if (!sheet) throw new Error("Pacing sheet not found");
    
    const data = sheet.getDataRange().getValues();

    // Find the row for the group
    // Assumes group names start in Row 6 (index 5)
    const groupRowIndex = data.findIndex((row, index) => index >= 5 && row[0] === groupName);
    if (groupRowIndex === -1) {
      throw new Error("Group '" + groupName + "' not found in Pacing sheet.");
    }
    
    // Find the column for the sequence
    // Assumes sequence names are in Row 4 (index 3)
    const seqColIndex = data[3].indexOf(sequenceName);
    if (seqColIndex === -1) {
      throw new Error("Sequence '" + sequenceName + "' not found in Pacing sheet.");
    }

    // Get the letters and program type from the found row
    const lettersString = data[groupRowIndex][seqColIndex]; // e.g., "A, M, S, T"
    const programString = data[groupRowIndex][1]; // e.g., "Letter Name, Letter Sound, Letter Form"
    
    if (!lettersString) {
      return []; // No letters for this sequence
    }

    const letters = lettersString.split(',').map(l => l.trim());
    const isPreK = programString.includes("Form");
    const builtLessons = [];

    letters.forEach(letter => {
      if (isPreK) {
        // Format: "A - Form", "A - Name", "A - Sound"
        builtLessons.push(letter + " - Form");
        builtLessons.push(letter + " - Name");
        builtLessons.push(letter + " - Sound");
      } else {
        // Format: "Letter Sound A"
        builtLessons.push("Letter Sound " + letter);
      }
    });
    
    return builtLessons;
    
  } catch (e) {
    Logger.log(e);
    return [];
  }
}

/**
 * Gets filtered assessment data based on sequence.
 * @param {string} studentName The name of the selected student.
 * @param {string} program The student's program ('Pre-School' or 'Pre-K').
 * @param {string} groupName The student's group (for Pacing sheet lookup).
 * @param {string} sequenceName The selected instructional sequence.
 * @returns {Object} An object { lessons: [], currentData: {} }.
 */
function getFilteredAssessmentData(studentName, program, groupName, sequenceName) {
  // 1. Get the list of lessons that *should* be shown for this sequence
  const sequenceLessonNames = getLessonsForSequence(groupName, sequenceName); 

  // 2. Get *all* assessment data for the student
  const allData = getStudentAssessmentData(studentName, program);

  // 3. Filter the lessons based on the sequence list
  const filteredLessons = allData.lessons.filter(lesson => sequenceLessonNames.includes(lesson));

  // 4. Return just the filtered lessons and data
  return {
    lessons: filteredLessons,
    currentData: allData.currentData
    // sequenceLetters is no longer needed here
  };
}


// ====================================================================
// ============ TUTOR WEB APP FUNCTIONS ===============================
// ====================================================================

/**
 * Gets the unique list of tutors from the Tutors sheet.
 * @returns {string[]} A list of tutor names.
 */
function getTutorNames() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TUTOR_SHEET_NAME);
    if (!sheet) throw new Error("Tutor sheet not found");
    
    // Assumes names are in Column A, starting row 2
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1);
    const values = range.getValues();
    
    const uniqueTutors = [...new Set(values.flat())].filter(t => t);
    return uniqueTutors.sort();
  } catch (e) {
    Logger.log(e);
    return [];
  }
}

/**
 * Gets the full student roster (Name and Program).
 * @returns {Object[]} A list of student objects {name, program}.
 */
function getStudentRoster() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ROSTER_SHEET_NAME);
    if (!sheet) throw new Error("Roster sheet not found");

    // Get Name (col 1) and Program (col 3)
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues(); 
    
    const students = data
      .filter(row => row[0]) // Filter out blank rows
      .map(row => ({ name: row[0], program: row[2] })); // Return object
      
    return students.sort((a, b) => a.name.localeCompare(b.name)); // Sort by name
  } catch (e) {
    Logger.log(e);
    return [];
  }
}

/**
 * Saves the tutor's lesson data to the "TutorLog" sheet
 * AND updates the main student data sheet ("Pre-K" or "Pre-School").
 * @param {Object} data - {tutor, student, program, lesson, nameStatus, soundStatus}
 * @returns {string} A success or error message.
 */
function saveTutorSession(data) {
  const { tutor, student, program, lesson, nameStatus, soundStatus } = data;

  // --- Step 1: Log the session (as before) ---
  try {
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TUTOR_LOG_SHEET_NAME);
    if (logSheet) {
      logSheet.appendRow([tutor, student, new Date(), lesson, nameStatus, soundStatus, "Present"]);
    } else {
      Logger.log("Tutor Log sheet not found. Skipping log.");
    }
  } catch (e) {
    Logger.log("Error logging tutor session: " + e.message);
  }

  // --- Step 2: Update the main student sheet ---
  try {
    const isPreK = (program === 'Pre-K');
    const sheetName = isPreK ? PRE_K_SHEET_NAME : PRE_SCHOOL_SHEET_NAME;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error("Student data sheet not found: " + sheetName);

    // Find the student's row
    const studentNameColumn = sheet.getRange(DATA_START_ROW, 1, sheet.getLastRow() - DATA_START_ROW + 1, 1).getValues().flat();
    const studentRowIndex = studentNameColumn.indexOf(student);
    if (studentRowIndex === -1) {
      // Log an error but don't stop the user; the log was successful.
      Logger.log("Student '" + student + "' not found in sheet '" + sheetName + "'. Skipping main sheet update.");
      return "Success! Session saved to log. (Student not found in main sheet for update).";
    }
    const studentRow = studentRowIndex + DATA_START_ROW;

    // Get all headers (Row 5)
    const headersRange = sheet.getRange(HEADER_ROW, 1, 1, sheet.getLastColumn());
    const allHeaders = headersRange.getValues().flat();

    // Get the whole row's data
    const rowRange = sheet.getRange(studentRow, 1, 1, sheet.getLastColumn());
    const rowValues = rowRange.getValues()[0];

    // Define the target columns based on the program
    // `lesson` is just the letter, e.g., "A"
    let nameColName = isPreK ? `${lesson} - Name` : null; 
    let soundColName = isPreK ? `${lesson} - Sound` : `Letter Sound ${lesson}`;

    // Find and update Letter Name (if applicable and data was provided)
    if (isPreK && nameStatus) { // Only update if Pre-K and status is Y/N
      const colIndex = allHeaders.indexOf(nameColName);
      if (colIndex !== -1) {
        rowValues[colIndex] = nameStatus;
        Logger.log(`Updated ${student} -> ${nameColName} to ${nameStatus}`);
      } else {
        Logger.log(`Column not found: ${nameColName}`);
      }
    }

    // Find and update Letter Sound (if data was provided)
    if (soundStatus) { // Always update sound if status is Y/N
      const colIndex = allHeaders.indexOf(soundColName);
      if (colIndex !== -1) {
        rowValues[colIndex] = soundStatus;
        Logger.log(`Updated ${student} -> ${soundColName} to ${soundStatus}`);
      } else {
        Logger.log(`Column not found: ${soundColName}`);
      }
    }

    // Write the updated row back to the sheet
    rowRange.setValues([rowValues]); 

    return "Success! Session saved and student sheet updated.";
    
  } catch (e) {
    Logger.log("Error updating student sheet: " + e.message);
    // Send a more user-friendly error
    return "Session logged, but error updating student sheet: " + e.message;
  }
}

/**
 * Saves the tutor's absence data to the "TutorLog" sheet.
 * @param {Object} data - {tutor, student}
 * @returns {string} A success or error message.
 */
function saveTutorAbsence(data) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TUTOR_LOG_SHEET_NAME);
    if (!sheet) throw new Error("Tutor Log sheet not found");

    const newRow = [
      data.tutor,
      data.student,
      new Date(),
      "", // Lesson
      "", // Name Status
      "", // Sound Status
      "Absent" // Session Status
    ];
    
    sheet.appendRow(newRow);
    return "Success! " + data.student + " marked as absent.";
  } catch (e) {
    Logger.log(e);
    return "Error: " + e.message;
  }
}

/**
 * Finds all lessons where a student scored "N" for "Name" or "Sound".
 * (This is the "needs work" logic)
 * @param {string} studentName The name of the selected student.
 * @param {string} program The student's program ('Pre-School' or 'Pre-K').
 * @returns {string[]} A list of letter names (e.g., "A", "C").
 */
function getNeedsWorkLetters(studentName, program) {
  try {
    const sheetName = (program === 'Pre-School') ? PRE_SCHOOL_SHEET_NAME : PRE_K_SHEET_NAME;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error("Data sheet not found: " + sheetName);

    // 1. Get Lesson Headers (Row 5)
    const headersRange = sheet.getRange(HEADER_ROW, 3, 1, sheet.getLastColumn() - 2);
    const lessonHeaders = headersRange.getValues().flat();

    // 2. Find Student Row
    const studentNameColumn = sheet.getRange(DATA_START_ROW, 1, sheet.getLastRow() - DATA_START_ROW + 1, 1).getValues().flat();
    const studentRowIndex = studentNameColumn.indexOf(studentName);
    
    if (studentRowIndex === -1) {
      Logger.log("Student not found in sheet: " + studentName);
      return []; // Return empty list if student not found
    }
    
    const studentRow = studentRowIndex + DATA_START_ROW;
    const dataRange = sheet.getRange(studentRow, 3, 1, lessonHeaders.length);
    const dataValues = dataRange.getValues().flat();
    
    const needsWork = new Set(); // Use a Set to avoid duplicates (e.g., "A")

    // 3. Loop through data and find "N"s
    dataValues.forEach((value, index) => {
      if (value === "N") {
        const header = lessonHeaders[index];
        // Only include "Name" or "Sound" lessons
        if (header && (header.includes("Name") || header.includes("Sound"))) {
          // Extract the letter (e.g., "A - Name" -> "A", "Letter Sound A" -> "A")
          const parts = header.split(' ');
          if (header.includes(" - ")) {
            needsWork.add(parts[0]); // "A" from "A - Name"
          } else {
            needsWork.add(parts.pop()); // "A" from "Letter Sound A"
          }
        }
      }
    });

    return Array.from(needsWork).sort(); // Return sorted array of letters

  } catch (e) {
    Logger.log(e);
    return [];
  }
}

/**
 * Gets the combined "smart list" for the tutor dropdown.
 * @param {string} studentName The name of the selected student.
 * @param {string} program The student's program.
 * @returns {object} An object with two arrays: {needsWork: [], otherLetters: []}
 */
function getTutorLessonList(studentName, program) {
  const allLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
  const needsWorkLetters = getNeedsWorkLetters(studentName, program);
  
  // Create a Set of the "needs work" letters for fast lookup
  const needsWorkSet = new Set(needsWorkLetters);
  
  // Filter allLetters to get only the ones NOT in the needsWorkSet
  const otherLetters = allLetters.filter(letter => !needsWorkSet.has(letter));
  
  return {
    needsWork: needsWorkLetters,
    otherLetters: otherLetters
  };
}
