// ====================
// CONFIGURAZIONE VOCALE
// ====================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const voiceBtn = document.getElementById("voiceBtn");
const endSessionBtn = document.getElementById("endSessionBtn");
const pauseBtn = document.getElementById("pauseBtn");
const status = document.getElementById("status");
const textCommandInput = document.getElementById("textCommandInput");
const voiceFeedback = document.getElementById("voiceFeedback");
const conversationBtn = document.getElementById("conversationBtn");
const namePrompt = document.getElementById("namePrompt");
let recognition = null;
let isSessionActive = false;
let isPaused = false;
let userName = localStorage.getItem("nerdyUserName") || null;

if (!SpeechRecognition) {
    voiceBtn.style.display = "none";
    conversationBtn.style.display = "none";
    textCommandInput.style.display = "block";
    status.textContent = "Riconoscimento vocale non supportato. Usa il campo di testo.";
} else {
    recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.interimResults = false;
    recognition.continuous = true;

    function initializeRecognition() {
        recognition.onstart = () => {
            console.log("Riconoscimento vocale avviato");
            status.textContent = `Microfono attivo in continuo ascolto. Ciao ${userName}, io sono Nerd e sono il tuo assistente virtuale personale.`;
            voiceBtn.classList.add("listening");
            conversationBtn.classList.add("listening");
            voiceFeedback.classList.add("listening");
            endSessionBtn.style.display = "inline-block";
            pauseBtn.style.display = "inline-block";
        };

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
            console.log("Hai detto:", transcript);
            if (!isPaused) handleVoiceCommand(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Errore riconoscimento vocale:", event.error);
            status.textContent = `Errore microfono: ${event.error}`;
            voiceFeedback.classList.remove("listening");
            if (isSessionActive && !isPaused) {
                setTimeout(() => {
                    if (isSessionActive && !isPaused) recognition.start();
                }, 1000);
            }
        };

        recognition.onend = () => {
            if (isSessionActive && !isPaused) {
                console.log("Riconoscimento vocale terminato, riavvio...");
                recognition.start();
            }
        };
    }

    function startSession() {
        if (!isSessionActive && recognition) {
            isSessionActive = true;
            initializeRecognition();
            recognition.start();
            speakText(`Ciao ${userName}, io sono Nerd e sono il tuo assistente virtuale personale.`);
        }
    }

    function endSession() {
        if (isSessionActive && recognition) {
            isSessionActive = false;
            isPaused = false;
            recognition.stop();
            voiceBtn.classList.remove("listening", "paused");
            conversationBtn.classList.remove("listening", "paused");
            endSessionBtn.style.display = "none";
            pauseBtn.style.display = "none";
            voiceFeedback.classList.remove("listening");
            status.textContent = `Ciao ${userName}, chiudo la sessione, a presto!`;
            speakText(`Ciao ${userName}, chiudo la sessione, a presto!`);
        }
    }

    function togglePause() {
        if (isSessionActive) {
            isPaused = !isPaused;
            if (isPaused) {
                recognition.stop();
                voiceBtn.classList.remove("listening");
                voiceBtn.classList.add("paused");
                conversationBtn.classList.remove("listening");
                conversationBtn.classList.add("paused");
                pauseBtn.innerHTML = '<i class="fas fa-play"></i> Riprendi';
                status.textContent = "Microfono in pausa.";
                speakText("Microfono in pausa.");
                voiceFeedback.classList.remove("listening");
            } else {
                recognition.start();
                voiceBtn.classList.remove("paused");
                voiceBtn.classList.add("listening");
                conversationBtn.classList.remove("paused");
                conversationBtn.classList.add("listening");
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausa';
                status.textContent = "Microfono attivo in continuo ascolto.";
                speakText("Microfono attivo in continuo ascolto.");
                voiceFeedback.classList.add("listening");
            }
        }
    }

    voiceBtn.addEventListener("click", startSession);
    conversationBtn.addEventListener("click", startSession);
}

