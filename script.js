let currentLessonData = null;

document.addEventListener('DOMContentLoaded', () => {
    const jsonFileInput = document.getElementById('jsonFileInput');
    const lessonTitleElement = document.getElementById('lessonTitle');
    const lessonSectionsElement = document.getElementById('lessonSections');
    const overallNotesElement = document.getElementById('overallNotes');
    const downloadButton = document.getElementById('downloadButton');

    if (jsonFileInput) {
        jsonFileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        currentLessonData = JSON.parse(e.target.result);
                        if (typeof currentLessonData !== 'object' || currentLessonData === null) {
                            throw new Error("Parsed JSON is not an object.");
                        }
                        renderLesson(currentLessonData);
                    } catch (error) {
                        console.error('Error parsing JSON file:', error);
                        alert('Error parsing JSON file: ' + error.message + '. Please check the console for details.');
                        currentLessonData = null; // Reset data on error
                        // Clear the UI
                        if(lessonTitleElement) lessonTitleElement.textContent = '';
                        if(lessonSectionsElement) lessonSectionsElement.innerHTML = '';
                        if(overallNotesElement) overallNotesElement.value = '';
                    }
                };
                reader.onerror = function() {
                    console.error('Error reading file:', reader.error);
                    alert('Error reading file.');
                    currentLessonData = null;
                     if(lessonTitleElement) lessonTitleElement.textContent = '';
                     if(lessonSectionsElement) lessonSectionsElement.innerHTML = '';
                     if(overallNotesElement) overallNotesElement.value = '';
                };
                reader.readAsText(file);
            }
        });
    } else {
        console.error('File input element #jsonFileInput not found.');
    }

    if (overallNotesElement) {
        overallNotesElement.addEventListener('input', function(event) {
            if (currentLessonData) {
                currentLessonData.overallNotes = event.target.value;
            }
        });
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            if (!currentLessonData) {
                alert('Please load a lesson file first.');
                return;
            }

            try {
                const jsonString = JSON.stringify(currentLessonData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const fileName = (currentLessonData.lessonTitle || 'lesson').replace(/\s+/g, '_') + '_updated.json';
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error during download preparation:', error);
                alert('Failed to prepare download: ' + error.message);
            }
        });
    } else {
        console.error('Download button element #downloadButton not found.');
    }
});

