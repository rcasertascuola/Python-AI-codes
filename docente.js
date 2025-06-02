let allStudentData = [];
let uniqueExercisesMap = new Map(); // To store unique exercises

// Function to display overall aggregated statistics
function displayOverallStatistics(studentDataArray, exercisesMap) {
    const container = document.getElementById('overall-stats-container');
    if (!container) {
        console.error("Contenitore statistiche complessive non trovato.");
        return;
    }
    // Clear previous content but keep the initial "Processing X files..." message if it's there
    container.innerHTML = ''; // Always clear first

    if (!studentDataArray || studentDataArray.length === 0) {
        container.innerHTML = '<p class="text-muted">Nessun dato disponibile per le statistiche.</p>';
        return;
    }

    const numStudents = studentDataArray.length;
    let processingMessage = document.getElementById('file-processing-status-message');
    if (processingMessage) {
        processingMessage.remove(); // Remove the "Processing X files..." message
    }


    let totalCorrectAnswersAcrossAll = 0;
    let totalMaxPossibleScoreAcrossAll = 0;
    let totalAttemptedExercisesAcrossAll = 0;
    let totalExercisesInLesson = 0; // Assuming all students have the same set of exercises from one lesson type

    // Determine total exercises from the uniqueExercisesMap for consistency,
    // especially if not all student files might list all exercises (though they should).
    // However, for attempted/scored, we must iterate per student.
    
    // First, get a list of all *possible* exercises from the unique map.
    // This helps in defining what a "complete" set of exercises is.
    // For scoring, we'll iterate student by student as before.

    if (exercisesMap.size > 0) {
        exercisesMap.forEach(ex => {
            totalExercisesInLesson++; // Count each unique exercise once for the "total possible" in the lesson
        });
    }


    let totalAnnotations = 0;
    let totalSummaries = 0;

    studentDataArray.forEach(student => {
        totalAnnotations += (Array.isArray(student.annotazioni_utente) ? student.annotazioni_utente : []).length;
        totalSummaries += (Array.isArray(student.riassunti_utente) ? student.riassunti_utente : []).length;

        const studentExercises = (Array.isArray(student.elementi_lezione) ? student.elementi_lezione : []).filter(el => el && typeof el.tipo === 'string' && el.tipo.startsWith('esercizio_'));
        
        // Accumulate attempts for this student
        studentExercises.forEach(exercise => {
            const exerciseId = exercise.id;
            const userAnswer = student.risposte_utente ? student.risposte_utente[exerciseId] : undefined;
            if (userAnswer !== undefined && userAnswer !== null && ((typeof userAnswer === 'string' && userAnswer.trim() !== '') || Array.isArray(userAnswer) || typeof userAnswer === 'number' || typeof userAnswer === 'boolean')) {
                totalAttemptedExercisesAcrossAll++;
            }
        });


        // Scoring for this student
        let studentCorrect = 0;
        let studentMaxScore = 0;

        studentExercises.forEach(exercise => {
            const exerciseId = exercise.id;
            const userAnswer = student.risposte_utente ? student.risposte_utente[exerciseId] : undefined;

            if (exercise.risposta_corretta !== undefined) { // Scorable exercise
                studentMaxScore++;
                if (userAnswer !== undefined && userAnswer !== null && ((typeof userAnswer === 'string' && userAnswer.trim() !== '') || Array.isArray(userAnswer))) {
                    let isCorrect = false;
                    const correctAnswer = exercise.risposta_corretta;
                    if (Array.isArray(correctAnswer)) {
                        isCorrect = JSON.stringify((userAnswer || []).slice().sort()) === JSON.stringify(correctAnswer.slice().sort());
                    } else {
                        isCorrect = userAnswer === correctAnswer;
                    }
                    if (isCorrect) {
                        studentCorrect++;
                    }
                }
            }
        });
        totalCorrectAnswersAcrossAll += studentCorrect;
        totalMaxPossibleScoreAcrossAll += studentMaxScore; // Sum of max scores for each student (could vary if lessons differ)
    });
    
    // Total exercises available across all students for completion rate
    // This assumes all students are working on lessons with roughly the same number of exercises.
    // A more robust way would be to use uniqueExercisesMap.size if all files are from the *same* lesson structure.
    // For now, using student-based sum of exercises.
    const totalPossibleAttempts = numStudents * totalExercisesInLesson;


    const avgScore = totalMaxPossibleScoreAcrossAll > 0 ? (totalCorrectAnswersAcrossAll / totalMaxPossibleScoreAcrossAll) * 100 : 0;
    const avgCompletionRate = totalPossibleAttempts > 0 ? (totalAttemptedExercisesAcrossAll / totalPossibleAttempts) * 100 : 0;

    // Build HTML for stats - this will overwrite the "Processing X files..." message
    let statsHtml = `<h3 class="border-bottom pb-2 mb-3">Statistiche Aggregate</h3>`;
    statsHtml += `<p><strong>Numero di Studenti Caricati:</strong> ${numStudents}</p>`;
    
    if (totalMaxPossibleScoreAcrossAll > 0) {
        statsHtml += `<p><strong>Punteggio Medio Complessivo (Esercizi Valutabili):</strong> ${avgScore.toFixed(1)}% 
                      (Totale: ${totalCorrectAnswersAcrossAll} / ${totalMaxPossibleScoreAcrossAll} risposte corrette)</p>`;
    } else {
        statsHtml += `<p><strong>Punteggio Medio Complessivo (Esercizi Valutabili):</strong> N/A (Nessun esercizio valutabile)</p>`;
    }
    
    if (totalPossibleAttempts > 0) {
        statsHtml += `<p><strong>Tasso Medio di Completamento Esercizi:</strong> ${avgCompletionRate.toFixed(1)}% 
                      (Totale: ${totalAttemptedExercisesAcrossAll} / ${totalPossibleAttempts} esercizi tentati)</p>`;
    } else {
        statsHtml += `<p><strong>Tasso Medio di Completamento Esercizi:</strong> N/A (Nessun esercizio trovato)</p>`;
    }

    statsHtml += `<p><strong>Numero Totale di Annotazioni Create:</strong> ${totalAnnotations}</p>`;
    statsHtml += `<p><strong>Numero Totale di Riassunti Creati:</strong> ${totalSummaries}</p>`;
    
    container.innerHTML = statsHtml;
}


