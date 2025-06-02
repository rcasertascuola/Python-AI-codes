document.addEventListener('DOMContentLoaded', () => {
    // Stato dell'applicazione
    let currentLessonData = null;
    let appSettings = {
        colori: {
            primary: '#343a40',   // Navbar bg-dark
            secondary: '#6c757d', // btn-secondary
            background: '#f0f2f5',// Sfondo app
            text: '#212529',     // Testo standard
            highlight: '#fff352'  // Giallo più leggibile per evidenziazione
        }
    };
    let selectedTextInfo = null;
    let correctionsVisible = false;

    // Riferimenti DOM
    const mainNavbar = document.getElementById('main-navbar');
    const lessonTitleBrand = document.getElementById('lesson-title-brand');
    const lessonMainTitleDisplay = document.getElementById('lesson-main-title-display');
    const studentNameEl = document.getElementById('student-name');
    const studentSurnameEl = document.getElementById('student-surname');
    const studentClassEl = document.getElementById('student-class');
    const studentDateEl = document.getElementById('student-date');
    const jsonLessonFileInput = document.getElementById('json-lesson-file-input');
    const loadLessonBtn = document.getElementById('load-lesson-btn');
    const saveLessonBtn = document.getElementById('save-lesson-btn');
    const printPdfBtn = document.getElementById('print-pdf-btn');
    const lessonElementsContainer = document.getElementById('lesson-elements-container');
    const printHeaderArea = document.getElementById('print-header-area');
    
    // Riferimenti DOM Sidebar Desktop
    const annotationsListDesktopEl = document.getElementById('annotations-list-desktop');
    const summaryEditorDesktopEl = document.getElementById('summary-editor-desktop');
    const saveSummaryBtnDesktopEl = document.getElementById('save-summary-btn-desktop');
    const summariesListDesktopEl = document.getElementById('summaries-list-desktop');
    const toggleCorrectionsBtnDesktopEl = document.getElementById('toggle-corrections-btn-desktop');
    const exerciseResponsesContainerDesktopEl = document.getElementById('exercise-responses-container-desktop');

    // Riferimenti DOM Sidebar Mobile (Offcanvas)
    const annotationsListMobileEl = document.getElementById('annotations-list-mobile');
    const summaryEditorMobileEl = document.getElementById('summary-editor-mobile');
    const saveSummaryBtnMobileEl = document.getElementById('save-summary-btn-mobile');
    const summariesListMobileEl = document.getElementById('summaries-list-mobile');
    const toggleCorrectionsBtnMobileEl = document.getElementById('toggle-corrections-btn-mobile');
    const exerciseResponsesContainerMobileEl = document.getElementById('exercise-responses-container-mobile');
    
    let annotationBsModal = document.getElementById('annotationModal') ? new bootstrap.Modal(document.getElementById('annotationModal')) : null;
    const selectedTextPreviewEl = document.getElementById('selected-text-preview');
    const annotationTextEl = document.getElementById('annotation-text');
    const annotationTypeEl = document.getElementById('annotation-type');
    const saveAnnotationBtn = document.getElementById('save-annotation-btn');
    
    const textSelectionMenu = document.getElementById('text-selection-menu');
    const highlightTextBtn = document.getElementById('highlight-text-btn');
    const annotateTextBtnCtx = document.getElementById('annotate-text-btn-ctx');

    let settingsBsModal = document.getElementById('settingsModal') ? new bootstrap.Modal(document.getElementById('settingsModal')) : null;
    const primaryColorPicker = document.getElementById('primary-color-picker');
    const secondaryColorPicker = document.getElementById('secondary-color-picker');
    const backgroundColorPicker = document.getElementById('background-color-picker');
    const textColorPicker = document.getElementById('text-color-picker');
    const highlightColorPicker = document.getElementById('highlight-color-picker');
    // CORREZIONE ID: Assicurati che questi ID corrispondano a quelli nell'HTML
    const applyColorsBtn = document.getElementById('apply-colors-btn'); 
    const resetColorsBtn = document.getElementById('reset-colors-btn');

    // --- Funzioni di Inizializzazione e Gestione Impostazioni ---
    function initializeApp() {
        if(studentDateEl) studentDateEl.valueAsDate = new Date();
        loadSettingsFromLocalStorage();
        setupEventListeners();
        updateUIAfterLoad(); 
    }

    function loadSettingsFromLocalStorage() {
        const storedSettings = localStorage.getItem('studioAppSettings');
        if (storedSettings) {
            try {
                const parsedSettings = JSON.parse(storedSettings);
                if (parsedSettings.colori) {
                     appSettings.colori = { ...appSettings.colori, ...parsedSettings.colori };
                }
            } catch (e) { console.error("Errore parsing impostazioni localStorage:", e); }
        }
        applyCustomColors(appSettings.colori);
    }

    function saveSettingsToLocalStorage() {
        try {
            localStorage.setItem('studioAppSettings', JSON.stringify(appSettings));
        } catch (e) { console.error("Errore salvataggio impostazioni localStorage:", e); }
    }
    
    function applyCustomColors(colors) {
        const root = document.documentElement.style;
        if (colors) {
            root.setProperty('--app-primary-color', colors.primary);
            root.setProperty('--app-secondary-color', colors.secondary);
            root.setProperty('--app-bg-color', colors.background);
            root.setProperty('--app-main-text-color', colors.text);
            root.setProperty('--app-highlight-bg-color', colors.highlight);
            root.setProperty('--app-highlight-text-color', getContrastYIQ(colors.highlight));
            root.setProperty('--app-lesson-viewer-bg', körperLuminance(colors.background) > 0.6 ? '#ffffff' : '#e9ecef');
            root.setProperty('--app-sidebar-bg', körperLuminance(colors.background) > 0.6 ? '#f8f9fa' : '#dee2e6');
            root.setProperty('--app-primary-text-color', getContrastYIQ(colors.primary));
            root.setProperty('--app-secondary-text-color', getContrastYIQ(colors.secondary));

            if(primaryColorPicker) primaryColorPicker.value = colors.primary;
            if(secondaryColorPicker) secondaryColorPicker.value = colors.secondary;
            if(backgroundColorPicker) backgroundColorPicker.value = colors.background;
            if(textColorPicker) textColorPicker.value = colors.text;
            if(highlightColorPicker) highlightColorPicker.value = colors.highlight;
        }
    }

    function körperLuminance(hexcolor) {
        if (!hexcolor) return 0; hexcolor = hexcolor.replace("#", "");
        if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(char => char + char).join('');
        if (hexcolor.length !== 6) return 0;
        const r = parseInt(hexcolor.substr(0,2),16) / 255;
        const g = parseInt(hexcolor.substr(2,2),16) / 255;
        const b = parseInt(hexcolor.substr(4,2),16) / 255;
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function getContrastYIQ(hexcolor){
        if (!hexcolor) return '#ffffff'; hexcolor = hexcolor.replace("#", "");
        if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(char => char + char).join('');
        if (hexcolor.length !== 6) return '#ffffff';
        const r = parseInt(hexcolor.substr(0,2),16);
        const g = parseInt(hexcolor.substr(2,2),16);
        const b = parseInt(hexcolor.substr(4,2),16);
        const yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    }
    
    // --- Setup Event Listeners ---
    function setupEventListeners() {
        const settingsModalEl = document.getElementById('settingsModal');
        if (settingsModalEl) {
            settingsModalEl.addEventListener('show.bs.modal', () => {
                if(primaryColorPicker) primaryColorPicker.value = appSettings.colori.primary;
                if(secondaryColorPicker) secondaryColorPicker.value = appSettings.colori.secondary;
                if(backgroundColorPicker) backgroundColorPicker.value = appSettings.colori.background;
                if(textColorPicker) textColorPicker.value = appSettings.colori.text;
                if(highlightColorPicker) highlightColorPicker.value = appSettings.colori.highlight;
            });
        }
        
        // Event listener per il bottone "Applica e Salva" nel modale impostazioni
        if (applyColorsBtn) { // Ora usa la variabile corretta
            applyColorsBtn.addEventListener('click', () => {
                if(primaryColorPicker) appSettings.colori.primary = primaryColorPicker.value;
                if(secondaryColorPicker) appSettings.colori.secondary = secondaryColorPicker.value;
                if(backgroundColorPicker) appSettings.colori.background = backgroundColorPicker.value;
                if(textColorPicker) appSettings.colori.text = textColorPicker.value;
                if(highlightColorPicker) appSettings.colori.highlight = highlightColorPicker.value;
                
                applyCustomColors(appSettings.colori);
                saveSettingsToLocalStorage();
                
                if(settingsBsModal) settingsBsModal.hide();
            });
        }

        if (resetColorsBtn) {
            resetColorsBtn.addEventListener('click', () => {
                appSettings.colori = {
                    primary: '#343a40', 
                    secondary: '#6c757d', 
                    background: '#f0f2f5',
                    text: '#212529', 
                    highlight: '#fff352'
                };
                applyCustomColors(appSettings.colori);
                saveSettingsToLocalStorage();
                if(settingsBsModal) settingsBsModal.hide();
            });
        }

        if (loadLessonBtn) loadLessonBtn.addEventListener('click', () => jsonLessonFileInput.click());
        if (jsonLessonFileInput) jsonLessonFileInput.addEventListener('change', handleLessonFileUpload);
        
        if(lessonElementsContainer) {
            lessonElementsContainer.addEventListener('mouseup', handleTextSelection);
            lessonElementsContainer.addEventListener('click', handleHighlightClick);
        }
        document.addEventListener('mousedown', hideTextSelectionMenuOnClickOutside);
        if(highlightTextBtn) highlightTextBtn.addEventListener('click', applyHighlightAction);
        if(annotateTextBtnCtx) annotateTextBtnCtx.addEventListener('click', openAnnotationModalAction);

        if(saveAnnotationBtn) saveAnnotationBtn.addEventListener('click', saveAnnotationAction);
        
        if(saveSummaryBtnDesktopEl) saveSummaryBtnDesktopEl.addEventListener('click', () => saveSummaryAction(summaryEditorDesktopEl));
        if(saveSummaryBtnMobileEl) saveSummaryBtnMobileEl.addEventListener('click', () => saveSummaryAction(summaryEditorMobileEl));
        
        if(saveLessonBtn) saveLessonBtn.addEventListener('click', saveLessonToFile);
        if(printPdfBtn) printPdfBtn.addEventListener('click', printToPdfAction);

        if(toggleCorrectionsBtnDesktopEl) toggleCorrectionsBtnDesktopEl.addEventListener('click', () => toggleCorrectionsAction());
        if(toggleCorrectionsBtnMobileEl) toggleCorrectionsBtnMobileEl.addEventListener('click', () => toggleCorrectionsAction());


        document.querySelectorAll('.dropdown-menu').forEach(function (element) {
            element.addEventListener('click', function (e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.tagName === 'BUTTON') {
                    e.stopPropagation();
                }
            });
        });
        const studentInfoContainer = document.getElementById('student-info-form-container');
        if (studentInfoContainer) {
            studentInfoContainer.addEventListener('click', function(event) {
                event.stopPropagation();
            });
        }
    }

    // --- Gestione Caricamento e Dati Lezione ---
    function handleLessonFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e_reader) => {
                try {
                    const fileContent = e_reader.target.result;
                    const lessonJsonData = JSON.parse(fileContent);
                    loadLesson(lessonJsonData);
                } catch (error) {
                    console.error("Errore nel parsing del JSON lezione:", error);
                    alert("Errore: Il file della lezione non è valido. Controlla la console per dettagli.");
                }
            };
             reader.onerror = () => {
                console.error("Errore durante la lettura del file.");
                alert("Errore durante la lettura del file.");
            };
            reader.readAsText(file);
        }
        if(event.target) event.target.value = null; 
    }

    function initializeLessonData(data) {
        const defaults = {
            info_studente: { nome: "", cognome: "", classe: "", data_sessione: new Date().toISOString().slice(0,10) },
            annotazioni_utente: [],
            riassunti_utente: [],
            risposte_utente: {},
            evidenziazioni_utente: [],
            elementi_lezione: []
        };
        const merged = { ...defaults, ...data };
        merged.info_studente = { ...defaults.info_studente, ...(data.info_studente || {}) };
        merged.annotazioni_utente = Array.isArray(data.annotazioni_utente) ? data.annotazioni_utente : defaults.annotazioni_utente;
        merged.riassunti_utente = Array.isArray(data.riassunti_utente) ? data.riassunti_utente : defaults.riassunti_utente;
        merged.risposte_utente = typeof data.risposte_utente === 'object' && data.risposte_utente !== null ? data.risposte_utente : defaults.risposte_utente;
        merged.evidenziazioni_utente = Array.isArray(data.evidenziazioni_utente) ? data.evidenziazioni_utente : defaults.evidenziazioni_utente;
        merged.elementi_lezione = Array.isArray(data.elementi_lezione) ? data.elementi_lezione : defaults.elementi_lezione;
        return merged;
    }

    function loadLesson(data) {
        currentLessonData = initializeLessonData(data);
        if (lessonTitleBrand) lessonTitleBrand.textContent = currentLessonData.titolo_lezione || "App Studio";
        if (lessonMainTitleDisplay) lessonMainTitleDisplay.textContent = currentLessonData.titolo_lezione || "Nessuna lezione caricata";
        
        if (studentNameEl) studentNameEl.value = currentLessonData.info_studente.nome || '';
        if (studentSurnameEl) studentSurnameEl.value = currentLessonData.info_studente.cognome || '';
        if (studentClassEl) studentClassEl.value = currentLessonData.info_studente.classe || '';
        if (studentDateEl) studentDateEl.value = currentLessonData.info_studente.data_sessione || new Date().toISOString().slice(0,10);
        
        renderLessonElements(); 
        renderAnnotations(); 
        renderSummaries(); 
        renderExercisesAndResponses();
        updateUIAfterLoad(true);
        
        correctionsVisible = false; 
        if(toggleCorrectionsBtnDesktopEl) toggleCorrectionsBtnDesktopEl.textContent = "Mostra Correzioni";
        if(toggleCorrectionsBtnMobileEl) toggleCorrectionsBtnMobileEl.textContent = "Mostra Correzioni";
        clearCorrectionsDisplay(exerciseResponsesContainerDesktopEl);
        clearCorrectionsDisplay(exerciseResponsesContainerMobileEl);
    }

    function updateUIAfterLoad(lessonLoaded = false) {
        const mainPlaceholder = lessonElementsContainer ? lessonElementsContainer.querySelector('.placeholder') : null;
        
        const initialAnnotationText = '<p class="text-muted small">Nessuna annotazione ancora.</p>';
        const initialSummaryText = '<p class="text-muted small">Nessun riassunto ancora.</p>';
        const initialExerciseText = '<p class="text-muted small">Nessun esercizio da visualizzare.</p>';

        if (lessonLoaded) {
            if (mainPlaceholder) mainPlaceholder.style.display = 'none';
        } else {
            if (lessonElementsContainer) lessonElementsContainer.innerHTML = '<p class="placeholder text-muted">Clicca \'Carica Lezione\' per iniziare lo studio.</p>';
            
            if (annotationsListDesktopEl) annotationsListDesktopEl.innerHTML = initialAnnotationText;
            if (annotationsListMobileEl) annotationsListMobileEl.innerHTML = initialAnnotationText;
            
            if (summariesListDesktopEl) summariesListDesktopEl.innerHTML = initialSummaryText;
            if (summariesListMobileEl) summariesListMobileEl.innerHTML = initialSummaryText;
            
            if (exerciseResponsesContainerDesktopEl) exerciseResponsesContainerDesktopEl.innerHTML = initialExerciseText;
            if (exerciseResponsesContainerMobileEl) exerciseResponsesContainerMobileEl.innerHTML = initialExerciseText;

            if (lessonTitleBrand) lessonTitleBrand.textContent = "App Studio";
            if (lessonMainTitleDisplay) lessonMainTitleDisplay.textContent = "Nessuna lezione caricata";
        }
    }

    function renderLessonElements() { 
        if (!lessonElementsContainer) return;
        lessonElementsContainer.innerHTML = ''; 
        if (!currentLessonData || !currentLessonData.elementi_lezione || !Array.isArray(currentLessonData.elementi_lezione)) {
            lessonElementsContainer.innerHTML = '<p class="placeholder text-muted">Nessun elemento da visualizzare nella lezione.</p>'; return;
        }
        currentLessonData.elementi_lezione.forEach(element => {
            if (!element || typeof element.tipo !== 'string') {
                console.warn('Elemento lezione non valido:', element); return; 
            }
            if (element.tipo.startsWith('esercizio_')) return; 
            const elDiv = document.createElement('div'); 
            if(element.id) elDiv.setAttribute('data-id', element.id);
            elDiv.classList.add('mb-4'); 
            let contentHtml = '';
            switch (element.tipo) {
                case 'paragrafo': elDiv.classList.add('lesson-paragraph'); contentHtml = element.contenuto || ""; break;
                case 'immagine':
                    elDiv.classList.add('lesson-image-container', 'text-center');
                    contentHtml = `<img src="${element.url || '#'}" alt="${element.didascalia || "Immagine"}" class="lesson-image img-fluid rounded shadow-sm" style="max-height: 400px;">`;
                    if (element.didascalia) contentHtml += `<p class="lesson-image-caption text-muted fst-italic small mt-2">${element.didascalia}</p>`;
                    break;
                case 'elenco_puntato':
                    elDiv.classList.add('lesson-list');
                    if (element.titolo) contentHtml += `<h4 class="h5">${element.titolo}</h4>`;
                    contentHtml += `<ul class="list-group list-group-flush">${(element.elementi || []).map(item => `<li class="list-group-item">${item}</li>`).join('')}</ul>`;
                    break;
                case 'elenco_numerato':
                    elDiv.classList.add('lesson-numbered-list');
                    if (element.titolo) contentHtml += `<h4 class="h5">${element.titolo}</h4>`;
                    contentHtml += `<ol class="list-group list-group-numbered list-group-flush">${(element.elementi || []).map(item => `<li class="list-group-item">${item}</li>`).join('')}</ol>`;
                    break;
                case 'citazione':
                    elDiv.classList.add('lesson-quote');
                    contentHtml = `<figure class="bg-light p-3 rounded border-start border-5 border-secondary">
                                    <blockquote class="blockquote">
                                        <p>${element.testo || ""}</p>
                                    </blockquote>
                                    ${element.fonte ? `<figcaption class="blockquote-footer mb-0">${element.fonte}</figcaption>` : ''}
                                   </figure>`;
                    break;
                case 'video_embed':
                    elDiv.classList.add('lesson-video', 'my-3');
                    if (element.titolo_video) contentHtml += `<h4 class="h5">${element.titolo_video}</h4>`;
                    const safeVideoSrc = element.iframe_src && element.iframe_src.startsWith("https://www.youtube.com/embed/") ? element.iframe_src : "about:blank";
                    contentHtml += `<div class="ratio ratio-16x9 rounded overflow-hidden shadow-sm">
                                        <iframe src="${safeVideoSrc}" title="${element.titolo_video || 'Video Lezione'}" allowfullscreen></iframe>
                                    </div>`;
                    if (element.didascalia) contentHtml += `<p class="lesson-image-caption text-muted fst-italic small mt-2 text-center">${element.didascalia}</p>`;
                    break;
                default: contentHtml = `<p class="text-danger"><em>Tipo elemento non riconosciuto: ${element.tipo}</em></p>`;
            }
            elDiv.innerHTML = contentHtml; 
            lessonElementsContainer.appendChild(elDiv);
        });
        applyAllHighlights();
    }
    
    function applyAllHighlights() { 
        if (!currentLessonData || !currentLessonData.evidenziazioni_utente) return;
        if(!lessonElementsContainer) return;
        lessonElementsContainer.querySelectorAll('.highlighted').forEach(span => {
            const parent = span.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(span.textContent), span);
                parent.normalize();
            }
        });
        currentLessonData.evidenziazioni_utente.forEach(h => {
            if (h.riferimento_elemento_id && h.testo_evidenziato) {
                applyHighlightToDOM(h.riferimento_elemento_id, h.testo_evidenziato, h.id_evidenziazione);
            }
        });
    }

    function applyHighlightToDOM(elementId, textToHighlight, highlightId) { 
        const targetParagraph = lessonElementsContainer.querySelector(`.lesson-paragraph[data-id="${elementId}"]`);
        if (targetParagraph) {
            const escapedText = escapeRegExp(textToHighlight);
            let matchFoundAndReplacedThisCall = false; 
            function highlightInNode(node) {
                if (matchFoundAndReplacedThisCall) return;
                if (node.nodeType === Node.TEXT_NODE) {
                    const nodeText = node.textContent;
                    const matchIndex = nodeText.indexOf(textToHighlight);
                    if (matchIndex !== -1) {
                        if (node.parentNode && (node.parentNode.classList.contains('highlighted') || node.parentNode.id === 'text-selection-menu')) return;
                        const beforeText = nodeText.substring(0, matchIndex);
                        const matchedTextNode = document.createTextNode(textToHighlight);
                        const afterText = nodeText.substring(matchIndex + textToHighlight.length);
                        const span = document.createElement('span');
                        span.className = 'highlighted'; span.dataset.highlightId = highlightId;
                        span.appendChild(matchedTextNode);
                        const fragment = document.createDocumentFragment();
                        if (beforeText) fragment.appendChild(document.createTextNode(beforeText));
                        fragment.appendChild(span);
                        if (afterText) fragment.appendChild(document.createTextNode(afterText));
                        if(node.parentNode) node.parentNode.replaceChild(fragment, node);
                        matchFoundAndReplacedThisCall = true; return;
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList.contains('highlighted') || node.id === 'text-selection-menu') return;
                    if(node.childNodes) Array.from(node.childNodes).forEach(child => highlightInNode(child));
                }
            }
            highlightInNode(targetParagraph);
        }
    }

    function escapeRegExp(string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    
    function handleTextSelection(event) { 
        if (event.target.closest('.highlighted, #text-selection-menu, .modal, .dropdown-menu, .form-control, .form-select, input, textarea, button, .navbar, .offcanvas')) {
             if(!event.target.closest('#text-selection-menu button')) { 
                 if(textSelectionMenu) textSelectionMenu.style.display = 'none';
            }
            return;
        }
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            let commonAncestor = range.commonAncestorContainer;
            let lessonElementDiv = commonAncestor.nodeType === Node.ELEMENT_NODE ? commonAncestor : commonAncestor.parentElement;
            if (lessonElementDiv) lessonElementDiv = lessonElementDiv.closest('[data-id].lesson-paragraph');
            
            if (lessonElementDiv) {
                selectedTextInfo = { text: selection.toString(), elementId: lessonElementDiv.dataset.id, range: range.cloneRange() };
                const rect = range.getBoundingClientRect();
                if(textSelectionMenu) {
                    textSelectionMenu.style.left = `${rect.left + window.scrollX}px`;
                    textSelectionMenu.style.top = `${rect.bottom + window.scrollY + 5}px`;
                    textSelectionMenu.style.display = 'block';
                }
            } else { 
                selectedTextInfo = null; if(textSelectionMenu) textSelectionMenu.style.display = 'none'; 
            }
        } else { 
            if(textSelectionMenu) textSelectionMenu.style.display = 'none'; 
        }
    }

    function hideTextSelectionMenuOnClickOutside(event) { 
        if (textSelectionMenu && textSelectionMenu.style.display === 'block' && !textSelectionMenu.contains(event.target) && !event.target.closest('#text-selection-menu')) {
             if (!event.target.closest('[data-bs-toggle="modal"], .modal, .dropdown-toggle, .offcanvas')) {
                textSelectionMenu.style.display = 'none';
             }
        }
    }

    function handleHighlightClick(event) {
        if (event.target.classList.contains('highlighted')) {
            const span = event.target; const highlightId = span.dataset.highlightId;
            if(currentLessonData && currentLessonData.evidenziazioni_utente){
                currentLessonData.evidenziazioni_utente = currentLessonData.evidenziazioni_utente.filter(h => h.id_evidenziazione !== highlightId);
            }
            const parent = span.parentNode; 
            if (parent) {
                parent.replaceChild(document.createTextNode(span.textContent), span);
                parent.normalize(); 
            }
            if(textSelectionMenu) textSelectionMenu.style.display = 'none';
        }
    }

    function applyHighlightAction() {
        if (selectedTextInfo && selectedTextInfo.range && currentLessonData) {
            const highlightId = `hl-${Date.now()}`;
            const span = document.createElement('span');
            span.className = 'highlighted'; span.dataset.highlightId = highlightId;
            try {
                span.appendChild(selectedTextInfo.range.extractContents());
                selectedTextInfo.range.insertNode(span);
                if (!currentLessonData.evidenziazioni_utente) currentLessonData.evidenziazioni_utente = [];
                currentLessonData.evidenziazioni_utente.push({
                    id_evidenziazione: highlightId,
                    riferimento_elemento_id: selectedTextInfo.elementId,
                    testo_evidenziato: selectedTextInfo.text
                });
                window.getSelection().removeAllRanges();
            } catch (e) { console.warn("Impossibile evidenziare:", e); alert("Evidenziazione non possibile."); }
        }
        if(textSelectionMenu) textSelectionMenu.style.display = 'none'; 
        selectedTextInfo = null;
    }

    function openAnnotationModalAction() {
        if (selectedTextInfo && selectedTextInfo.text) {
            if(selectedTextPreviewEl) selectedTextPreviewEl.textContent = selectedTextInfo.text.substring(0, 100) + (selectedTextInfo.text.length > 100 ? '...' : '');
            if(annotationTextEl) annotationTextEl.value = ''; 
            if(annotationBsModal) annotationBsModal.show();
        }
        if(textSelectionMenu) textSelectionMenu.style.display = 'none';
    }

    function saveAnnotationAction() {
        if (!annotationTextEl || !annotationTypeEl || !selectedTextInfo || !currentLessonData) {
             alert("Impossibile salvare l'annotazione. Dati mancanti o lezione non caricata.");
             return;
        }
        const text = annotationTextEl.value.trim(); 
        const type = annotationTypeEl.value;
        if (text) {
            if(!currentLessonData.annotazioni_utente) currentLessonData.annotazioni_utente = [];
            currentLessonData.annotazioni_utente.push({
                id_annotazione: `ann-${Date.now()}`, 
                riferimento_elemento_id: selectedTextInfo.elementId,
                testo_riferimento: selectedTextInfo.text, 
                tipo_annotazione: type, 
                contenuto_annotazione: text
            });
            renderAnnotations(); 
            if(annotationBsModal) annotationBsModal.hide();
            selectedTextInfo = null;
        } else { alert("Inserisci il testo dell'annotazione."); }
    }
    
    function renderAnnotations() {
        const renderTarget = (containerEl) => {
            if (!containerEl) return; containerEl.innerHTML = '';
            if (!currentLessonData || !currentLessonData.annotazioni_utente || currentLessonData.annotazioni_utente.length === 0) {
                containerEl.innerHTML = '<p class="text-muted small">Nessuna annotazione ancora.</p>'; return;
            }
            currentLessonData.annotazioni_utente.forEach(ann => {
                const item = document.createElement('div'); item.classList.add('annotation-item');
                item.innerHTML = `
                    <small>Rif: "${(ann.testo_riferimento || "").substring(0,50)}..." (ID El: ${ann.riferimento_elemento_id || 'N/D'})</small>
                    <strong>${ann.tipo_annotazione}:</strong> <p>${(ann.contenuto_annotazione || "").replace(/\n/g, '<br>')}</p>`;
                containerEl.appendChild(item);
            });
        };
        renderTarget(annotationsListDesktopEl);
        renderTarget(annotationsListMobileEl);
    }

    function saveSummaryAction(editorEl) { 
        if(!editorEl || !currentLessonData) {
             alert("Impossibile salvare il riassunto. Dati mancanti o lezione non caricata.");
             return;
        }
        const summaryText = editorEl.value.trim();
        if (summaryText) {
            if(!currentLessonData.riassunti_utente) currentLessonData.riassunti_utente = [];
            currentLessonData.riassunti_utente.push({ id_riassunto: `ria-${Date.now()}`, contenuto_riassunto: summaryText });
            renderSummaries(); 
            editorEl.value = '';
        } else { alert("Scrivi qualcosa nel riassunto."); }
    }

    function renderSummaries() {
        const renderTarget = (containerEl) => {
            if (!containerEl) return; containerEl.innerHTML = '';
            if (!currentLessonData || !currentLessonData.riassunti_utente || currentLessonData.riassunti_utente.length === 0) {
                containerEl.innerHTML = '<p class="text-muted small">Nessun riassunto ancora.</p>'; return;
            }
            currentLessonData.riassunti_utente.forEach(sum => {
                const item = document.createElement('div'); item.classList.add('summary-item');
                item.innerHTML = `<p>${(sum.contenuto_riassunto || "").replace(/\n/g, '<br>')}</p>`;
                containerEl.appendChild(item);
            });
        };
        renderTarget(summariesListDesktopEl);
        renderTarget(summariesListMobileEl);
    }

    function renderExercisesAndResponses() {
        const renderTarget = (containerEl, suffix) => {
            if (!containerEl) return; containerEl.innerHTML = '';
            const exercises = currentLessonData && currentLessonData.elementi_lezione 
                ? currentLessonData.elementi_lezione.filter(el => el && typeof el.tipo === 'string' && el.tipo.startsWith('esercizio_'))
                : [];

            if (exercises.length === 0) {
                containerEl.innerHTML = '<p class="text-muted small">Nessun esercizio da visualizzare.</p>'; return;
            }
            exercises.forEach(exerciseData => {
                const exerciseDiv = document.createElement('div');
                exerciseDiv.classList.add('exercise'); 
                if(exerciseData.id) exerciseDiv.setAttribute('data-exercise-id', exerciseData.id);
                populateExerciseContent(exerciseDiv, exerciseData, suffix);
                containerEl.appendChild(exerciseDiv);
            });
        };
        renderTarget(exerciseResponsesContainerDesktopEl, '-desktop');
        renderTarget(exerciseResponsesContainerMobileEl, '-mobile');

        if (correctionsVisible) {
            displayCorrections(exerciseResponsesContainerDesktopEl);
            displayCorrections(exerciseResponsesContainerMobileEl);
        } else {
            clearCorrectionsDisplay(exerciseResponsesContainerDesktopEl);
            clearCorrectionsDisplay(exerciseResponsesContainerMobileEl);
        }
    }
    
    function populateExerciseContent(exerciseDiv, exerciseData, idSuffix = '') {
        exerciseDiv.innerHTML = `<h4 class="h6">${exerciseData.testo_domanda || "Domanda Esercizio"}</h4>`;
        const response = currentLessonData.risposte_utente && exerciseData.id ? currentLessonData.risposte_utente[exerciseData.id] : undefined;
    
        if (exerciseData.tipo === 'esercizio_domanda_aperta') {
            const textarea = document.createElement('textarea');
            textarea.classList.add('form-control', 'form-control-sm');
            textarea.placeholder = "Scrivi la tua risposta...";
            textarea.value = response || '';
            textarea.rows = 3;
            textarea.addEventListener('change', (e) => {
                if (currentLessonData && exerciseData.id) {
                    if (!currentLessonData.risposte_utente) currentLessonData.risposte_utente = {};
                    currentLessonData.risposte_utente[exerciseData.id] = e.target.value;
                }
            });
            exerciseDiv.appendChild(textarea);
        } else if (exerciseData.tipo === 'esercizio_vero_falso' || exerciseData.tipo === 'esercizio_scelta_multipla') {
            const optionsGroup = document.createElement('div');
            optionsGroup.className = 'options-group mt-2';
            (exerciseData.opzioni || []).forEach(opzione => {
                const formCheckDiv = document.createElement('div');
                formCheckDiv.classList.add('form-check');
    
                const inputType = (exerciseData.tipo === 'esercizio_scelta_multipla' && exerciseData.permetti_multipla_selezione) ? 'checkbox' : 'radio';
                const input = document.createElement('input');
                input.classList.add('form-check-input');
                input.type = inputType;
                input.name = `ex-${exerciseData.id}${idSuffix}`; 
    
                const inputId = `ex-${exerciseData.id}-${(opzione || "opt").replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/gi, '')}${idSuffix}`;
                input.id = inputId;
                
                input.value = opzione;
    
                if (inputType === 'radio' && response === opzione) input.checked = true;
                if (inputType === 'checkbox' && Array.isArray(response) && response.includes(opzione)) input.checked = true;
                
                input.addEventListener('change', (e) => {
                    if (!currentLessonData || !exerciseData.id) return;
                    if (!currentLessonData.risposte_utente) currentLessonData.risposte_utente = {};
    
                    if (inputType === 'radio') {
                        currentLessonData.risposte_utente[exerciseData.id] = e.target.value;
                    } else { 
                        if (!currentLessonData.risposte_utente[exerciseData.id] || !Array.isArray(currentLessonData.risposte_utente[exerciseData.id])) {
                            currentLessonData.risposte_utente[exerciseData.id] = [];
                        }
                        const currentAnswers = currentLessonData.risposte_utente[exerciseData.id];
                        if (e.target.checked) {
                            if (!currentAnswers.includes(e.target.value)) currentAnswers.push(e.target.value);
                        } else {
                            const index = currentAnswers.indexOf(e.target.value);
                            if (index > -1) currentAnswers.splice(index, 1);
                        }
                    }
                    if (correctionsVisible) {
                        displayCorrections(exerciseResponsesContainerDesktopEl);
                        displayCorrections(exerciseResponsesContainerMobileEl);
                    }
                });
                
                const label = document.createElement('label');
                label.classList.add('form-check-label', 'option-label'); 
                label.setAttribute('for', inputId);
                label.innerHTML = `<span>${opzione}</span>`; 
    
                formCheckDiv.appendChild(input);
                formCheckDiv.appendChild(label);
                optionsGroup.appendChild(formCheckDiv);
            });
            exerciseDiv.appendChild(optionsGroup);
        }
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'feedback-message mt-2';
        exerciseDiv.appendChild(feedbackDiv);
    }
    
    function toggleCorrectionsAction() { 
        correctionsVisible = !correctionsVisible; 
        const newLabel = correctionsVisible ? "Nascondi Correzioni" : "Mostra Correzioni";
        if(toggleCorrectionsBtnDesktopEl) toggleCorrectionsBtnDesktopEl.textContent = newLabel;
        if(toggleCorrectionsBtnMobileEl) toggleCorrectionsBtnMobileEl.textContent = newLabel;
        
        if (correctionsVisible) {
            displayCorrections(exerciseResponsesContainerDesktopEl);
            displayCorrections(exerciseResponsesContainerMobileEl);
        } else {
            clearCorrectionsDisplay(exerciseResponsesContainerDesktopEl);
            clearCorrectionsDisplay(exerciseResponsesContainerMobileEl);
        }
    }

    function displayCorrections(containerEl) { 
        if (!currentLessonData || !containerEl) return;
        containerEl.querySelectorAll('.exercise[data-exercise-id]').forEach(exDiv => {
            const exId = exDiv.dataset.exerciseId;
            const exData = currentLessonData.elementi_lezione.find(el => el.id === exId);
            if (!exData || exData.risposta_corretta === undefined) {
                 const feedbackDiv = exDiv.querySelector('.feedback-message');
                 if(feedbackDiv) {
                    feedbackDiv.innerHTML = ''; 
                    feedbackDiv.className = 'feedback-message mt-2'; 
                 }
                return;
            }
            const userAnswer = currentLessonData.risposte_utente[exId]; const correctAnswer = exData.risposta_corretta;
            const feedbackDiv = exDiv.querySelector('.feedback-message');
            if(feedbackDiv) { feedbackDiv.innerHTML = ''; feedbackDiv.className = 'feedback-message mt-2 alert'; }

            exDiv.querySelectorAll('.option-label').forEach(label => {
                label.classList.remove('text-success', 'text-danger', 'border', 'border-warning', 'p-1', 'rounded');
                const input = label.previousElementSibling; 
                if (input && input.tagName === 'INPUT') {
                    const optionValue = input.value;
                    let isCorrect = Array.isArray(correctAnswer) ? correctAnswer.includes(optionValue) : correctAnswer === optionValue;
                    let userSelected = input.checked;
                    const spanElement = label.querySelector('span');
                    if (spanElement) { 
                        spanElement.style.fontWeight = 'normal';
                        spanElement.style.textDecoration = 'none';
                    }
                    if (isCorrect && userSelected) { label.classList.add('text-success'); if(spanElement) spanElement.style.fontWeight = 'bold';}
                    else if (!isCorrect && userSelected) { label.classList.add('text-danger'); if(spanElement) spanElement.style.textDecoration = 'line-through';}
                    else if (isCorrect && !userSelected) { label.classList.add('border', 'border-warning', 'p-1', 'rounded'); }
                }
            });
            if (feedbackDiv && correctAnswer != null) { 
                feedbackDiv.textContent = `Risposta/e corretta/e: ${Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}`; 
                feedbackDiv.classList.add('alert-info');
            } else if (feedbackDiv) {
                 feedbackDiv.classList.remove('alert', 'alert-info');
            }
        });
    }

    function clearCorrectionsDisplay(containerEl) { 
         if(!containerEl) return;
         containerEl.querySelectorAll('.exercise .option-label').forEach(l => {
             l.classList.remove('text-success', 'text-danger', 'border', 'border-warning', 'p-1', 'rounded');
             const spanElement = l.querySelector('span');
             if (spanElement) {
                spanElement.style.fontWeight = 'normal';
                spanElement.style.textDecoration = 'none';
             }
            });
         containerEl.querySelectorAll('.exercise .feedback-message').forEach(fb => { 
             fb.innerHTML = ''; 
             fb.className = 'feedback-message mt-2'; 
             fb.classList.remove('alert', 'alert-info');
            });
    }
    
    function updateStudentInfoInData() {
        if (!currentLessonData) return;
        if (!currentLessonData.info_studente) currentLessonData.info_studente = {};
        if(studentNameEl) currentLessonData.info_studente.nome = studentNameEl.value;
        if(studentSurnameEl) currentLessonData.info_studente.cognome = studentSurnameEl.value;
        if(studentClassEl) currentLessonData.info_studente.classe = studentClassEl.value;
        if(studentDateEl) currentLessonData.info_studente.data_sessione = studentDateEl.value;
    }
    function saveLessonToFile() {
        if (!currentLessonData) { alert("Nessuna lezione caricata."); return; }
        updateStudentInfoInData();
        const jsonString = JSON.stringify(currentLessonData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `${(currentLessonData.titolo_lezione || 'lezione').replace(/\s+/g, '_')}_compilata.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        alert("Lezione salvata come JSON!");
    }
    function printToPdfAction() {
        if (!currentLessonData) { alert("Nessuna lezione da stampare."); return; }
        updateStudentInfoInData();
        if(printHeaderArea) printHeaderArea.innerHTML = `
            <h1>${currentLessonData.titolo_lezione || ''}</h1>
            <p><strong>Studente:</strong> ${currentLessonData.info_studente.nome || ''} ${currentLessonData.info_studente.cognome || ''}</p>
            <p><strong>Classe:</strong> ${currentLessonData.info_studente.classe || ''}</p>
            <p><strong>Data:</strong> ${new Date(currentLessonData.info_studente.data_sessione || Date.now()).toLocaleDateString('it-IT')}</p>`;
        document.body.classList.add('printing-mode');
        window.print();
        document.body.classList.remove('printing-mode');
        if(printHeaderArea) printHeaderArea.innerHTML = '';
    }

    // --- Chiamata Iniziale ---
    initializeApp();

}); // Fine DOMContentLoaded