// ====================
// INIZIALIZZAZIONE
// ====================
let calendar;
document.addEventListener("DOMContentLoaded", () => {
    if (!userName) {
        namePrompt.style.display = "block";
        status.textContent = "Come ti chiami?";
        speakText("Come ti chiami?");
        voiceBtn.disabled = true;
        conversationBtn.disabled = true;
    } else {
        document.getElementById("userName").textContent = userName;
        document.getElementById("userAvatar").textContent = userName.charAt(0).toUpperCase();
    }

    const savedTheme = localStorage.getItem("nerdyTheme") || "default";
    document.body.className = savedTheme;
    document.getElementById("themeSelect").value = savedTheme;

    loadData();

    const calendarEl = document.getElementById("calendarContainer");
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        events: [],
        eventClick: function(info) {
            if (confirm(`Vuoi eliminare l'evento "${info.event.title}"?`)) {
                info.event.remove();
                saveData();
            }
        }
    });
    calendar.render();
});

function loadData() {
    try {
        const data = JSON.parse(localStorage.getItem("nerdyData"));
        if (data) {
            document.getElementById("fullTaskList").innerHTML = "";
            document.getElementById("taskList").innerHTML = "";
            if (Array.isArray(data.tasks) && data.tasks.length) {
                data.tasks.forEach(task => addTask(task, false));
            } else {
                document.getElementById("fullTaskList").innerHTML = "<p>Nessun impegno</p>";
                document.getElementById("taskList").innerHTML = "<p>Nessun impegno</p>";
            }
            document.getElementById("fullAppointmentList").innerHTML = "";
            document.getElementById("appointmentList").innerHTML = "";
            if (Array.isArray(data.appointments) && data.appointments.length) {
                data.appointments.forEach(app => addAppointment(app.title, app.date, false));
            } else {
                document.getElementById("fullAppointmentList").innerHTML = "<p>Nessun appuntamento</p>";
                document.getElementById("appointmentList").innerHTML = "<p>Nessun appuntamento</p>";
            }
            document.getElementById("fullDeadlineList").innerHTML = "";
            if (Array.isArray(data.deadlines) && data.deadlines.length) {
                data.deadlines.forEach(dl => addDeadline(dl.title, dl.date, false));
            } else {
                document.getElementById("fullDeadlineList").innerHTML = "<p>Nessuna scadenza</p>";
            }
            document.getElementById("fullNoteList").innerHTML = "";
            document.getElementById("noteList").innerHTML = "";
            if (Array.isArray(data.notes) && data.notes.length) {
                data.notes.forEach(note => addNote(note, false));
            } else {
                document.getElementById("fullNoteList").innerHTML = "<p>Nessuna nota</p>";
                document.getElementById("noteList").innerHTML = "<p>Nessuna nota</p>";
            }
            document.getElementById("fullShoppingList").innerHTML = "";
            document.getElementById("shoppingList").innerHTML = "";
            if (Array.isArray(data.shopping) && data.shopping.length) {
                data.shopping.forEach(item => addShoppingItem(item, false));
            } else {
                document.getElementById("fullShoppingList").innerHTML = "<p>Lista vuota</p>";
                document.getElementById("shoppingList").innerHTML = "<p>Lista vuota</p>";
            }
        }
    } catch (e) {
        console.error("Errore nel caricamento dei dati:", e);
        localStorage.removeItem("nerdyData");
        status.textContent = "Errore nel caricamento dei dati salvati.";
    }
}

function saveData() {
    const data = {
        tasks: Array.from(document.getElementById("fullTaskList").children).map(e => e.textContent.trim()),
        appointments: Array.from(document.getElementById("fullAppointmentList").children).map(e => ({
            title: e.textContent.split(' (')[0],
            date: new Date(e.textContent.match(/\(.*\)/)[0].slice(1, -1)).toISOString()
        })),
        deadlines: Array.from(document.getElementById("fullDeadlineList").children).map(e => ({
            title: e.textContent.split(' (')[0],
            date: new Date(e.textContent.match(/\(.*\)/)[0].slice(1, -1)).toISOString()
        })),
        notes: Array.from(document.getElementById("fullNoteList").children).map(e => e.textContent.trim()),
        shopping: Array.from(document.getElementById("fullShoppingList").children).map(e => e.textContent.trim()),
        userName: document.getElementById("userName").textContent
    };
    localStorage.setItem("nerdyData", JSON.stringify(data));
}