// Function to populate the exercise selector
function populateExerciseSelector(studentDataArray) {
    const selector = document.getElementById('exercise-question-selector');
    if (!selector) {
        console.error("Select per domande esercizi non trovato.");
        return;
    }
    selector.innerHTML = ''; 
    uniqueExercisesMap.clear(); 

    if (!studentDataArray || studentDataArray.length === 0) {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Nessun dato caricato";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        selector.appendChild(defaultOption);
        // Ensure display is cleared if no data
        displayAggregatedExerciseResponses("", [], new Map());
        return;
    }

    studentDataArray.forEach(student => {
        (Array.isArray(student.elementi_lezione) ? student.elementi_lezione : []).forEach(element => {
            if (element && typeof element.tipo === 'string' && element.tipo.startsWith('esercizio_') && element.id) {
                if (!uniqueExercisesMap.has(element.id)) {
                    uniqueExercisesMap.set(element.id, element);
                } else {
                    const existingExercise = uniqueExercisesMap.get(element.id);
                    if (!existingExercise.risposta_corretta && element.risposta_corretta) {
                        uniqueExercisesMap.set(element.id, element);
                    }
                }
            }
        });
    });

    if (uniqueExercisesMap.size === 0) {
        const noExercisesOption = document.createElement('option');
        noExercisesOption.value = "";
        noExercisesOption.textContent = "Nessun esercizio disponibile";
        noExercisesOption.disabled = true;
        noExercisesOption.selected = true;
        selector.appendChild(noExercisesOption);
    } else {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Seleziona una domanda...";
        defaultOption.selected = true;
        selector.appendChild(defaultOption);

        uniqueExercisesMap.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.id;
            option.textContent = exercise.testo_domanda || `Esercizio ID: ${exercise.id}`;
            selector.appendChild(option);
        });
    }
    const initialSelectedId = selector.value;
    displayAggregatedExerciseResponses(initialSelectedId, allStudentData, uniqueExercisesMap);
}

