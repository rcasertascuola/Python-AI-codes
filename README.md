# App di Studio Avanzata

L'"App di Studio Avanzata" è un'applicazione web progettata per facilitare lo studio interattivo di lezioni fornite in formato JSON. Gli utenti possono caricare i file delle lezioni, interagire con il contenuto attraverso evidenziazioni e annotazioni, completare esercizi e scrivere riassunti, salvando poi i loro progressi.

## Funzionalità Chiave

*   Caricamento di lezioni da file JSON locali.
*   Visualizzazione di vari elementi della lezione (testo, immagini, video, elenchi, citazioni).
*   Esercizi interattivi (scelta multipla, vero/falso, risposta aperta) con funzionalità di visualizzazione delle correzioni.
*   Evidenziazione del testo nel contenuto della lezione.
*   Creazione di note/annotazioni collegate a specifiche parti del testo.
*   Redazione di riassunti generali della lezione.
*   Salvataggio dei progressi (informazioni studente, risposte, note, evidenziazioni) in un nuovo file JSON.
*   Schema di colori dell'interfaccia utente personalizzabile (impostazioni salvate nel localStorage).
*   Funzionalità di stampa in PDF del contenuto della lezione e dei dati utente.
*   Design responsivo per utilizzo su desktop e dispositivi mobili.

## Utilizzo Base

1.  Apri il file `index.html` in un browser web moderno.
2.  Clicca il pulsante "Carica" per caricare un file JSON della lezione (ad esempio, il file `lezione.json` fornito nel progetto).
3.  Interagisci con il contenuto della lezione utilizzando la vista principale e gli strumenti presenti nella barra laterale (desktop) o nel menu offcanvas (mobile).
4.  Salva il tuo lavoro utilizzando il pulsante "Salva", che avvierà il download di un nuovo file JSON contenente i tuoi progressi.

## Tecnologie Utilizzate

*   HTML5
*   CSS3 (con Bootstrap 5)
*   JavaScript (ES6+)