// ====================
// GESTIONE NOME UTENTE
// ====================
function saveUserName() {
    const name = document.getElementById("nameInput")?.value.trim() || document.getElementById("userNameInput").value.trim();
    if (name) {
        userName = name;
        localStorage.setItem("nerdyUserName", name);
        document.getElementById("userName").textContent = name;
        document.getElementById("userAvatar").textContent = name.charAt(0).toUpperCase();
        namePrompt.style.display = "none";
        voiceBtn.disabled = false;
        conversationBtn.disabled = false;
        status.textContent = `Nome salvato, ${name}! Di' "Ciao Nerd" per iniziare.`;
        speakText(`Nome salvato, ${name}! Di' Ciao Nerd per iniziare.`);
        saveData();
    } else {
        status.textContent = "Errore: Inserisci un nome valido.";
        speakText("Per favore, inserisci un nome valido.");
    }
}

// ====================
// GESTIONE COMANDI VOCALI
// ====================
function parseDate(text) {
    const now = new Date();
    let date = new Date();
    if (text.includes("oggi")) {
        // Usa la data corrente
    } else if (text.includes("domani")) {
        date.setDate(now.getDate() + 1);
    } else if (text.includes("dopodomani")) {
        date.setDate(now.getDate() + 2);
    }
    const timeMatch = text.match(/alle\s+(\d{1,2})(?::(\d{2}))?/i);
    if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        date.setHours(hours, minutes, 0, 0);
    } else {
        date.setHours(0, 0, 0, 0);
    }
    return date.toISOString();
}

function handleVoiceCommand(text) {
    if (!userName) {
        status.textContent = "Per favore, inserisci il tuo nome prima di iniziare.";
        speakText("Per favore, inserisci il tuo nome prima di iniziare.");
        return;
    }

    if (!isSessionActive && !text.match(/ciao\s+nerd/i)) {
        status.textContent = 'Di "Ciao Nerd" per attivare l\'assistente.';
        speakText("Di Ciao Nerd per attivare l'assistente.");
        return;
    }

    const commands = [
        { pattern: /ciao\s+nerd/i, action: () => startSession() },
        { pattern: /fine\s+sessione/i, action: () => endSession() },
        { pattern: /nerd\s+aggiungi\s+impegno\s+(.+)/i, action: (match) => {
            addTask(match[1]);
            speakText(`Ho aggiunto l'impegno: ${match[1]}`);
        }},
        { pattern: /nerd\s+aggiungi\s+appuntamento\s+(.+?)(?:\s+(oggi|domani|dopodomani|alle\s+\d{1,2}(?::\d{2})?)?)/i, action: (match) => {
            const title = match[1];
            const dateStr = match[2] || "";
            const date = parseDate(dateStr);
            addAppointment(title, date);
            speakText(`Ho aggiunto l'appuntamento: ${match[1]}`);
        }},
        { pattern: /nerd\s+aggiungi\s+scadenza\s+(.+?)(?:\s+(oggi|domani|dopodomani|alle\s+\d{1,2}(?::\d{2})?)?)/i, action: (match) => {
            const title = match[1];
            const dateStr = match[2] || "";
            const date = parseDate(dateStr);
            addDeadline(title, date);
            speakText(`Ho aggiunto la scadenza: ${match[1]}`);
        }},
        { pattern: /nerd\s+aggiungi\s+nota\s+(.+)/i, action: (match) => {
            addNote(match[1]);
            speakText(`Ho aggiunto la nota: ${match[1]}`);
        }},
        { pattern: /nerd\s+aggiungi\s+alla\s+lista\s+(.+)/i, action: (match) => {
            addShoppingItem(match[1]);
            speakText(`Ho aggiunto alla lista della spesa: ${match[1]}`);
        }},
        { pattern: /mostra\s+impegni/i, action: () => {
            showTab('tasks');
            speakText("Ecco i tuoi impegni");
        }},
        { pattern: /inizia\s+registrazione/i, action: () => {
            startRecording();
            speakText("Registrazione iniziata");
        }},
        { pattern: /ferma\s+registrazione/i, action: () => {
            stopRecording();
            speakText("Registrazione fermata");
        }},
        { pattern: /salva\s+registrazione/i, action: () => {
            saveRecording();
            speakText("Registrazione salvata");
        }},
        { pattern: /cambia\s+tema\s+(.+)/i, action: (match) => {
            const theme = match[1].toLowerCase();
            if (['default', 'blue', 'green', 'purple', 'dark'].includes(theme)) {
                changeTheme(theme);
                speakText(`Tema cambiato in ${theme}`);
            } else {
                speakText("Tema non valido. Scegli tra default, blue, green, purple, dark.");
            }
        }},
        { pattern: /esporta\s+dati/i, action: () => {
            exportData();
            speakText("Dati esportati");
        }},
        { pattern: /importa\s+dati/i, action: () => {
            importData();
            speakText("Dati importati");
        }},
        { pattern: /ripristina\s+tutto/i, action: () => {
            resetData();
            speakText("Tutti i dati sono stati ripristinati");
        }}
    ];

    for (const { pattern, action } of commands) {
        const match = text.match(pattern);
        if (match) {
            action(match);
            status.textContent = `Comando eseguito: "${text}"`;
            return;
        }
    }
    status.textContent = `Non ho capito: "${text}"`;
    speakText("Mi dispiace, non ho capito il comando. Puoi ripetere?");
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = 'it-IT';
        speech.volume = 1;
        speech.rate = 1;
        speech.pitch = 1;
        window.speechSynthesis.speak(speech);
    }
}