// Function to display aggregated responses for a selected exercise
function displayAggregatedExerciseResponses(exerciseId, studentDataArray, exercisesMap) {
    const container = document.getElementById('selected-exercise-answers-container');
    if (!container) {
        console.error("Contenitore per risposte aggregate esercizi non trovato.");
        return;
    }
    container.innerHTML = ''; 

    if (!exerciseId) {
        container.innerHTML = '<p class="text-muted">Seleziona una domanda per vedere le risposte aggregate.</p>';
        return;
    }

    const selectedExercise = exercisesMap.get(exerciseId);
    if (!selectedExercise) {
        container.innerHTML = '<p class="text-danger">Dettagli esercizio non trovati.</p>';
        return;
    }

    const questionHeader = document.createElement('h4');
    questionHeader.className = 'mb-3';
    questionHeader.innerHTML = `Domanda: <em>${selectedExercise.testo_domanda || 'N/D'}</em>`;
    container.appendChild(questionHeader);

    if (selectedExercise.risposta_corretta !== undefined) {
        const correctAnswerP = document.createElement('p');
        correctAnswerP.innerHTML = `<strong>Risposta Corretta:</strong> ${Array.isArray(selectedExercise.risposta_corretta) ? selectedExercise.risposta_corretta.join(', ') : selectedExercise.risposta_corretta}`;
        container.appendChild(correctAnswerP);
    }


    let totalAnswers = 0;
    let correctAnswersCount = 0;
    const answerDistribution = {}; 
    const openAnswersList = document.createElement('ul');
    openAnswersList.className = 'list-group list-group-flush mb-3';


    studentDataArray.forEach(student => {
        const studentInfo = student.info_studente || {};
        const studentName = `${studentInfo.nome || "N/D"} ${studentInfo.cognome || ""}`.trim();
        const userAnswer = student.risposte_utente ? student.risposte_utente[exerciseId] : undefined;

        if (userAnswer !== undefined && userAnswer !== null && ( (typeof userAnswer === 'string' && userAnswer.trim() !== '') || Array.isArray(userAnswer) || typeof userAnswer === 'number' || typeof userAnswer === 'boolean') ) {
            totalAnswers++;
            
            const answerItem = document.createElement('li');
            answerItem.className = 'list-group-item d-flex justify-content-between align-items-start';
            
            let answerDisplay = Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer.toString();
            answerItem.innerHTML = `<span><strong>${studentName}:</strong> ${answerDisplay}</span>`;

            if (selectedExercise.risposta_corretta !== undefined) {
                let isCorrect = false;
                const correctAnswer = selectedExercise.risposta_corretta;
                if (Array.isArray(correctAnswer)) {
                    isCorrect = JSON.stringify((userAnswer || []).slice().sort()) === JSON.stringify(correctAnswer.slice().sort());
                } else {
                    isCorrect = userAnswer === correctAnswer;
                }
                if (isCorrect) {
                    correctAnswersCount++;
                    answerItem.innerHTML += '<span class="badge bg-success rounded-pill ms-2">Corretta</span>';
                } else {
                    answerItem.innerHTML += '<span class="badge bg-danger rounded-pill ms-2">Errata</span>';
                }
            }
            openAnswersList.appendChild(answerItem);

            if (selectedExercise.opzioni || selectedExercise.tipo === 'esercizio_vero_falso') {
                const answerKey = Array.isArray(userAnswer) ? userAnswer.join('|') : userAnswer.toString();
                answerDistribution[answerKey] = (answerDistribution[answerKey] || 0) + 1;
            }

        } else {
             const noAnswerItem = document.createElement('li');
             noAnswerItem.className = 'list-group-item text-muted';
             noAnswerItem.textContent = `${studentName}: Nessuna risposta fornita.`;
             openAnswersList.appendChild(noAnswerItem);
        }
    });
    
    if (openAnswersList.hasChildNodes()) {
        container.appendChild(openAnswersList);
    }

    const statsDiv = document.createElement('div');
    statsDiv.className = 'mt-3 p-2 border-top';
    if (totalAnswers > 0 && selectedExercise.risposta_corretta !== undefined) {
        const percentage = totalAnswers > 0 ? ((correctAnswersCount / totalAnswers) * 100).toFixed(1) : 0;
        statsDiv.innerHTML += `<p><strong>Correttezza Generale:</strong> ${correctAnswersCount} / ${totalAnswers} (${percentage}%)</p>`;
    } else if (selectedExercise.risposta_corretta === undefined && totalAnswers > 0) {
         statsDiv.innerHTML += `<p>Questo è un esercizio a risposta aperta, non valutato automaticamente. ${totalAnswers} studenti hanno risposto.</p>`;
    }

    if ((selectedExercise.opzioni || selectedExercise.tipo === 'esercizio_vero_falso') && totalAnswers > 0) {
        let distributionHtml = '<h5>Distribuzione Risposte:</h5><ul class="list-group">';
        let optionsForDistribution = selectedExercise.opzioni;
        if (selectedExercise.tipo === 'esercizio_vero_falso') {
            optionsForDistribution = ["Vero", "Falso"]; // Display keys
        }

        if (optionsForDistribution) {
            optionsForDistribution.forEach(option => {
                // Check for boolean true/false and map to "Vero"/"Falso" string keys from answerDistribution
                let count = 0;
                if (selectedExercise.tipo === 'esercizio_vero_falso') {
                    if (option === "Vero") {
                        count = answerDistribution["true"] || 0;
                    } else if (option === "Falso") {
                        count = answerDistribution["false"] || 0;
                    }
                } else {
                     count = answerDistribution[option.toString()] || 0;
                }
                distributionHtml += `<li class="list-group-item d-flex justify-content-between align-items-center">${option}: <span class="badge bg-primary rounded-pill">${count}</span></li>`;
            });
        }
        
        // Display any other answers that might not be in predefined options (e.g. from free text if type was mixed)
        for(const ansKey in answerDistribution){
            let isStandardOption = false;
            if (optionsForDistribution) {
                 isStandardOption = optionsForDistribution.some(opt => opt.toString() === ansKey);
                 if (selectedExercise.tipo === 'esercizio_vero_falso') {
                    if ((ansKey === "true" && optionsForDistribution.includes("Vero")) || (ansKey === "false" && optionsForDistribution.includes("Falso"))) {
                        isStandardOption = true;
                    }
                 }
            }
            if(!isStandardOption){
                 distributionHtml += `<li class="list-group-item d-flex justify-content-between align-items-center"><em>${ansKey}</em> (non standard): <span class="badge bg-secondary rounded-pill">${answerDistribution[ansKey]}</span></li>`;
            }
        }
        distributionHtml += '</ul>';
        statsDiv.innerHTML += distributionHtml;
    }
    
    if (statsDiv.hasChildNodes()) {
        container.appendChild(statsDiv);
    }

    if (totalAnswers === 0) {
        container.appendChild(document.createTextNode("Nessuno studente ha risposto a questa domanda."));
    }
}