function renderLesson(data) {
    const lessonTitleElement = document.getElementById('lessonTitle');
    const lessonSectionsElement = document.getElementById('lessonSections');
    const overallNotesElement = document.getElementById('overallNotes');

    if (!lessonTitleElement || !lessonSectionsElement || !overallNotesElement) {
        console.error('One or more main lesson elements are missing from the DOM.');
        return;
    }

    lessonTitleElement.textContent = data.lessonTitle || 'Untitled Lesson';
    lessonSectionsElement.innerHTML = ''; // Clear previous sections

    if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach((section, index) => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'lesson-section';
            sectionDiv.dataset.sectionIndex = index;

            const sectionTitle = document.createElement('h3');
            sectionTitle.textContent = section.title || `Section ${index + 1}`;
            sectionDiv.appendChild(sectionTitle);

            if (section.type === 'text') {
                const contentDiv = document.createElement('div');
                contentDiv.className = 'section-content';
                contentDiv.innerHTML = section.content || '<p>No content.</p>';
                sectionDiv.appendChild(contentDiv);

                const notesTextarea = document.createElement('textarea');
                notesTextarea.placeholder = 'Your notes for this section...';
                notesTextarea.value = section.notes || '';
                notesTextarea.dataset.sectionIndex = index;
                notesTextarea.className = 'section-notes';
                notesTextarea.addEventListener('input', (event) => {
                    if (currentLessonData && currentLessonData.sections[index]) {
                        currentLessonData.sections[index].notes = event.target.value;
                    }
                });
                sectionDiv.appendChild(notesTextarea);

            } else if (section.type === 'exercise') {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'exercise-question';
                questionDiv.textContent = section.question || 'No question provided.';
                sectionDiv.appendChild(questionDiv);

                if (section.exerciseType === 'multiple-choice') {
                    const optionsDiv = document.createElement('div');
                    optionsDiv.className = 'options-container';
                    if (section.options && Array.isArray(section.options)) {
                        section.options.forEach((option, optionIndex) => {
                            const optionContainer = document.createElement('div');
                            optionContainer.className = 'option';

                            const radio = document.createElement('input');
                            radio.type = 'radio';
                            radio.name = `mcq_section_${index}`;
                            radio.value = optionIndex;
                            radio.id = `mcq_section_${index}_option_${optionIndex}`;
                            if (section.userAnswer !== null && parseInt(section.userAnswer, 10) === optionIndex) {
                                radio.checked = true;
                            }
                            radio.addEventListener('change', (event) => {
                                if (currentLessonData && currentLessonData.sections[index]) {
                                    currentLessonData.sections[index].userAnswer = parseInt(event.target.value, 10);
                                }
                            });
                            optionContainer.appendChild(radio);

                            const label = document.createElement('label');
                            label.htmlFor = radio.id;
                            label.textContent = option.text || `Option ${optionIndex + 1}`;
                            optionContainer.appendChild(label);
                            optionsDiv.appendChild(optionContainer);
                        });
                    } else {
                        optionsDiv.textContent = 'No options provided for this multiple-choice question.';
                    }
                    sectionDiv.appendChild(optionsDiv);

                } else if (section.exerciseType === 'fill-in-the-blanks') {
                    const blanksDiv = document.createElement('div');
                    blanksDiv.className = 'blanks-container';
                    let questionTextWithPlaceholders = section.question || '';
                    // This part is for display only, actual inputs are separate
                    if (section.blanks && Array.isArray(section.blanks)) {
                         section.blanks.forEach((blank, blankIdx) => {
                            // Improve placeholder uniqueness if IDs are not guaranteed
                            const placeholder = `__BLANK_${blank.id || blankIdx}__`;
                            questionTextWithPlaceholders = questionTextWithPlaceholders.replace('_________', placeholder);
                        });
                    }
                    const questionParagraph = document.createElement('p');
                    questionParagraph.textContent = questionTextWithPlaceholders; // Show question with placeholders
                    blanksDiv.appendChild(questionParagraph);


                    if (section.blanks && Array.isArray(section.blanks)) {
                        section.blanks.forEach((blank, blankIndex) => {
                            const blankWrapper = document.createElement('div');
                            blankWrapper.className = 'blank-wrapper';

                            const blankLabel = document.createElement('label');
                            const labelText = `Blank ${blank.id || blankIndex + 1}: `;
                            blankLabel.textContent = labelText;
                            const inputId = `blank_section_${index}_${blank.id || blankIndex}`;
                            blankLabel.htmlFor = inputId;
                            blankWrapper.appendChild(blankLabel);

                            const blankInput = document.createElement('input');
                            blankInput.type = 'text';
                            blankInput.id = inputId;
                            blankInput.value = blank.userAnswer || '';
                            blankInput.dataset.sectionIndex = index;
                            // Store the original blank ID if available, otherwise use index for mapping.
                            blankInput.dataset.blankIdentifier = blank.id || blankIndex;
                            blankInput.className = 'blank-input';

                            blankInput.addEventListener('input', (event) => {
                                const currentSectionIndex = parseInt(event.target.dataset.sectionIndex, 10);
                                const currentBlankIdentifier = event.target.dataset.blankIdentifier;
                                
                                if (currentLessonData && currentLessonData.sections[currentSectionIndex] && currentLessonData.sections[currentSectionIndex].blanks) {
                                    const targetBlank = currentLessonData.sections[currentSectionIndex].blanks.find(b => (b.id && b.id === currentBlankIdentifier) || currentLessonData.sections[currentSectionIndex].blanks.indexOf(b) === parseInt(currentBlankIdentifier,10) );
                                    if (targetBlank) {
                                        targetBlank.userAnswer = event.target.value;
                                    } else {
                                        // Fallback if ID based find fails, try index if identifier is numeric
                                        const blankIdx = parseInt(currentBlankIdentifier, 10);
                                        if (!isNaN(blankIdx) && currentLessonData.sections[currentSectionIndex].blanks[blankIdx]) {
                                           currentLessonData.sections[currentSectionIndex].blanks[blankIdx].userAnswer = event.target.value;
                                        }
                                    }
                                }
                            });
                            blankWrapper.appendChild(blankInput);
                            blanksDiv.appendChild(blankWrapper);
                        });
                    } else {
                        blanksDiv.textContent = 'No blanks provided for this exercise.';
                    }
                    sectionDiv.appendChild(blanksDiv);
                }

                const exerciseNotesTextarea = document.createElement('textarea');
                exerciseNotesTextarea.placeholder = 'Your notes for this exercise...';
                exerciseNotesTextarea.value = section.notes || '';
                exerciseNotesTextarea.dataset.sectionIndex = index;
                exerciseNotesTextarea.className = 'section-notes exercise-notes';
                exerciseNotesTextarea.addEventListener('input', (event) => {
                    if (currentLessonData && currentLessonData.sections[index]) {
                        // It's an exercise, so notes are on the section level.
                        currentLessonData.sections[index].notes = event.target.value;
                    }
                });
                sectionDiv.appendChild(exerciseNotesTextarea);
            }
            lessonSectionsElement.appendChild(sectionDiv);
        });
    }

    if(overallNotesElement && data.overallNotes !== undefined) {
      overallNotesElement.value = data.overallNotes || '';
    }
}