// ====================
// NAVIGAZIONE TRA TAB
// ====================
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        showTab(tab.dataset.tab);
    });
});

function showTab(tabId) {
    tabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
    });
    tabContents.forEach(tc => {
        tc.classList.remove("active");
        tc.setAttribute("hidden", "true");
    });

    const selectedTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(`${tabId}-content`);

    selectedTab.classList.add("active");
    selectedTab.setAttribute("aria-selected", "true");
    selectedContent.classList.add("active");
    selectedContent.removeAttribute("hidden");
}

// ====================
// FUNZIONI DASHBOARD
// ====================
function addTask(task = "Nuovo Impegno", save = true) {
    if (!task.trim() || task === "Nuovo Impegno") {
        status.textContent = "Errore: Inserisci una descrizione valida.";
        speakText("Errore: Inserisci una descrizione valida.");
        return;
    }
    const list = document.getElementById("taskList");
    if (list.innerHTML.includes("Nessun impegno")) list.innerHTML = "";
    const item = document.createElement("div");
    item.className = "list-item";
    item.tabIndex = 0;
    item.innerHTML = `
        <span>${task}</span>
        <button class="btn" style="padding: 5px 10px; background: var(--danger);" aria-label="Elimina ${task}" onclick="this.parentElement.remove(); saveData()">
            <i class="fas fa-trash"></i>
        </button>
    `;
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            item.querySelector('button').click();
        }
    });
    list.appendChild(item);

    const fullList = document.getElementById("fullTaskList");
    if (fullList.innerHTML.includes("Nessun impegno")) fullList.innerHTML = "";
    const fullItem = item.cloneNode(true);
    fullList.appendChild(fullItem);

    document.getElementById("taskInput").value = "";
    status.textContent = `Impegno aggiunto: ${task}`;
    if (save) saveData();
}

function addAppointment(app = "Nuovo Appuntamento", date = new Date().toISOString(), save = true) {
    if (!app.trim() || app === "Nuovo Appuntamento") {
        status.textContent = "Errore: Inserisci una descrizione valida.";
        speakText("Errore: Inserisci una descrizione valida.");
        return;
    }
    if (calendar) {
        calendar.addEvent({ title: app, start: date });
    }

    const list = document.getElementById("appointmentList");
    if (list.innerHTML.includes("Nessun appuntamento")) list.innerHTML = "";
    const item = document.createElement("div");
    item.className = "list-item";
    item.tabIndex = 0;
    item.innerHTML = `
        <span>${app} (${new Date(date).toLocaleString('it-IT')})</span>
        <button class="btn" style="padding: 5px 10px; background: var(--danger);" aria-label="Elimina ${app}" onclick="this.parentElement.remove(); saveData()">
            <i class="fas fa-trash"></i>
        </button>
    `;
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            item.querySelector('button').click();
        }
    });
    list.appendChild(item);

    const fullList = document.getElementById("fullAppointmentList");
    if (fullList.innerHTML.includes("Nessun appuntamento")) fullList.innerHTML = "";
    const fullItem = item.cloneNode(true);
    fullList.appendChild(fullItem);

    document.getElementById("appointmentInput").value = "";
    document.getElementById("appointmentDate").value = "";
    status.textContent = `Appuntamento aggiunto: ${app}`;
    if (save) saveData();
}