// (Keep other functions: displayAggregatedAnnotations, displayAggregatedSummaries, displayStudentSummaries)
function displayAggregatedAnnotations(studentDataArray) {
    const container = document.getElementById('aggregated-annotations-view');
    if (!container) {
        console.error("Contenitore vista aggregata annotazioni non trovato.");
        return;
    }
    container.innerHTML = ''; 

    if (!studentDataArray || studentDataArray.length === 0) {
        container.innerHTML = '<p class="text-muted">Nessun dato studente caricato per visualizzare le annotazioni.</p>';
        return;
    }

    let foundAnnotations = false;
    const accordion = document.createElement('div');
    accordion.className = 'accordion';
    let accordionIdCounter = 0;

    studentDataArray.forEach(student => {
        const studentInfo = student.info_studente || {};
        const studentName = `${studentInfo.nome || "N/D"} ${studentInfo.cognome || ""}`.trim();
        const annotations = Array.isArray(student.annotazioni_utente) ? student.annotazioni_utente : [];

        if (annotations.length > 0) {
            foundAnnotations = true;
            
            annotations.forEach(annotation => {
                accordionIdCounter++;
                const accordionItem = document.createElement('div');
                accordionItem.className = 'accordion-item';

                const headerId = `annH-${accordionIdCounter}`;
                const collapseId = `annC-${accordionIdCounter}`;

                const header = document.createElement('h2');
                header.className = 'accordion-header';
                header.id = headerId;
                header.innerHTML = `
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                        <strong>${annotation.tipo_annotazione || 'Annotazione'}</strong> su "${(annotation.testo_riferimento || "N/A").substring(0, 50)}..." (<em>Studente: ${studentName}</em>)
                    </button>`;
                
                const collapseDiv = document.createElement('div');
                collapseDiv.id = collapseId;
                collapseDiv.className = 'accordion-collapse collapse';
                collapseDiv.setAttribute('aria-labelledby', headerId);

                const body = document.createElement('div');
                body.className = 'accordion-body';
                body.innerHTML = `
                    <p>${(annotation.contenuto_annotazione || "Nessun contenuto.").replace(/\n/g, '<br>')}</p>
                    <hr>
                    <small class="text-muted">Testo di riferimento: <em>"${annotation.testo_riferimento || "N/A"}"</em></small><br>
                    <small class="text-muted">ID Elemento: ${annotation.riferimento_elemento_id || "N/A"}</small>`;
                
                collapseDiv.appendChild(body);
                accordionItem.appendChild(header);
                accordionItem.appendChild(collapseDiv);
                accordion.appendChild(accordionItem);
            });
        }
    });
    
    if (accordion.hasChildNodes()) {
        container.appendChild(accordion);
    }

    if (!foundAnnotations) {
        container.innerHTML = '<p class="text-muted">Nessuna annotazione trovata nei file caricati.</p>';
    }
}

function displayAggregatedSummaries(studentDataArray) {
    const container = document.getElementById('aggregated-summaries-view');
    if (!container) {
        console.error("Contenitore vista aggregata riassunti non trovato.");
        return;
    }
    container.innerHTML = ''; 

    if (!studentDataArray || studentDataArray.length === 0) {
        container.innerHTML = '<p class="text-muted">Nessun dato studente caricato per visualizzare i riassunti.</p>';
        return;
    }

    let foundSummaries = false;
    const listGroup = document.createElement('div');
    listGroup.className = 'list-group';

    studentDataArray.forEach(student => {
        const studentInfo = student.info_studente || {};
        const studentName = `${studentInfo.nome || "N/D"} ${studentInfo.cognome || ""}`.trim();
        const summaries = Array.isArray(student.riassunti_utente) ? student.riassunti_utente : [];

        if (summaries.length > 0) {
            foundSummaries = true;
            summaries.forEach(summary => {
                const summaryItem = document.createElement('div');
                summaryItem.className = 'list-group-item mb-3';
                
                const summaryHeader = document.createElement('h5');
                summaryHeader.className = 'mb-1';
                summaryHeader.textContent = `Riassunto di ${studentName}`;
                
                const summaryContent = document.createElement('p');
                summaryContent.className = 'mb-1';
                summaryContent.innerHTML = (summary.contenuto_riassunto || "Nessun contenuto.").replace(/\n/g, '<br>');
                
                summaryItem.appendChild(summaryHeader);
                summaryItem.appendChild(summaryContent);
                listGroup.appendChild(summaryItem);
            });
        }
    });

    if (listGroup.hasChildNodes()) {
         container.appendChild(listGroup);
    }

    if (!foundSummaries) {
        container.innerHTML = '<p class="text-muted">Nessun riassunto trovato nei file caricati.</p>';
    }
}