function addDeadline(title = "Nuova Scadenza", date = new Date().toISOString(), save = true) {
    if (!title.trim() || title === "Nuova Scadenza") {
        status.textContent = "Errore: Inserisci una descrizione valida.";
        speakText("Errore: Inserisci una descrizione valida.");
        return;
    }
    const list = document.getElementById("fullDeadlineList");
    if (list.innerHTML.includes("Nessuna scadenza")) list.innerHTML = "";
    const item = document.createElement("div");
    item.className = "list-item";
    item.tabIndex = 0;
    item.innerHTML = `
        <span>${title} (${new Date(date).toLocaleString('it-IT')})</span>
        <button class="btn" style="padding: 5px 10px; background: var(--danger);" aria-label="Elimina ${title}" onclick="this.parentElement.remove(); saveData()">
            <i class="fas fa-trash"></i>
        </button>
    `;
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            item.querySelector('button').click();
        }
    });
    list.appendChild(item);
    document.getElementById("deadlineInput").value = "";
    document.getElementById("deadlineDate").value = "";
    status.textContent = `Scadenza aggiunta: ${title}`;
    if (save) saveData();
}

function addNote(note = "Nuova Nota", save = true) {
    if (!note.trim() || note === "Nuova Nota") {
        status.textContent = "Errore: Inserisci una descrizione valida.";
        speakText("Errore: Inserisci una descrizione valida.");
        return;
    }
    const list = document.getElementById("noteList");
    if (list.innerHTML.includes("Nessuna nota")) list.innerHTML = "";
    const item = document.createElement("div");
    item.className = "list-item";
    item.tabIndex = 0;
    item.innerHTML = `
        <span>${note}</span>
        <button class="btn" style="padding: 5px 10px; background: var(--danger);" aria-label="Elimina ${note}" onclick="this.parentElement.remove(); saveData()">
            <i class="fas fa-trash"></i>
        </button>
    `;
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            item.querySelector('button').click();
        }
    });
    list.appendChild(item);

    const fullList = document.getElementById("fullNoteList");
    if (fullList.innerHTML.includes("Nessuna nota")) fullList.innerHTML = "";
    const fullItem = item.cloneNode(true);
    fullList.appendChild(fullItem);

    document.getElementById("noteInput").value = "";
    document.getElementById("noteContent").value = "";
    status.textContent = `Nota aggiunta: ${note}`;
    if (save) saveData();
}

function addShoppingItem(item = "Nuovo Articolo", save = true) {
    if (!item.trim() || item === "Nuovo Articolo") {
        status.textContent = "Errore: Inserisci un articolo valido.";
        speakText("Errore: Inserisci un articolo valido.");
        return;
    }
    const list = document.getElementById("shoppingList");
    if (list.innerHTML.includes("Lista vuota")) list.innerHTML = "";
    const listItem = document.createElement("div");
    listItem.className = "list-item";
    listItem.tabIndex = 0;
    listItem.innerHTML = `
        <span>${item}</span>
        <button class="btn" style="padding: 5px 10px; background: var(--danger);" aria-label="Elimina ${item}" onclick="this.parentElement.remove(); saveData()">
            <i class="fas fa-trash"></i>
        </button>
    `;
    listItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            listItem.querySelector('button').click();
        }
    });
    list.appendChild(listItem);

    const fullList = document.getElementById("fullShoppingList");
    if (fullList.innerHTML.includes("Lista vuota")) fullList.innerHTML = "";
    const fullItem = listItem.cloneNode(true);
    fullList.appendChild(fullItem);

    document.getElementById("shoppingInput").value = "";
    document.getElementById("shoppingInputFull").value = "";
    status.textContent = `Articolo aggiunto alla lista: ${item}`;
    if (save) saveData();
}