function displayStudentSummaries(studentDataArray) {
    const container = document.getElementById('student-summary-table-container');
    if (!container) {
        console.error("Contenitore riepilogo studenti non trovato.");
        return;
    }
    container.innerHTML = ''; 

    if (!studentDataArray || studentDataArray.length === 0) {
        container.innerHTML = '<p class="text-muted">Nessun dato studente caricato o valido.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'table table-striped table-hover table-sm caption-top'; 
    
    const caption = table.createCaption();
    caption.textContent = `Riepilogo di ${studentDataArray.length} studenti`;

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const headers = [
        "Nome Studente", "Lezione", "Annotazioni", 
        "Riassunti", "Esercizi Tentati", "Punteggio Esercizi"
    ];
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    studentDataArray.forEach(data => {
        const row = tbody.insertRow();

        const studentInfo = data.info_studente || {};
        const studentName = `${studentInfo.nome || "N/D"} ${studentInfo.cognome || ""}`.trim();
        const lessonTitle = data.titolo_lezione || "N/D";

        row.insertCell().textContent = studentName;
        row.insertCell().textContent = lessonTitle;

        const annotationsCount = (Array.isArray(data.annotazioni_utente) ? data.annotazioni_utente : []).length;
        const summariesCount = (Array.isArray(data.riassunti_utente) ? data.riassunti_utente : []).length;
        row.insertCell().textContent = annotationsCount;
        row.insertCell().textContent = summariesCount;

        const allExercises = (Array.isArray(data.elementi_lezione) ? data.elementi_lezione : []).filter(el => el && typeof el.tipo === 'string' && el.tipo.startsWith('esercizio_'));
        const totalExercisesCount = allExercises.length;
        
        let attemptedExercisesCount = 0;
        let correctAnswersCount = 0;
        let maxPossibleScore = 0;

        allExercises.forEach(exercise => {
            const exerciseId = exercise.id;
            const userAnswer = data.risposte_utente ? data.risposte_utente[exerciseId] : undefined;

            if (exercise.risposta_corretta !== undefined) { 
                maxPossibleScore++;
                if (userAnswer !== undefined && userAnswer !== null && (typeof userAnswer !== 'string' || userAnswer.trim() !== '')) {
                    attemptedExercisesCount++;
                    let isCorrect = false;
                    const correctAnswer = exercise.risposta_corretta;
                    if (Array.isArray(correctAnswer)) {
                        isCorrect = JSON.stringify((userAnswer || []).slice().sort()) === JSON.stringify(correctAnswer.slice().sort());
                    } else {
                        isCorrect = userAnswer === correctAnswer;
                    }
                    if (isCorrect) {
                        correctAnswersCount++;
                    }
                }
            } else { 
                if (userAnswer !== undefined && userAnswer !== null && (typeof userAnswer !== 'string' || userAnswer.trim() !== '')) {
                    attemptedExercisesCount++;
                }
            }
        });
        
        row.insertCell().textContent = `${attemptedExercisesCount} / ${totalExercisesCount}`;
        row.insertCell().textContent = maxPossibleScore > 0 ? `${correctAnswersCount} / ${maxPossibleScore}` : "N/A";
    });

    container.appendChild(table);
}


document.addEventListener('DOMContentLoaded', () => {
    console.log("docente.js loaded");

    const studentJsonFilesInput = document.getElementById('student-json-files');
    const loadFilesBtn = document.getElementById('load-files-btn');
    const overallStatsContainer = document.getElementById('overall-stats-container');
    const exerciseQuestionSelector = document.getElementById('exercise-question-selector');

    if(exerciseQuestionSelector) {
        exerciseQuestionSelector.addEventListener('change', (event) => {
            const selectedExerciseId = event.target.value;
            displayAggregatedExerciseResponses(selectedExerciseId, allStudentData, uniqueExercisesMap);
        });
    }


    if (loadFilesBtn) {
        loadFilesBtn.addEventListener('click', () => {
            allStudentData = []; 
            const files = studentJsonFilesInput.files;

            // Clear all views immediately
            displayStudentSummaries(allStudentData); 
            displayAggregatedAnnotations(allStudentData);
            displayAggregatedSummaries(allStudentData);
            populateExerciseSelector(allStudentData); 
            displayOverallStatistics(allStudentData, uniqueExercisesMap); // Clear/update overall stats


            if (!files || files.length === 0) {
                alert("Nessun file selezionato.");
                // overallStatsContainer already handled by displayOverallStatistics
                // Views already cleared above
                return;
            }

            let filesProcessed = 0;
            let successfulParses = 0;
            let failedParses = 0;

            // Initial message in overallStatsContainer
            if (overallStatsContainer) {
                // Create a specific element for this message so displayOverallStatistics can remove it reliably
                let statusMsg = document.getElementById('file-processing-status-message');
                if (!statusMsg) {
                    statusMsg = document.createElement('p');
                    statusMsg.id = 'file-processing-status-message';
                    overallStatsContainer.prepend(statusMsg); // Prepend to allow other messages to be cleared
                }
                statusMsg.className = 'text-info';
                statusMsg.textContent = `Caricamento di ${files.length} file in corso...`;
            }
            
            let loadedFilesList = document.getElementById('loaded-files-feedback');
            if (!loadedFilesList) {
                loadedFilesList = document.createElement('ul');
                loadedFilesList.id = 'loaded-files-feedback';
                loadedFilesList.classList.add('list-group', 'mt-2', 'mb-2');
                const fileInputSection = document.getElementById('file-input-section');
                if(fileInputSection) fileInputSection.appendChild(loadedFilesList);
            }
            loadedFilesList.innerHTML = ''; 

            Array.from(files).forEach(file => {
                const reader = new FileReader();

                reader.onload = (e) => {
                    try {
                        const parsedData = JSON.parse(e.target.result);
                        allStudentData.push(parsedData);
                        successfulParses++;
                        
                        const listItem = document.createElement('li');
                        listItem.classList.add('list-group-item', 'list-group-item-success', 'list-group-item-sm');
                        const studentInfo = parsedData.info_studente || {};
                        const studentName = `${studentInfo.nome || 'N/A'} ${studentInfo.cognome || ''}`.trim();
                        listItem.textContent = `File caricato: ${file.name} (Studente: ${studentName}, Lezione: ${parsedData.titolo_lezione || 'N/A'})`;
                        if(loadedFilesList) loadedFilesList.appendChild(listItem);

                        console.log(`Parsed ${file.name} successfully.`);
                    } catch (error) {
                        failedParses++;
                        console.error(`Errore nel parsing del file ${file.name}:`, error);
                        const listItem = document.createElement('li');
                        listItem.classList.add('list-group-item', 'list-group-item-danger', 'list-group-item-sm');
                        listItem.textContent = `Errore caricamento file: ${file.name} - ${error.message}`;
                        if(loadedFilesList) loadedFilesList.appendChild(listItem);
                    }
                    
                    filesProcessed++;
                    if (filesProcessed === files.length) {
                        console.log("Tutti i file sono stati processati.");
                        console.log("Dati aggregati:", allStudentData);
                        
                        // The "Processed X files..." message is now part of displayOverallStatistics
                        // or handled by it if data is empty.
                        
                        // Update all displays
                        displayStudentSummaries(allStudentData);
                        displayAggregatedAnnotations(allStudentData);
                        displayAggregatedSummaries(allStudentData);
                        populateExerciseSelector(allStudentData); 
                        displayOverallStatistics(allStudentData, uniqueExercisesMap); 

                        // Add a final status to the loaded files list if needed
                        if (loadedFilesList && files.length > 0) {
                            const summaryItem = document.createElement('li');
                            summaryItem.className = 'list-group-item list-group-item-info';
                            summaryItem.textContent = `Totale: ${successfulParses} file caricati con successo, ${failedParses} falliti.`;
                            loadedFilesList.appendChild(summaryItem);
                        }
                    }
                };

                reader.onerror = () => {
                    failedParses++;
                    console.error(`Errore nella lettura del file ${file.name}:`, reader.error);
                    const listItem = document.createElement('li');
                    listItem.classList.add('list-group-item', 'list-group-item-danger', 'list-group-item-sm');
                    listItem.textContent = `Errore lettura file: ${file.name}`;
                    if(loadedFilesList) loadedFilesList.appendChild(listItem);

                    filesProcessed++;
                    if (filesProcessed === files.length) {
                        console.log("Tutti i file sono stati processati (con errori di lettura).");
                        console.log("Dati aggregati (parziali):", allStudentData);
                        
                        // Update all displays
                        displayStudentSummaries(allStudentData);
                        displayAggregatedAnnotations(allStudentData);
                        displayAggregatedSummaries(allStudentData);
                        populateExerciseSelector(allStudentData);
                        displayOverallStatistics(allStudentData, uniqueExercisesMap);

                        if (loadedFilesList && files.length > 0) {
                            const summaryItem = document.createElement('li');
                            summaryItem.className = 'list-group-item list-group-item-info';
                            summaryItem.textContent = `Totale: ${successfulParses} file caricati con successo, ${failedParses} falliti (inclusi errori di lettura).`;
                            loadedFilesList.appendChild(summaryItem);
                        }
                    }
                };

                reader.readAsText(file);
            });
        });
    }
});