// ====================
// REGISTRAZIONI AUDIO
// ====================
let mediaRecorder = null;
let audioChunks = [];
const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");
const playBtn = document.getElementById("playBtn");
const saveBtn = document.getElementById("saveBtn");
const recorderStatus = document.getElementById("recorderStatus");

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            playBtn.onclick = () => {
                const audio = new Audio(audioUrl);
                audio.play();
            };
            playBtn.disabled = false;
            saveBtn.disabled = false;
            recorderStatus.textContent = "Registrazione fermata. Puoi ascoltarla o salvarla.";
        };
        mediaRecorder.start();
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        recorderStatus.textContent = "Registrazione in corso...";
    } catch (err) {
        recorderStatus.textContent = "Errore: Non è possibile accedere al microfono.";
        console.error(err);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        recordBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

function saveRecording() {
    const recordingName = document.getElementById("recordingName").value.trim() || `Registrazione ${new Date().toLocaleString('it-IT')}`;
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const list = document.getElementById("recordingsList");
    if (list.innerHTML.includes("Nessuna registrazione")) list.innerHTML = "";
    const item = document.createElement("div");
    item.className = "list-item";
    item.tabIndex = 0;
    item.innerHTML = `
        <span>${recordingName}</span>
        <div>
            <button class="btn" style="padding: 5px 10px;" aria-label="Ascolta ${recordingName}" onclick="new Audio('${audioUrl}').play()">
                <i class="fas fa-play"></i>
            </button>
            <button class="btn" style="padding: 5px 10px; background: var(--danger);" aria-label="Elimina ${recordingName}" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            item.querySelector('button[aria-label^="Ascolta"]').click();
        }
    });
    list.appendChild(item);
    document.getElementById("recordingName").value = "";
    audioChunks = [];
    playBtn.disabled = true;
    saveBtn.disabled = true;
    recorderStatus.textContent = `Registrazione salvata: ${recordingName}`;
}

// ====================
// BACKUP E RIPRISTINO
// ====================
function exportData() {
    const data = localStorage.getItem("nerdyData");
    if (data) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nerdy_backup_${new Date().toLocaleString('it-IT').replace(/[,:/\s]/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        status.textContent = "Dati esportati correttamente.";
    } else {
        status.textContent = "Nessun dato da esportare.";
    }
}

function importData() {
    const importFile = document.getElementById("importFile");
    importFile.click();
    importFile.onchange = () => {
        const file = importFile.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    localStorage.setItem("nerdyData", JSON.stringify(data));
                    loadData();
                    status.textContent = "Dati importati correttamente.";
                    speakText("Dati importati correttamente.");
                } catch (err) {
                    status.textContent = "Errore: File non valido.";
                    speakText("Errore: File non valido.");
                }
            };
            reader.readAsText(file);
        }
    };
}

function resetData() {
    if (confirm("Sei sicuro di voler ripristinare tutti i dati? Questa azione è irreversibile.")) {
        localStorage.removeItem("nerdyData");
        document.getElementById("taskList").innerHTML = "<p>Nessun impegno</p>";
        document.getElementById("fullTaskList").innerHTML = "<p>Nessun impegno</p>";
        document.getElementById("appointmentList").innerHTML = "<p>Nessun appuntamento</p>";
        document.getElementById("fullAppointmentList").innerHTML = "<p>Nessun appuntamento</p>";
        document.getElementById("fullDeadlineList").innerHTML = "<p>Nessuna scadenza</p>";
        document.getElementById("noteList").innerHTML = "<p>Nessuna nota</p>";
        document.getElementById("fullNoteList").innerHTML = "<p>Nessuna nota</p>";
        document.getElementById("shoppingList").innerHTML = "<p>Lista vuota</p>";
        document.getElementById("fullShoppingList").innerHTML = "<p>Lista vuota</p>";
        document.getElementById("recordingsList").innerHTML = "<p>Nessuna registrazione</p>";
        if (calendar) calendar.getEvents().forEach(event => event.remove());
        status.textContent = "Tutti i dati sono stati ripristinati.";
        speakText("Tutti i dati sono stati ripristinati.");
    }
}

// ====================
// CAMBIO TEMA
// ====================
function changeTheme(theme = document.getElementById("themeSelect").value) {
    document.body.className = theme;
    localStorage.setItem("nerdyTheme", theme);
    status.textContent = `Tema cambiato: ${theme}`;
}