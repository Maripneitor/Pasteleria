document.addEventListener('DOMContentLoaded', function () {
    // Variable global para recordar la vista anterior
    window.previousView = 'calendar';
    let currentSessionId = null; // Variable para saber en qué sesión de chat estamos
    window.currentUserRole = null; // Variable global para el rol del usuario
    let allActiveSessions = [];

    // --- VISTAS Y ELEMENTOS GLOBALES ---
    const loginView = document.getElementById('loginView');
    const appView = document.getElementById('appView');
    const calendarView = document.getElementById('calendarView');
    const formView = document.getElementById('formView');
    const userManagementView = document.getElementById('userManagementView');
    const statsView = document.getElementById('statsView');
    const loadingEl = document.getElementById('loading');
    const chatView = document.getElementById('chatView');

    const pendingView = document.getElementById('pendingView');
    const viewPendingButton = document.getElementById('viewPendingButton');
    const pendingFoliosList = document.getElementById('pendingFoliosList');
    const pendingCountBadge = document.getElementById('pending-count');
    const pendingSearchInput = document.getElementById('pendingSearchInput'); // <-- AÑADIR ESTA LÍNEA

    const manageUsersButton = document.getElementById('manageUsersButton');
    const loginForm = document.getElementById('loginForm');
    const logoutButton = document.getElementById('logoutButton');
    const newFolioButton = document.getElementById('newFolioButton');
    const viewCalendarButton = document.getElementById('viewCalendarButton');
    const viewStatsButton = document.getElementById('viewStatsButton');
    const productivityDateInput = document.getElementById('productivityDate');
    const commissionReportButton = document.getElementById('commissionReportButton');

    // --- ELEMENTOS DEL CHAT ---
    const chatTitle = document.getElementById('chat-title');
    const backToSessionsBtn = document.getElementById('backToSessionsBtn');
    const chatMessagesContainer = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const folioStatusPanel = document.getElementById('folio-status-panel');
    const generateFolioBtn = document.getElementById('generate-folio-btn');
    const manualEditBtn = document.getElementById('manual-edit-btn');

    // --- ELEMENTOS DEL FORMULARIO ---
    const folioForm = document.getElementById('folioForm'),
        formTitle = document.getElementById('formTitle'),
        clientNameInput = document.getElementById('clientName'),
        clientPhoneInput = document.getElementById('clientPhone'),
        clientPhone2Input = document.getElementById('clientPhone2'),
        deliveryDateInput = document.getElementById('deliveryDate'),
        deliveryHourSelect = document.getElementById('deliveryHour'),
        deliveryMinuteSelect = document.getElementById('deliveryMinute'),
        deliveryPeriodSelect = document.getElementById('deliveryPeriod'),
        folioTypeSelect = document.getElementById('folioType'),
        personsInput = document.getElementById('persons'),
        shapeInput = document.getElementById('shape'),
        imageInput = document.getElementById('referenceImages'),
        imagePreview = document.getElementById('imagePreview'),
        totalInput = document.getElementById('total'),
        advanceInput = document.getElementById('advancePayment'),
        balanceInput = document.getElementById('balance'),
        isPaidCheckbox = document.getElementById('isPaid'),
        addCommissionCheckbox = document.getElementById('addCommission'),
        hasExtraHeightCheckbox = document.getElementById('hasExtraHeight'),
        complementsContainer = document.getElementById('complementsContainer'),
        addComplementButton = document.getElementById('addComplementButton'),
        accessoriesInput = document.getElementById('accessories'),
        designDescriptionTextarea = document.getElementById('designDescription'),
        dedicationInput = document.getElementById('dedication'),
        deliveryCostInput = document.getElementById('deliveryCost'),
        inStorePickupCheckbox = document.getElementById('inStorePickup'),
        googleMapsLocationCheckbox = document.getElementById('googleMapsLocation'),
        streetInput = document.getElementById('street'),
        extNumberInput = document.getElementById('extNumber'),
        intNumberInput = document.getElementById('intNumber'),
        neighborhoodInput = document.getElementById('neighborhood'),
        addressFields = document.getElementById('addressFields'),
        deliveryAddressSection = document.getElementById('deliveryAddressSection'),
        cancelFormButton = document.getElementById('cancelFormButton'),
        addCakeFlavorBtn = document.getElementById('addCakeFlavorBtn'),
        addFillingBtn = document.getElementById('addFillingBtn'),
        cakeFlavorContainer = document.getElementById('cakeFlavorContainer'),
        fillingContainer = document.getElementById('fillingContainer'),
        fillingSection = document.getElementById('fillingSection'),
        selectionModal = document.getElementById('selectionModal'),
        modalTitle = document.getElementById('modalTitle'),
        modalSearch = document.getElementById('modalSearch'),
        modalList = document.getElementById('modalList'),
        modalCloseBtn = document.getElementById('modalCloseBtn'),
        modalStep1 = document.getElementById('modal-step-1'),
        modalStep2 = document.getElementById('modal-step-2'),
        modalStep2Title = document.getElementById('modal-step-2-title'),
        modalStep2List = document.getElementById('modal-step-2-list'),
        tiersTableBody = document.getElementById('tiersTableBody'),
        addTierButton = document.getElementById('addTierButton'),

        // --- NUEVO: Elementos de Gestión de Ingredientes ---
        manageIngredientsButton = document.getElementById('manageIngredientsButton'),
        ingredientManagementModal = document.getElementById('ingredientManagementModal'),
        closeIngredientModalBtn = document.getElementById('closeIngredientModal'),
        tabFlavors = document.getElementById('tabFlavors'),
        tabFillings = document.getElementById('tabFillings'),
        flavorsTabContent = document.getElementById('flavorsTabContent'),
        fillingsTabContent = document.getElementById('fillingsTabContent'),
        flavorsTableBody = document.getElementById('flavorsTableBody'),
        fillingsTableBody = document.getElementById('fillingsTableBody'),
        addNewFlavorBtn = document.getElementById('addNewFlavorBtn'),
        addNewFillingBtn = document.getElementById('addNewFillingBtn'),
        additionalList = document.getElementById('additionalList'),
        addAdditionalButton = document.getElementById('addAdditionalButton'),
        normalFields = document.getElementById('normalFields'),
        specialFields = document.getElementById('specialFields');

    // --- NUEVO: ELEMENTOS DE DICTADO ---
    const dictateOrderButton = document.getElementById('dictateOrderButton');
    const dictationModal = document.getElementById('dictationModal');
    const closeDictationModalBtn = document.getElementById('closeDictationModal');
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const dictationStatus = document.getElementById('dictationStatus');
    const recordingIndicator = document.getElementById('recordingIndicator');
    const recordingTimer = document.getElementById('recordingTimer');
    const dictationError = document.getElementById('dictationError');

    // --- NUEVO: Variables para grabación ---
    let mediaRecorder;
    let audioChunks = [];
    let timerInterval;
    let startTime;
    // --- FIN NUEVO ---

    // === INICIO NUEVO: ELEMENTOS PARA IA PROACTIVA Y ANÁLISIS VISUAL ===
    const aiSuggestionsArea = document.getElementById('aiSuggestionsArea');
    const aiWarningsDiv = document.getElementById('aiWarnings');
    const aiSuggestionsDiv = document.getElementById('aiSuggestions');
    const inspirationImageInput = document.getElementById('inspirationImage');
    const analyzeImageBtn = document.getElementById('analyzeImageBtn');
    const imageAnalysisResultDiv = document.getElementById('imageAnalysisResult');
    const analysisDescription = document.getElementById('analysisDescription');
    const analysisTechniques = document.getElementById('analysisTechniques');
    const analysisComplexity = document.getElementById('analysisComplexity');
    const analysisError = document.getElementById('analysisError');
    const analysisLoading = document.getElementById('analysisLoading');
    // === FIN NUEVO ===

    // --- MANEJO DE MODALES ---
    const dailyFoliosModal = document.getElementById('dailyFoliosModal');
    const closeDailyFoliosModalBtn = document.getElementById('closeDailyFoliosModal');
    const registerModal = document.getElementById('registerModal');
    const showRegisterModalLink = document.getElementById('showRegisterModalLink');
    const closeRegisterModalBtn = document.getElementById('closeRegisterModal');
    const registerForm = document.getElementById('registerForm');
    // --- NUEVO: REFERENCIAS A MODAL PDF ---
    const pdfViewerModal = document.getElementById('pdfViewerModal');
    const closePdfViewerBtn = document.getElementById('closePdfViewer');
    const pdfViewerTitle = document.getElementById('pdfViewerTitle');
    const pdfFrame = document.getElementById('pdfFrame');
    const prevFolioBtn = document.getElementById('prevFolioBtn');
    const nextFolioBtn = document.getElementById('nextFolioBtn');
    // --- FIN NUEVO ---

    if (closeDailyFoliosModalBtn) {
        closeDailyFoliosModalBtn.addEventListener('click', () => {
            dailyFoliosModal.classList.add('hidden');
        });
    }

    if (dailyFoliosModal) {
        dailyFoliosModal.addEventListener('click', (e) => {
            if (e.target.id === 'dailyFoliosModal') {
                dailyFoliosModal.classList.add('hidden');
            }
        });
    }

    // --- LÓGICA DE REGISTRO ---
    if (showRegisterModalLink) {
        showRegisterModalLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.classList.remove('hidden');
        });
    }

    if (closeRegisterModalBtn) {
        closeRegisterModalBtn.addEventListener('click', () => {
            registerModal.classList.add('hidden');
            registerForm.reset();
            document.getElementById('registerError').textContent = '';
        });
    }

    // --- NUEVO: Cerrar modal de registro al hacer clic fuera ---
    if (registerModal) {
        registerModal.addEventListener('click', (e) => {
            if (e.target === registerModal) {
                registerModal.classList.add('hidden');
                registerForm.reset();
                document.getElementById('registerError').textContent = '';
            }
        });
    }
    // --- FIN NUEVO ---

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const role = document.getElementById('registerRole').value;
            const errorEl = document.getElementById('registerError');

            loadingEl.classList.remove('hidden');
            errorEl.textContent = '';

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, role }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Error en el registro.');
                }

                alert('¡Usuario registrado con éxito! Ahora puedes iniciar sesión.');
                registerModal.classList.add('hidden');
                registerForm.reset();

            } catch (error) {
                errorEl.textContent = error.message;
            } finally {
                loadingEl.classList.add('hidden');
            }
        });
    }

    // --- FUNCIÓN PARA CARGAR USUARIOS ---
    async function loadUsers() {
        const userListBody = document.getElementById('userListBody');
        const authToken = localStorage.getItem('authToken');

        userListBody.innerHTML = `<tr><td colspan="5" class="text-center p-4">Cargando usuarios...</td></tr>`;

        try {
            const response = await fetch('/api/users', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) {
                let errorMsg = 'No se pudieron cargar los usuarios. Es posible que no tengas permisos.';
                try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (e) { /* ignore json parsing error */ }
                throw new Error(`${errorMsg} (Status: ${response.status})`);
            }

            const users = await response.json();
            userListBody.innerHTML = '';

            if (users.length === 0) {
                userListBody.innerHTML = `<tr><td colspan="5" class="text-center p-4">No se encontraron usuarios.</td></tr>`;
                return;
            }

            users.forEach(user => {
                const row = document.createElement('tr');
                row.className = 'border-b';
                row.innerHTML = `
                    <td class="py-2 px-4">${user.id}</td>
                    <td class="py-2 px-4">${user.username || 'N/A'}</td>
                    <td class="py-2 px-4">${user.email || 'N/A'}</td>
                    <td class="py-2 px-4" data-field="role">${user.role || 'N/A'}</td>
                    <td class="py-2 px-4">
                        <button class="text-blue-500 hover:underline text-sm edit-user-btn" data-user-id="${user.id}">Editar</button>
                        <button class="text-red-500 hover:underline text-sm ml-2 delete-user-btn" data-user-id="${user.id}">Eliminar</button>
                    </td>
                `;
                userListBody.appendChild(row);
            });

        } catch (error) {
            console.error("Error loading users:", error); // --- NUEVO: Log de error
            userListBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-red-500">${error.message}</td></tr>`;
        }
    }

    document.getElementById('userListBody').addEventListener('click', async (e) => {
        const target = e.target;
        const authToken = localStorage.getItem('authToken');
        const userId = target.dataset.userId;
        const row = target.closest('tr'); // --- NUEVO: Obtener la fila

        if (!userId || !row) return; // --- NUEVO: Salir si no hay ID o fila

        if (target.classList.contains('delete-user-btn')) {
            if (confirm(`¿Estás seguro de que quieres eliminar al usuario con ID ${userId}?`)) {
                loadingEl.classList.remove('hidden'); // --- NUEVO: Mostrar carga
                try {
                    const response = await fetch(`/api/users/${userId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message || `Error ${response.status}`); // --- NUEVO: Mejor manejo de error
                    alert(result.message);
                    loadUsers();
                } catch (error) {
                    console.error("Error deleting user:", error); // --- NUEVO: Log de error
                    alert(`Error: ${error.message}`);
                } finally {
                    loadingEl.classList.add('hidden'); // --- NUEVO: Ocultar carga
                }
            }
        }

        if (target.classList.contains('edit-user-btn')) {
            const roleCell = row.querySelector('[data-field="role"]'); // --- NUEVO: Obtener celda de rol
            const currentRole = roleCell ? roleCell.textContent : ''; // --- NUEVO: Obtener rol actual
            const newRole = prompt(`Introduce el nuevo rol para el usuario con ID ${userId} (Opciones: Administrador, Usuario):`, currentRole);

            const validRoles = ['Administrador', 'Usuario'];
            if (newRole && validRoles.includes(newRole)) {
                loadingEl.classList.remove('hidden'); // --- NUEVO: Mostrar carga
                try {
                    const response = await fetch(`/api/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ role: newRole })
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message || `Error ${response.status}`); // --- NUEVO: Mejor manejo de error
                    alert(result.message);
                    loadUsers();
                } catch (error) {
                    console.error("Error updating user:", error); // --- NUEVO: Log de error
                    alert(`Error: ${error.message}`);
                } finally {
                    loadingEl.classList.add('hidden'); // --- NUEVO: Ocultar carga
                }
            } else if (newRole !== null) { // Solo alertar si el usuario escribió algo inválido
                alert('Rol no válido. Por favor, introduce "Administrador" o "Usuario".');
            }
        }
    });

    // --- FUNCIONES DE MANEJO DE VISTAS Y SESIÓN ---
    function showView(viewToShow) {
        calendarView.classList.add('hidden');
        formView.classList.add('hidden');
        userManagementView.classList.add('hidden');
        statsView.classList.add('hidden');
        pendingView.classList.add('hidden');
        chatView.classList.add('hidden');

        if (viewToShow === 'calendar') calendarView.classList.remove('hidden');
        else if (viewToShow === 'form') formView.classList.remove('hidden');
        else if (viewToShow === 'userManagement') userManagementView.classList.remove('hidden');
        else if (viewToShow === 'stats') statsView.classList.remove('hidden');
        else if (viewToShow === 'pending') pendingView.classList.remove('hidden');
        else if (viewToShow === 'chat') chatView.classList.remove('hidden');
    }

    function showAppView(token, role) {
        loginView.classList.add('hidden');
        appView.classList.remove('hidden');
        showView('calendar');

        if (role === 'Administrador') {
            manageUsersButton.classList.remove('hidden');
            if (manageIngredientsButton) manageIngredientsButton.classList.remove('hidden'); // Mostrar botón gestión
            viewStatsButton.classList.remove('hidden');
            commissionReportButton.classList.remove('hidden');
        } else {
            manageUsersButton.classList.add('hidden');
            if (manageIngredientsButton) manageIngredientsButton.classList.add('hidden');
            viewStatsButton.classList.add('hidden');
            commissionReportButton.classList.add('hidden');
        }

        loadActiveSessions();
        loadIngredients(); // Cargar ingredientes al iniciar

        if (window.initializeCalendar) {
            window.initializeCalendar(token, role);
            setTimeout(() => {
                if (window.myAppCalendar) {
                    window.myAppCalendar.refetchEvents();
                }
            }, 100);
        }
    }

    function handleLogout() {
        localStorage.removeItem('authToken');
        appView.classList.add('hidden');
        loginView.classList.remove('hidden');
        alert("Sesión cerrada.");
    }

    async function fetchWithTimeout(resource, options = {}, timeout = 8000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    }

    function safeJsonParse(jsonString) {
        if (!jsonString) return [];
        try {
            const result = JSON.parse(jsonString);
            return Array.isArray(result) ? result : [result];
        } catch (e) {
            // Si no es JSON válido, intentar devolverlo como un array con el string original
            return typeof jsonString === 'string' ? [jsonString] : [];
        }
    }

    // === INICIO NUEVO: FUNCIONES IA PROACTIVA Y ANÁLISIS DE IMAGEN ===
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    async function getAIValidationAndSuggestions() {
        // Recolectar datos clave del formulario actual
        let hour = parseInt(deliveryHourSelect.value);
        if (deliveryPeriodSelect.value === 'PM' && hour !== 12) hour += 12;
        if (deliveryPeriodSelect.value === 'AM' && hour === 12) hour = 0;
        const deliveryTime = `${hour.toString().padStart(2, '0')}:${deliveryMinuteSelect.value}:00`;

        // Recolectar datos de tiers actuales
        const currentTiersData = Array.from(tiersTableBody.children).map((row, index) => {
            const tierState = tiersData[index] || { persons: null, panes: [], rellenos: [], notas: null };
            const personsVal = parseInt(row.querySelector('.tier-persons-input')?.value, 10) || null;
            const notasVal = row.querySelector('.tier-notes-input')?.value || null;
            return {
                persons: personsVal,
                panes: tierState.panes.filter(p => p), // Solo panes válidos
                rellenos: tierState.rellenos.filter(r => r), // Solo rellenos válidos
                notas: notasVal
            };
        });

        const currentFolioData = {
            persons: parseInt(personsInput.value) || null,
            shape: shapeInput.value || null,
            folioType: folioTypeSelect.value,
            cakeFlavor: selectedCakeFlavors, // Enviar array
            filling: selectedRellenos, // Enviar array [{name, hasCost}]
            tiers: currentTiersData, // Enviar array de objetos recolectado
            designDescription: designDescriptionTextarea.value || null,
            dedication: dedicationInput.value || null,
            accessories: accessoriesInput.value || null,
            additional: additionalItems.map(item => ({ name: `${item.quantity} x ${item.name}`, price: item.totalPrice })), // Enviar array procesado
            complements: Array.from(complementsContainer.children).map(form => ({ // Recolectar complementos
                persons: parseInt(form.querySelector('.complement-persons')?.value) || null,
                shape: form.querySelector('.complement-shape')?.value || null,
                flavor: form.querySelector('.complement-flavor')?.value || null,
                filling: form.querySelector('.complement-filling')?.value || null,
                description: form.querySelector('.complement-description')?.value || null,
            })),
            deliveryDate: deliveryDateInput.value || null,
            deliveryTime: deliveryTime,
            deliveryCost: parseFloat(deliveryCostInput.value) || 0,
            total: parseFloat(totalInput.value) || 0, // Costo base
            advancePayment: parseFloat(advanceInput.value) || 0,
            hasExtraHeight: hasExtraHeightCheckbox.checked,
            isPaid: isPaidCheckbox.checked
        };

        // Mostrar indicador sutil de carga
        aiSuggestionsArea.classList.remove('hidden');
        aiWarningsDiv.innerHTML = '<p class="italic text-gray-500 text-xs">Analizando...</p>';
        aiSuggestionsDiv.innerHTML = '';

        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch('/api/folios/validate-suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(currentFolioData) // Enviar objeto JS
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            const results = await response.json();

            // Mostrar resultados
            aiWarningsDiv.innerHTML = '';
            if (results.warnings && results.warnings.length > 0) {
                results.warnings.forEach(warning => {
                    const p = document.createElement('p');
                    p.textContent = `⚠️ ${warning}`;
                    aiWarningsDiv.appendChild(p);
                });
            } else {
                aiWarningsDiv.innerHTML = ''; // Opcional: '<p class="italic text-gray-500 text-xs">Sin advertencias.</p>'
            }

            aiSuggestionsDiv.innerHTML = '';
            if (results.suggestions && results.suggestions.length > 0) {
                results.suggestions.forEach(suggestion => {
                    const p = document.createElement('p');
                    p.textContent = `💡 ${suggestion}`;
                    aiSuggestionsDiv.appendChild(p);
                });
            } else {
                aiSuggestionsDiv.innerHTML = ''; // Opcional: '<p class="italic text-gray-500 text-xs">Sin sugerencias.</p>'
            }

            // Ocultar el área completa si ambos están vacíos
            if (aiWarningsDiv.innerHTML === '' && aiSuggestionsDiv.innerHTML === '') {
                aiSuggestionsArea.classList.add('hidden');
            }

        } catch (error) {
            console.error("Error obteniendo validación/sugerencia IA:", error);
            aiWarningsDiv.innerHTML = `<p class="text-red-500 text-xs font-medium">Error Asistente: ${error.message}</p>`;
            aiSuggestionsDiv.innerHTML = '';
        }
    }

    const debouncedGetAIValidation = debounce(getAIValidationAndSuggestions, 1500); // 1.5 segundos de espera
    // === FIN NUEVO ===

    // --- LÓGICA DEL FORMULARIO (INICIALIZACIÓN Y FUNCIONES) ---
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option'); option.value = i; option.textContent = i.toString().padStart(2, '0');
        deliveryHourSelect.appendChild(option);
    }

    function resetForm() {
        folioForm.reset();
        formTitle.textContent = 'Crear Nuevo Folio';
        delete folioForm.dataset.editingId;
        delete folioForm.dataset.originalStatus;
        delete folioForm.dataset.source; // --- NUEVO: Limpiar origen
        additionalItems = [];
        selectedFiles = [];
        existingImages = [];
        selectedCakeFlavors = [];
        selectedRellenos = [];
        tiersData = [];
        additionalList.innerHTML = '';
        imagePreview.innerHTML = '';
        renderTags(cakeFlavorContainer, [], null);
        renderTags(fillingContainer, [], null);
        tiersTableBody.innerHTML = '';
        complementsContainer.innerHTML = '';
        // Asegurarse de que los checkboxes y selects disparen sus eventos 'change' para resetear UI
        if (inStorePickupCheckbox.checked) inStorePickupCheckbox.checked = false;
        inStorePickupCheckbox.dispatchEvent(new Event('change'));
        if (googleMapsLocationCheckbox.checked) googleMapsLocationCheckbox.checked = false;
        googleMapsLocationCheckbox.dispatchEvent(new Event('change'));
        folioTypeSelect.value = 'Normal'; // Volver al valor por defecto
        folioTypeSelect.dispatchEvent(new Event('change'));
        if (isPaidCheckbox.checked) isPaidCheckbox.checked = false;
        isPaidCheckbox.dispatchEvent(new Event('change'));
        if (addCommissionCheckbox.checked) addCommissionCheckbox.checked = false;
        addCommissionCheckbox.dispatchEvent(new Event('change'));
        if (hasExtraHeightCheckbox.checked) hasExtraHeightCheckbox.checked = false;

        // === INICIO NUEVO: Resetear campos de IA ===
        if (aiSuggestionsArea) aiSuggestionsArea.classList.add('hidden');
        if (aiWarningsDiv) aiWarningsDiv.innerHTML = '';
        if (aiSuggestionsDiv) aiSuggestionsDiv.innerHTML = '';
        if (inspirationImageInput) inspirationImageInput.value = ''; // Limpiar input file
        if (analyzeImageBtn) analyzeImageBtn.disabled = true;
        if (imageAnalysisResultDiv) imageAnalysisResultDiv.classList.add('hidden');
        if (analysisDescription) analysisDescription.textContent = '';
        if (analysisTechniques) analysisTechniques.textContent = '';
        if (analysisComplexity) analysisComplexity.textContent = '';
        if (analysisError) analysisError.textContent = '';
        if (analysisLoading) analysisLoading.classList.add('hidden');
        // === FIN NUEVO ===

        updateTotals(); // Recalcular totales al final
    }

    window.populateFormForEdit = (folio) => {
        resetForm(); // Llama al reset mejorado
        folioForm.dataset.editingId = folio.id;
        folioForm.dataset.originalStatus = folio.status;

        if (folio.status === 'Pendiente') {
            formTitle.textContent = `Confirmar Folio de IA: ${folio.folioNumber || ''}`;
        } else {
            formTitle.textContent = `Editando Folio: ${folio.folioNumber}`;
        }

        folioTypeSelect.value = folio.folioType || 'Normal'; // Asegura un valor por defecto
        folioTypeSelect.dispatchEvent(new Event('change'));

        // ==================== INICIO CORRECCIÓN ERROR 'name' ====================
        clientNameInput.value = folio.client?.name || ''; // Usa Optional Chaining (?.) y valor por defecto
        clientPhoneInput.value = folio.client?.phone || ''; // Usa Optional Chaining (?.) y valor por defecto
        clientPhone2Input.value = folio.client?.phone2 || ''; // Usa Optional Chaining (?.) y valor por defecto
        // ===================== FIN CORRECCIÓN ERROR 'name' ======================

        deliveryDateInput.value = folio.deliveryDate || '';
        personsInput.value = folio.persons || '';
        shapeInput.value = folio.shape || '';

        let desc = folio.designDescription || '';
        let ded = folio.dedication || '';

        // Intenta extraer dedicatoria de la descripción si no viene separada
        if (!ded && desc) {
            const dedMatch = desc.match(/(?:diga|decir|con el texto)\s*[:"']?([^"']+)/i);
            if (dedMatch && dedMatch[1]) {
                ded = dedMatch[1].trim().replace(/['"]$/, '');
                // Remueve la parte de la dedicatoria de la descripción
                desc = desc.replace(dedMatch[0], '').replace(/,\s*$/, '').trim();
            }
        }
        designDescriptionTextarea.value = desc;
        dedicationInput.value = ded;

        accessoriesInput.value = folio.accessories || '';
        deliveryCostInput.value = (parseFloat(folio.deliveryCost) || 0).toFixed(2); // Asegura formato

        if (folio.deliveryTime) {
            const timeParts = folio.deliveryTime.split(':');
            if (timeParts.length >= 2) {
                const hour = parseInt(timeParts[0], 10);
                const minute = timeParts[1];
                if (!isNaN(hour)) {
                    const hour12 = (hour % 12) || 12;
                    deliveryHourSelect.value = hour12;
                    deliveryMinuteSelect.value = minute;
                    deliveryPeriodSelect.value = hour >= 12 ? 'PM' : 'AM';
                }
            }
        }

        isPaidCheckbox.checked = folio.isPaid || false;
        hasExtraHeightCheckbox.checked = folio.hasExtraHeight || false;

        // Populate additional items
        additionalItems = []; // Limpiar antes de llenar
        // --- NUEVO: Parseo seguro de JSON ---
        let parsedAdditional = [];
        try {
            parsedAdditional = typeof folio.additional === 'string' ? JSON.parse(folio.additional || '[]') : (folio.additional || []);
            if (!Array.isArray(parsedAdditional)) parsedAdditional = [];
        } catch (e) { console.error("Error parsing folio.additional:", e); parsedAdditional = []; }
        // --- FIN NUEVO ---

        if (parsedAdditional.length > 0) { // --- MODIFICADO: Usar parsedAdditional
            additionalItems = parsedAdditional.map(item => { // --- MODIFICADO: Usar parsedAdditional
                // Intenta parsear 'X x Nombre ($Y.YY)' o solo 'Nombre ($Y.YY)'
                const priceMatch = item.name.match(/\(\$([\d.]+)\)$/);
                const priceFromName = priceMatch ? parseFloat(priceMatch[1]) : parseFloat(item.price); // Usa el precio del objeto si no está en el nombre

                const nameWithoutPrice = priceMatch ? item.name.substring(0, priceMatch.index).trim() : item.name;

                const quantityMatch = nameWithoutPrice.match(/^(\d+)\s*x\s*(.*)/);
                let quantity = 1;
                let name = nameWithoutPrice;

                if (quantityMatch) {
                    quantity = parseInt(quantityMatch[1], 10);
                    name = quantityMatch[2].trim();
                }

                const individualPrice = (quantity > 0 && !isNaN(priceFromName)) ? priceFromName / quantity : 0;

                return {
                    name: name,
                    quantity: quantity,
                    price: individualPrice, // Precio unitario
                    totalPrice: priceFromName // Precio total del item (cantidad * precio unitario)
                };
            }).filter(item => item && !isNaN(item.totalPrice)); // Filtrar items inválidos
            renderAdditionalItems();
        }


        // Populate complements
        complementsContainer.innerHTML = ''; // Limpiar antes de llenar
        // --- NUEVO: Parseo seguro de JSON ---
        let parsedComplements = [];
        try {
            parsedComplements = typeof folio.complements === 'string' ? JSON.parse(folio.complements || '[]') : (folio.complements || []);
            if (!Array.isArray(parsedComplements)) parsedComplements = [];
        } catch (e) { console.error("Error parsing folio.complements:", e); parsedComplements = []; }
        // --- FIN NUEVO ---
        if (parsedComplements.length > 0) { // --- MODIFICADO: Usar parsedComplements
            parsedComplements.forEach(comp => addComplementRow(comp)); // --- MODIFICADO: Usar parsedComplements
        }

        // Populate flavors/fillings or tiers
        if (folio.folioType === 'Normal') {
            selectedCakeFlavors = safeJsonParse(folio.cakeFlavor);
            // --- NUEVO: Parseo seguro de JSON ---
            let parsedFilling = [];
            try {
                parsedFilling = typeof folio.filling === 'string' ? JSON.parse(folio.filling || '[]') : (folio.filling || []);
                if (!Array.isArray(parsedFilling)) parsedFilling = [];
            } catch (e) { console.error("Error parsing folio.filling:", e); parsedFilling = []; }
            // --- FIN NUEVO ---

            selectedRellenos = parsedFilling.map(r => typeof r === 'string' ? { name: r, hasCost: false } : r); // --- MODIFICADO: Usar parsedFilling
            renderTags(cakeFlavorContainer, selectedCakeFlavors, removeCakeFlavor);
            renderTags(fillingContainer, selectedRellenos, removeRelleno);
        } else if (folio.folioType === 'Base/Especial') { // --- MODIFICADO: Quitado Array.isArray(folio.tiers) ---
            tiersTableBody.innerHTML = ''; // Limpiar antes
            tiersData = []; // Limpiar antes
            // --- NUEVO: Parseo seguro de JSON ---
            let parsedTiers = [];
            try {
                parsedTiers = typeof folio.tiers === 'string' ? JSON.parse(folio.tiers || '[]') : (folio.tiers || []);
                if (!Array.isArray(parsedTiers)) parsedTiers = [];
            } catch (e) { console.error("Error parsing folio.tiers:", e); parsedTiers = []; }
            // --- FIN NUEVO ---

            parsedTiers.forEach(tier => { // --- MODIFICADO: Usar parsedTiers
                // Asegurarse de que panes y rellenos sean arrays
                tier.panes = Array.isArray(tier.panes) ? tier.panes : (tier.panes ? [tier.panes] : []);
                tier.rellenos = Array.isArray(tier.rellenos) ? tier.rellenos : (tier.rellenos ? [tier.rellenos] : []);
                addTierRow(tier);
            });
        }


        // Populate delivery location
        const location = folio.deliveryLocation || '';
        googleMapsLocationCheckbox.checked = location.includes('El cliente envía ubicación (Google Maps)');

        if (location.toLowerCase() === 'recoge en tienda') {
            inStorePickupCheckbox.checked = true;
        } else {
            inStorePickupCheckbox.checked = false;
            // Intenta extraer partes de la dirección de forma más robusta
            let addressPart = location.replace('El cliente envía ubicación (Google Maps)', '').replace(/[\(\)]/g, '').trim();

            neighborhoodInput.value = '';
            streetInput.value = '';
            extNumberInput.value = '';
            intNumberInput.value = '';

            // Extraer Colonia
            const colMatch = addressPart.match(/(?:Colonia|Col\.?)\s*([^,]+)/i);
            if (colMatch) {
                neighborhoodInput.value = colMatch[1].trim();
                addressPart = addressPart.replace(colMatch[0], '').trim().replace(/^,\s*/, '').replace(/,\s*$/, '');
            }

            // Extraer Número Exterior (puede tener letra)
            const numExtMatch = addressPart.match(/\b(\d+[A-Z]?)\b/);
            if (numExtMatch) {
                extNumberInput.value = numExtMatch[0];
                // Remover el número y comas/espacios adyacentes
                addressPart = addressPart.replace(new RegExp(`\\b${numExtMatch[0]}\\b\\s*,?|,?\\s*\\b${numExtMatch[0]}\\b`), '').trim();
            }


            // Extraer Número Interior
            const numIntMatch = addressPart.match(/(?:Int\.?|Interior)\s*(\w+)/i);
            if (numIntMatch) {
                intNumberInput.value = numIntMatch[1];
                addressPart = addressPart.replace(numIntMatch[0], '').trim().replace(/^,\s*/, '').replace(/,\s*$/, '');
            }

            // Lo que queda es la calle/referencias
            streetInput.value = addressPart.trim();
        }
        inStorePickupCheckbox.dispatchEvent(new Event('change')); // Actualiza visibilidad de campos

        // Populate images
        existingImages = []; // Limpiar antes
        if (folio.imageUrls && Array.isArray(folio.imageUrls)) {
            existingImages = folio.imageUrls.map((url, index) => ({
                url: url,
                // Asegurarse de que imageComments exista y sea un array
                comment: (folio.imageComments && Array.isArray(folio.imageComments) && folio.imageComments[index]) ? folio.imageComments[index] : ''
            }));
        }
        renderImagePreviews();

        // Populate financial fields
        // Recalcular el costo base del pastel a partir del total y los costos adicionales/envío
        const additionalTotalCost = additionalItems.reduce((sum, item) => sum + item.totalPrice, 0);

        // Recalcular costo de relleno SOLO si es Normal
        let calculatedFillingCost = 0;
        if (folio.folioType === 'Normal') {
            const numPersons = parseInt(folio.persons, 10) || 0;
            calculatedFillingCost = selectedRellenos.reduce((sum, relleno) => {
                // Asume que el objeto relleno tiene `hasCost`
                return (relleno && relleno.hasCost && numPersons > 0) ? sum + (Math.ceil(numPersons / 20) * 30) : sum; // --- MODIFICADO: Math.ceil ---
            }, 0);
        }

        // --- MODIFICADO: Lógica para costo base ---
        // Calcular costo base restando todo lo demás del total guardado (que ya incluye comisión si la hubo)
        const totalGuardado = parseFloat(folio.total) || 0;
        const deliveryGuardado = parseFloat(folio.deliveryCost) || 0;

        // Estimar subtotal sin comisión
        const subtotalSinBase = deliveryGuardado + additionalTotalCost + calculatedFillingCost;
        let costoBaseEstimado = totalGuardado - subtotalSinBase; // Esto aún puede incluir la comisión

        // Asumir que la comisión está aplicada si el checkbox (si existiera en folio) está marcado
        // O intentar inferirlo
        let comisionAplicadaEstimada = false;
        if (folio.commission?.appliedToCustomer) { // Si el backend nos da esta info
            comisionAplicadaEstimada = true;
            // Quitar la comisión del totalGuardado para obtener el costo base real
            costoBaseEstimado = (totalGuardado - subtotalSinBase) / 1.05; // Asumiendo 5% simple (ignora redondeo por ahora)
            // Esta lógica es imperfecta por el redondeo.
            // Mejor: Usar el 'total' del folio (que es el costo base)
            costoBaseEstimado = parseFloat(folio.total) || 0;

            // Si el 'total' del folio YA ES el costo base, la lógica anterior es incorrecta.
            // Asumamos que folio.total es el COSTO BASE
            costoBaseEstimado = parseFloat(folio.total) || 0;
            // Y que addCommissionCheckbox debe recalcularse basado en si el 'folio.commission' existe
            addCommissionCheckbox.checked = !!(folio.commission && folio.commission.amount > 0 && folio.commission.appliedToCustomer);

        } else {
            // Si no viene info de comisión, asumimos que total es el costo base
            costoBaseEstimado = parseFloat(folio.total) || 0;
            addCommissionCheckbox.checked = false; // Asumir no comisión si no se indica
        }

        // --- FIN MODIFICADO ---

        totalInput.value = isNaN(costoBaseEstimado) ? '0.00' : Math.max(0, costoBaseEstimado).toFixed(2); // Evitar negativos


        advanceInput.value = (parseFloat(folio.advancePayment) || 0).toFixed(2);

        // Populate commission checkbox (si tuvieras esta info guardada o desde el objeto Commission)
        // addCommissionCheckbox.checked = folio.commission?.appliedToCustomer || false; // Ejemplo si tuvieras la relación cargada

        updateTotals(); // Recalcula el balance final
    };

    // --- EVENT LISTENERS GLOBALES ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        loadingEl.classList.remove('hidden');
        document.getElementById('loginError').textContent = ''; // Limpiar error previo
        try {
            const response = await fetchWithTimeout('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al iniciar sesión');
            }
            localStorage.setItem('authToken', data.token);

            const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
            const userRole = tokenPayload.role;
            window.currentUserRole = userRole;

            showAppView(data.token, userRole);
        } catch (error) {
            document.getElementById('loginError').textContent = error.message;
        } finally {
            loadingEl.classList.add('hidden');
        }
    });

    logoutButton.addEventListener('click', handleLogout);

    newFolioButton.addEventListener('click', () => {
        window.previousView = 'calendar'; // O la vista actual
        resetForm();
        showView('form');
    });

    viewCalendarButton.addEventListener('click', () => showView('calendar'));

    cancelFormButton.addEventListener('click', () => {
        resetForm();
        showView(window.previousView || 'calendar');
        if (window.previousView === 'pending') {
            loadActiveSessions();
        } else if (window.previousView === 'chat') {
            // Si cancelas desde el form que abriste desde el chat, vuelve al chat
            showView('chat');
        }
    });


    if (manageUsersButton) {
        manageUsersButton.addEventListener('click', () => {
            showView('userManagement');
            loadUsers();
        });
    }

    viewPendingButton.addEventListener('click', () => {
        showView('pending');
        loadActiveSessions();
    });

    // --- NUEVO: Lógica del Modal de Dictado ---

    function startRecording() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                audioChunks = []; // Limpiar chunks anteriores
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = sendAudioToServer; // Llama a esta función al detener

                mediaRecorder.start();
                dictationStatus.textContent = 'Dicta los detalles del pedido...';
                dictationError.textContent = '';
                recordButton.classList.add('hidden');
                stopButton.classList.remove('hidden');
                recordingIndicator.classList.remove('hidden');

                // Iniciar temporizador
                startTime = Date.now();
                timerInterval = setInterval(() => {
                    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                    const minutes = Math.floor(elapsedTime / 60);
                    const seconds = elapsedTime % 60;
                    recordingTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }, 1000);

            })
            .catch(err => {
                console.error("Error al acceder al micrófono:", err);
                dictationStatus.textContent = 'Error al acceder al micrófono.';
                dictationError.textContent = 'Asegúrate de permitir el acceso al micrófono.';
            });
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            // Detener el stream para apagar el indicador del micrófono en el navegador
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        stopButton.classList.add('hidden');
        recordButton.classList.remove('hidden');
        recordingIndicator.classList.add('hidden');
        clearInterval(timerInterval);
        recordingTimer.textContent = '0:00';
        dictationStatus.textContent = 'Procesando audio... por favor espera.';
        // Deshabilitar botones mientras procesa
        recordButton.disabled = true;
        stopButton.disabled = true;
    }

    async function sendAudioToServer() {
        if (audioChunks.length === 0) {
            console.warn("No audio data recorded.");
            dictationStatus.textContent = 'No se grabó audio. Intenta de nuevo.';
            recordButton.disabled = false;
            stopButton.disabled = false;
            return;
        }
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Asegúrate que el backend espere este tipo
        const formData = new FormData();
        formData.append('audio', audioBlob, 'dictated_order.webm');

        const authToken = localStorage.getItem('authToken');
        loadingEl.classList.remove('hidden'); // Mostrar indicador global
        dictationError.textContent = '';

        try {
            const response = await fetch('/api/dictation/process', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Error del servidor: ${response.status}`);
            }

            console.log("Datos extraídos del dictado:", result);
            dictationModal.classList.add('hidden'); // Cerrar modal
            // Resetear estado del modal
            dictationStatus.textContent = 'Presiona "Grabar" para empezar...';
            recordButton.disabled = false;
            stopButton.disabled = false;

            // Pre-rellenar formulario y mostrarlo
            populateFormFromDictation(result);
            window.previousView = 'calendar'; // O la vista desde donde se abrió el modal
            showView('form'); // Mostrar vista del formulario

        } catch (error) {
            console.error("Error al procesar dictado:", error);
            dictationStatus.textContent = 'Error al procesar el audio.';
            dictationError.textContent = error.message;
            // Habilitar botones de nuevo en caso de error
            recordButton.disabled = false;
            stopButton.disabled = false;
        } finally {
            loadingEl.classList.add('hidden'); // Ocultar indicador global
        }
    }

    // --- NUEVO: Event Listeners para Dictado ---
    if (dictateOrderButton) {
        dictateOrderButton.addEventListener('click', () => {
            // Resetear UI del modal antes de mostrar
            dictationModal.classList.remove('hidden');
            dictationStatus.textContent = 'Presiona "Grabar" para empezar...';
            dictationError.textContent = '';
            recordButton.classList.remove('hidden');
            stopButton.classList.add('hidden');
            recordingIndicator.classList.add('hidden');
            recordButton.disabled = false;
            stopButton.disabled = false;
            clearInterval(timerInterval); // Limpiar timer por si acaso
            recordingTimer.textContent = '0:00';
        });
    }

    if (closeDictationModalBtn) {
        closeDictationModalBtn.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                stopRecording(); // Detener si está grabando al cerrar
            }
            dictationModal.classList.add('hidden');
        });
    }

    // --- NUEVO: Cerrar modal de dictado al hacer clic fuera ---
    if (dictationModal) {
        dictationModal.addEventListener('click', (e) => {
            if (e.target === dictationModal) { // Solo si el clic es en el fondo
                if (mediaRecorder && mediaRecorder.state === 'recording') stopRecording();
                dictationModal.classList.add('hidden');
            }
        });
    }
    // --- FIN NUEVO ---


    if (recordButton) {
        recordButton.addEventListener('click', startRecording);
    }

    if (stopButton) {
        stopButton.addEventListener('click', stopRecording);
    }
    // --- FIN NUEVO ---

    // --- NUEVO: Función para poblar el formulario desde el dictado ---
    // Adaptación de populateFormForEdit
    function populateFormFromDictation(extractedData) {
        resetForm(); // Limpia el formulario primero
        formTitle.textContent = 'Revisar Folio Dictado'; // Nuevo título

        // Marcar que viene de dictado (opcional, podrías usar un dataset)
        folioForm.dataset.source = 'dictation';
        folioForm.dataset.originalStatus = 'Pendiente'; // Marcar como pendiente internamente

        // Rellenar campos simples
        clientNameInput.value = extractedData.clientName || '';
        clientPhoneInput.value = extractedData.clientPhone || '';
        clientPhone2Input.value = extractedData.clientPhone2 || '';
        deliveryDateInput.value = extractedData.deliveryDate || '';
        personsInput.value = extractedData.persons || '';
        shapeInput.value = extractedData.shape || '';
        designDescriptionTextarea.value = extractedData.designDescription || '';
        dedicationInput.value = extractedData.dedication || '';
        deliveryCostInput.value = (parseFloat(extractedData.deliveryCost) || 0).toFixed(2);
        totalInput.value = (parseFloat(extractedData.total) || 0).toFixed(2); // Costo base
        advanceInput.value = (parseFloat(extractedData.advancePayment) || 0).toFixed(2);
        accessoriesInput.value = extractedData.accessories || '';
        isPaidCheckbox.checked = extractedData.isPaid || false;
        hasExtraHeightCheckbox.checked = extractedData.hasExtraHeight || false;
        addCommissionCheckbox.checked = extractedData.addCommissionToCustomer || false; // Asumiendo que la IA puede extraer esto

        // Rellenar Hora
        if (extractedData.deliveryTime) {
            const timeParts = extractedData.deliveryTime.split(':');
            if (timeParts.length >= 2) {
                const hour = parseInt(timeParts[0], 10);
                const minute = timeParts[1];
                if (!isNaN(hour)) {
                    const hour12 = (hour % 12) || 12;
                    deliveryHourSelect.value = hour12;
                    // Asegurarse de que el minuto exista en las opciones
                    const minuteOptionExists = Array.from(deliveryMinuteSelect.options).some(opt => opt.value === minute);
                    deliveryMinuteSelect.value = minuteOptionExists ? minute : '00'; // Default a 00 si no existe
                    deliveryPeriodSelect.value = hour >= 12 ? 'PM' : 'AM';
                }
            }
        }

        // Rellenar Tipo de Folio y campos dependientes
        folioTypeSelect.value = extractedData.folioType || 'Normal';
        folioTypeSelect.dispatchEvent(new Event('change')); // Disparar evento para mostrar/ocultar campos

        if (extractedData.folioType === 'Normal') {
            selectedCakeFlavors = extractedData.cakeFlavor || [];
            // Asegurar formato {name, hasCost} para rellenos
            selectedRellenos = (extractedData.filling || []).map(r => typeof r === 'string' ? { name: r, hasCost: false } : r);
            renderTags(cakeFlavorContainer, selectedCakeFlavors, removeCakeFlavor);
            renderTags(fillingContainer, selectedRellenos, removeRelleno);
        } else if (extractedData.folioType === 'Base/Especial') {
            tiersTableBody.innerHTML = '';
            tiersData = [];
            (extractedData.tiers || []).forEach(tier => addTierRow(tier));
        }

        // Rellenar Adicionales
        additionalItems = [];
        if (extractedData.additional && Array.isArray(extractedData.additional)) {
            additionalItems = extractedData.additional.map(item => {
                // Intentar extraer cantidad, nombre y precio del string o usar objeto
                let name = item.name || 'Adicional';
                let quantity = 1;
                let totalPrice = parseFloat(item.price) || 0;
                let unitPrice = totalPrice;

                const nameMatch = name.match(/^(\d+)\s*x\s*(.*)/i);
                if (nameMatch) {
                    quantity = parseInt(nameMatch[1], 10) || 1;
                    name = nameMatch[2].trim();
                }

                const priceMatch = name.match(/\(\$\s*([\d.]+)\s*\)$/);
                if (priceMatch) {
                    totalPrice = parseFloat(priceMatch[1]) || totalPrice; // Precio del string tiene prioridad
                    name = name.substring(0, priceMatch.index).trim();
                }

                unitPrice = (quantity > 0 && !isNaN(totalPrice)) ? totalPrice / quantity : 0;

                return { name, quantity, price: unitPrice, totalPrice };
            }).filter(item => item && !isNaN(item.totalPrice));
            renderAdditionalItems();
        }

        // Rellenar Complementos
        complementsContainer.innerHTML = '';
        if (extractedData.complements && Array.isArray(extractedData.complements)) {
            extractedData.complements.forEach(comp => addComplementRow(comp));
        }

        // Rellenar Entrega
        const location = extractedData.deliveryLocation || '';
        if (location.toLowerCase() === 'recoge en tienda') {
            inStorePickupCheckbox.checked = true;
        } else if (location.includes('El cliente envía ubicación')) {
            googleMapsLocationCheckbox.checked = true;
            // Intentar extraer dirección si viene entre paréntesis
            const addressMatch = location.match(/\(([^)]+)\)/);
            if (addressMatch) {
                // Lógica simple para extraer partes (puedes mejorarla)
                const parts = addressMatch[1].split(',');
                streetInput.value = parts[0]?.trim() || '';
                if (parts.length > 1 && parts[1].toLowerCase().includes('col.')) {
                    neighborhoodInput.value = parts[1].replace(/col\./i, '').trim();
                }
                // ... (extraer número si es posible) ...
            }
        } else {
            // Asumir dirección completa
            inStorePickupCheckbox.checked = false;
            googleMapsLocationCheckbox.checked = false;
            // Lógica similar para extraer partes de la dirección completa
            let addressPart = location;
            const colMatch = addressPart.match(/(?:Colonia|Col\.?)\s*([^,]+)/i);
            if (colMatch) {
                neighborhoodInput.value = colMatch[1].trim();
                addressPart = addressPart.replace(colMatch[0], '').trim().replace(/^,\s*/, '').replace(/,\s*$/, '');
            }
            const numExtMatch = addressPart.match(/\b(\d+[A-Z]?)\b/);
            if (numExtMatch) {
                extNumberInput.value = numExtMatch[0];
                addressPart = addressPart.replace(new RegExp(`\\b${numExtMatch[0]}\\b\\s*,?|,?\\s*\\b${numExtMatch[0]}\\b`), '').trim();
            }
            streetInput.value = addressPart.trim();
        }
        inStorePickupCheckbox.dispatchEvent(new Event('change'));
        googleMapsLocationCheckbox.dispatchEvent(new Event('change'));


        updateTotals(); // Recalcular balance
    }
    // --- FIN NUEVO ---


    // --- LÓGICA DEL CHAT ---
    // Esta sección permanece igual que en tu código base original
    function addMessageToChat(text, sender) {
        if (!chatMessagesContainer) return; // --- NUEVO: Chequeo de existencia
        const messageEl = document.createElement('div');
        messageEl.className = `p-2 rounded-lg max-w-[80%] break-words ${sender === 'user' ? 'bg-blue-500 text-white self-end ml-auto' : 'bg-gray-200 text-gray-800 self-start mr-auto'}`; // --- NUEVO: break-words y ml/mr-auto
        messageEl.textContent = text;
        chatMessagesContainer.appendChild(messageEl);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }

    function renderFolioStatus(data) {
        if (!folioStatusPanel) return; // --- NUEVO: Chequeo de existencia
        folioStatusPanel.innerHTML = '';
        if (!data || Object.keys(data).length === 0) { // --- NUEVO: Chequeo más robusto
            folioStatusPanel.innerHTML = '<p class="text-gray-500 italic">No hay datos extraídos aún.</p>';
            return;
        }

        const keyMap = {
            folioType: 'Tipo Folio', clientName: 'Cliente', clientPhone: 'Teléfono',
            deliveryDate: 'Fecha Entrega', deliveryTime: 'Hora Entrega', persons: 'Personas', shape: 'Forma',
            cakeFlavor: data.folioType !== 'Base/Especial' ? 'Sabores Pan' : null,
            filling: data.folioType !== 'Base/Especial' ? 'Rellenos' : null,
            tiers: data.folioType === 'Base/Especial' ? 'Estructura Pisos' : null,
            designDescription: 'Descripción Diseño', dedication: 'Dedicatoria', deliveryLocation: 'Lugar Entrega',
            deliveryCost: 'Costo Envío', total: 'Costo Pastel (Base)', advancePayment: 'Anticipo',
            accessories: 'Accesorios', additional: 'Adicionales', complements: 'Complementos',
            hasExtraHeight: 'Altura Extra', isPaid: 'Pagado Total'
        };

        for (const key in keyMap) {
            if (keyMap[key] === null) continue;
            let value = data[key];

            // --- MODIFICADO: Chequeo más robusto para valor (incluye 0 pero no string vacío) ---
            if (value !== null && value !== undefined && (value !== '' || typeof value === 'boolean' || value === 0)) {

                // --- MODIFICADO: Formateo más robusto y seguro ---
                if (key === 'tiers' && Array.isArray(value)) {
                    value = value.map((tier, i) => `P${i + 1}: ${tier.persons || '?'}p, ${tier.panes?.join('/') || 'Pan?'} / ${tier.rellenos?.join('/') || 'Relleno?'}`).join('; ');
                } else if (key === 'additional' && Array.isArray(value)) {
                    value = value.map(item => `${item.name || 'Adicional'}${item.price ? ` ($${parseFloat(item.price).toFixed(2)})` : ''}`).join(', ');
                } else if (key === 'complements' && Array.isArray(value)) {
                    value = value.map((c, i) => `C${i + 1}: ${c.persons || '?'}p ${c.flavor || 'Sabor?'}/${c.filling || 'Relleno?'}`).join('; ');
                } else if ((key === 'cakeFlavor' || key === 'filling') && Array.isArray(value)) {
                    value = value.map(item => (typeof item === 'object' ? item.name : item) || '?').join(', '); // Maneja items nulos/vacíos
                } else if (typeof value === 'boolean') {
                    value = value ? 'Sí' : 'No';
                } else if (key === 'deliveryTime' && typeof value === 'string' && value.includes(':')) {
                    const parts = value.split(':');
                    if (parts.length >= 2) {
                        let hour = parseInt(parts[0], 10); const minute = parts[1];
                        if (!isNaN(hour)) { // Chequear si hora es válida
                            const period = hour >= 12 ? 'PM' : 'AM'; hour = hour % 12 || 12;
                            value = `${hour}:${minute} ${period}`;
                        }
                    }
                } else if (typeof value === 'number' && ['total', 'advancePayment', 'deliveryCost'].includes(key)) {
                    value = `$${value.toFixed(2)}`;
                }

                if (typeof value !== 'string') value = JSON.stringify(value); // Fallback por si algo no se formateó

                if (value) { // --- NUEVO: Chequeo final de que value no sea string vacío
                    const itemEl = document.createElement('div');
                    itemEl.className = 'text-sm mb-1';
                    itemEl.innerHTML = `<strong class="text-gray-600">${keyMap[key]}:</strong> <span class="text-gray-800">${value}</span>`;
                    folioStatusPanel.appendChild(itemEl);
                }
                // --- FIN MODIFICADO ---
            }
        }
    }


    async function loadChatSession(sessionId) {
        currentSessionId = sessionId;
        loadingEl.classList.remove('hidden');
        showView('chat');
        chatMessagesContainer.innerHTML = '';
        folioStatusPanel.innerHTML = '<p class="text-gray-500 italic">Cargando datos de la sesión...</p>';
        // --- NUEVO: Habilitar botones al cargar ---
        chatInput.disabled = false;
        generateFolioBtn.disabled = false;
        manualEditBtn.disabled = false;
        // --- FIN NUEVO ---
        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`/api/ai-sessions/${sessionId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'No se pudo cargar la sesión de chat.'); }
            const session = await response.json();
            chatTitle.textContent = `Asistente - Sesión #${session.id}`;
            if (session.chatHistory && Array.isArray(session.chatHistory)) {
                session.chatHistory.forEach(msg => { if (msg.content && (msg.role === 'user' || msg.role === 'assistant')) { addMessageToChat(msg.content, msg.role); } });
            }
            renderFolioStatus(session.extractedData);
            const lastMessage = session.chatHistory?.[session.chatHistory.length - 1];
            if (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.content) {
                addMessageToChat('¡Hola! He analizado la conversación inicial. ¿Qué deseas hacer? Puedes pedirme que modifique datos ("cambia el nombre a X", "añade un piso para Y personas", etc.) o que genere el folio ("genera el folio").', 'assistant');
            }
            // --- NUEVO: Deshabilitar si está completada ---
            if (session.status === 'completed') {
                addMessageToChat("Esta sesión ya fue completada (Folio generado).", "assistant");
                chatInput.disabled = true;
                generateFolioBtn.disabled = true;
                manualEditBtn.disabled = true;
            }
            // --- FIN NUEVO ---
        } catch (error) {
            console.error("Error cargando sesión de chat:", error);
            folioStatusPanel.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
            addMessageToChat(`Error al cargar la sesión: ${error.message}`, 'assistant');
            // --- NUEVO: Deshabilitar en error ---
            chatInput.disabled = true;
            generateFolioBtn.disabled = true;
            manualEditBtn.disabled = true;
            // --- FIN NUEVO ---
        } finally {
            loadingEl.classList.add('hidden');
            chatInput.focus();
        }
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = chatInput.value.trim();
        if (!messageText || !currentSessionId) return;
        addMessageToChat(messageText, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        const thinkingEl = document.createElement('div');
        thinkingEl.className = 'p-2 rounded-lg max-w-[80%] bg-gray-200 text-gray-500 self-start mr-auto italic'; // --- MODIFICADO: Estilo
        thinkingEl.textContent = 'Pensando...';
        chatMessagesContainer.appendChild(thinkingEl);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`/api/ai-sessions/${currentSessionId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ message: messageText })
            });
            thinkingEl.remove();
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `Error del servidor: ${response.status}`); }
            const { message, sessionData } = await response.json();
            if (message && message.content) { addMessageToChat(message.content, 'assistant'); }
            else if (message && message.tool_calls) { console.log("Asistente llamó a herramienta(s), sin respuesta textual directa."); }
            if (sessionData && sessionData.extractedData) {
                renderFolioStatus(sessionData.extractedData);
                if (sessionData.status === 'completed') {
                    addMessageToChat("El folio ha sido generado. Esta sesión está completa.", "assistant");
                    chatInput.disabled = true; generateFolioBtn.disabled = true; manualEditBtn.disabled = true;
                }
            } else { console.warn("No se recibieron datos de sesión actualizados en la respuesta del chat."); }
        } catch (error) {
            thinkingEl.remove();
            console.error("Error en chat submit:", error);
            addMessageToChat(`Error: ${error.message}`, 'assistant');
        } finally {
            // --- MODIFICADO: Chequeo más robusto ---
            const sessionCompleted = generateFolioBtn.disabled;
            if (chatInput && !sessionCompleted) {
                chatInput.disabled = false;
                chatInput.focus();
            }
        }
    });

    backToSessionsBtn.addEventListener('click', () => {
        currentSessionId = null; showView('pending'); loadActiveSessions();
    });

    generateFolioBtn.addEventListener('click', () => {
        if (!currentSessionId || generateFolioBtn.disabled || chatInput.disabled) return; // --- MODIFICADO: chequeo
        chatInput.value = "Genera el folio y PDF con los datos actuales";
        chatForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); // --- MODIFICADO: bubbles/cancelable
    });

    manualEditBtn.addEventListener('click', async () => {
        if (!currentSessionId || manualEditBtn.disabled) return; // --- MODIFICADO: chequeo
        loadingEl.classList.remove('hidden');
        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`/api/ai-sessions/${currentSessionId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) throw new Error('No se pudo cargar la sesión para edición manual.');
            const session = await response.json();
            const extracted = session.extractedData || {}; // --- NUEVO: Usar objeto vacío si no hay datos
            const mockFolio = {
                id: `ai-${session.id}`, ...extracted,
                client: { name: extracted.clientName || '', phone: extracted.clientPhone || '', phone2: extracted.clientPhone2 || '' },
                cakeFlavor: JSON.stringify(extracted.cakeFlavor || []),
                filling: JSON.stringify(extracted.filling || []),
                tiers: extracted.tiers || [],
                additional: extracted.additional || [],
                complements: extracted.complements || [],
                imageUrls: session.imageUrls || [],
                imageComments: session.imageComments || [],
                status: 'Pendiente',
                deliveryCost: extracted.deliveryCost || 0,
                advancePayment: extracted.advancePayment || 0,
                total: extracted.total || 0,
                isPaid: extracted.isPaid || false,
                hasExtraHeight: extracted.hasExtraHeight || false,
            };
            window.previousView = 'chat';
            populateFormForEdit(mockFolio);
            showView('form');
        } catch (error) {
            console.error("Error preparing manual edit:", error); // --- NUEVO: Log de error
            alert(`Error al preparar edición manual: ${error.message}`);
        } finally { loadingEl.classList.add('hidden'); }
    });
    const discardSessionBtn = document.getElementById('discard-session-btn');

    if (discardSessionBtn) {
        discardSessionBtn.addEventListener('click', async () => {
            if (!currentSessionId) return;

            if (confirm(`¿Estás seguro de que deseas descartar esta sesión (${currentSessionId})? Esta acción no se puede deshacer.`)) {
                loadingEl.classList.remove('hidden');
                discardSessionBtn.disabled = true;

                try {
                    const authToken = localStorage.getItem('authToken');

                    // ===== INICIO DE LA CORRECCIÓN =====
                    // Usamos la URL absoluta para que coincida con tus otras llamadas
                    const response = await fetch(`/api/ai-sessions/${currentSessionId}`, {
                        // ===== FIN DE LA CORRECCIÓN =====
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });

                    if (!response.ok) {
                        // El error "Not Found" venía de aquí si la URL estaba mal
                        const errData = await response.json().catch(() => ({ message: response.statusText }));
                        throw new Error(errData.message || 'Error del servidor');
                    }

                    alert('Sesión descartada exitosamente.');
                    currentSessionId = null;
                    showView('pending'); // Volver a la bandeja de entrada
                    loadActiveSessions(); // Recargar la lista de sesiones

                } catch (error) {
                    // Aquí es donde viste el "Not Found"
                    alert(`Error al descartar la sesión: ${error.message}`);
                } finally {
                    loadingEl.classList.add('hidden');
                    // No re-habilitar el botón, ya que la vista cambiará
                }
            }
        });
    }
    // --- Lógica para Estadísticas ---
    function renderStatsList(elementId, data) {
        const container = document.getElementById(elementId);
        if (!container) return; // --- NUEVO: Chequeo de existencia
        container.innerHTML = '';
        if (!data || data.length === 0) { container.innerHTML = `<p class="text-gray-500 italic">No hay datos para mostrar.</p>`; return; }
        const ol = document.createElement('ol');
        ol.className = 'list-decimal list-inside space-y-1';
        data.forEach(item => { const li = document.createElement('li'); li.className = 'text-gray-700'; li.innerHTML = `${item.name || 'Desconocido'} <span class="font-bold text-gray-900">(${item.count} veces)</span>`; ol.appendChild(li); }); // --- NUEVO: Fallback para nombre
        container.appendChild(ol);
    }

    async function loadFlavorAndFillingStats() {
        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch('/api/folios/statistics', { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) throw new Error('No se pudieron cargar las estadísticas de sabores.');
            const stats = await response.json();
            renderStatsList('normalFlavorsList', stats.normal?.flavors); // --- NUEVO: Optional chaining
            renderStatsList('normalFillingsList', stats.normal?.fillings); // --- NUEVO: Optional chaining
            renderStatsList('specialFlavorsList', stats.special?.flavors); // --- NUEVO: Optional chaining
            renderStatsList('specialFillingsList', stats.special?.fillings); // --- NUEVO: Optional chaining
        } catch (error) {
            console.error(error);
            // --- NUEVO: Mostrar error en todas las listas ---
            ['normalFlavorsList', 'normalFillingsList', 'specialFlavorsList', 'specialFillingsList'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = `<p class="text-red-500">Error al cargar.</p>`;
            });
        }
    }

    async function loadProductivityStats() {
        if (!productivityDateInput || !productivityListBody) return; // --- NUEVO: Chequeo de existencia
        const date = productivityDateInput.value;
        if (!date) { // --- NUEVO: Chequeo si hay fecha
            productivityListBody.innerHTML = `<tr><td colspan="2" class="text-center p-4 text-gray-500">Selecciona una fecha.</td></tr>`;
            return;
        }
        productivityListBody.innerHTML = `<tr><td colspan="2" class="text-center p-4">Cargando...</td></tr>`;
        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`/api/folios/productivity?date=${date}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'No se pudieron cargar los datos de productividad.'); }
            const stats = await response.json();
            productivityListBody.innerHTML = '';
            if (stats.length === 0) { productivityListBody.innerHTML = `<tr><td colspan="2" class="text-center p-4">No se capturaron folios en esta fecha.</td></tr>`; return; }
            stats.forEach(userStat => {
                if (userStat.responsibleUser) {
                    const row = document.createElement('tr'); row.className = 'border-b';
                    row.innerHTML = `<td class="py-2 px-4">${userStat.responsibleUser.username || 'Desconocido'}</td><td class="py-2 px-4 font-bold">${userStat.folioCount}</td>`; // --- NUEVO: Fallback para nombre
                    productivityListBody.appendChild(row);
                } else { console.warn("Estadística encontrada sin usuario asociado:", userStat); }
            });
        } catch (error) {
            console.error("Error loading productivity stats:", error); // --- NUEVO: Log de error
            productivityListBody.innerHTML = `<tr><td colspan="2" class="text-center p-4 text-red-500">${error.message}</td></tr>`;
        }
    }

    if (viewStatsButton) {
        viewStatsButton.addEventListener('click', () => {
            showView('stats'); loadingEl.classList.remove('hidden');
            const today = new Date();
            if (productivityDateInput) productivityDateInput.value = today.toISOString().split('T')[0];
            Promise.all([loadFlavorAndFillingStats(), loadProductivityStats()])
                .catch(err => console.error("Error loading stats:", err)) // --- NUEVO: Catch general
                .finally(() => { loadingEl.classList.add('hidden'); });
        });
    }

    if (productivityDateInput) {
        productivityDateInput.addEventListener('change', loadProductivityStats);
    }

    // --- LÓGICA DEL FORMULARIO (Submit, Previews, Tags, Modales, Totales, etc.) ---
    let additionalItems = []; // Array para almacenar los adicionales
    let selectedFiles = []; // Array para archivos de imagen nuevos
    let existingImages = []; // Array para URLs de imágenes existentes al editar
    let selectedCakeFlavors = [];
    let selectedRellenos = []; // Ahora será array de objetos {name, hasCost}
    let tiersData = []; // Para almacenar estado de panes/rellenos por piso
    let currentTierIndex = -1; // Para saber qué fila de piso se está editando


    // --- NUEVO: Gestión Dinámica de Ingredientes ---
    let cakeFlavorsData = { normal: [], tier: [] };
    let rellenosData = { incluidos: {}, conCosto: {} };
    let rellenosDataEspecial = { principales: [], secundarios: [] };

    // Variables globales para acceso raw
    window.allFlavors = [];
    window.allFillings = [];

    async function loadIngredients() {
        try {
            const authToken = localStorage.getItem('authToken');

            // Cargar Sabores
            const flavorsRes = await fetch('/api/ingredients/flavors');
            const flavorsList = await flavorsRes.json();
            window.allFlavors = flavorsList;

            // Reconstruir cakeFlavorsData
            cakeFlavorsData = { normal: [], tier: [] };
            flavorsList.forEach(f => {
                if (f.isNormal) cakeFlavorsData.normal.push(f.name);
                if (f.isTier) cakeFlavorsData.tier.push(f.name);
            });

            // Cargar Rellenos
            const fillingsRes = await fetch('/api/ingredients/fillings');
            const fillingsList = await fillingsRes.json();
            window.allFillings = fillingsList;

            // Reconstruir rellenosData
            rellenosData = { incluidos: {}, conCosto: {} };
            rellenosDataEspecial = { principales: [], secundarios: [] };

            fillingsList.forEach(f => {
                // Parse options if string (should be handled by backend mostly but safety first)
                let subs = f.suboptions;
                if (typeof subs === 'string') {
                    try { subs = JSON.parse(subs); } catch (e) { subs = subs.split(',').map(s => s.trim()); }
                }

                // Populate main dictionaries
                const entry = { suboptions: subs || [] };
                if (f.isPaid) {
                    rellenosData.conCosto[f.name] = entry;
                } else {
                    rellenosData.incluidos[f.name] = entry;
                }

                // Populate Especial Lists (Logic can be refined)
                // For now add everything to principales
                rellenosDataEspecial.principales.push({ name: f.name, suboptions: subs || [] });

                // For secundarios, flatten options? Or just names?
                // Original 'secundarios' had 'Mermelada de Fresa'. 
                // We'll add the main name, AND 'Name de Suboption' combos
                rellenosDataEspecial.secundarios.push(f.name);
                if (subs && subs.length > 0) {
                    subs.forEach(s => rellenosDataEspecial.secundarios.push(`${f.name} de ${s}`));
                }
            });

            // Actualizar UI de gestión si está abierta
            if (!ingredientManagementModal.classList.contains('hidden')) {
                renderIngredientManagementLists();
            }

            console.log("Ingredientes cargados y estructuras actualizadas.");

        } catch (error) {
            console.error("Error loading ingredients:", error);
        }
    }

    // --- Lógica del Modal de Gestión ---
    function renderIngredientManagementLists() {
        // Render Sabores
        flavorsTableBody.innerHTML = '';
        window.allFlavors.forEach(f => {
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-2">${f.name}</td>
                <td class="px-4 py-2 text-center text-2xl">${f.isNormal ? '✅' : '❌'}</td>
                <td class="px-4 py-2 text-center text-2xl">${f.isTier ? '✅' : '❌'}</td>
                <td class="px-4 py-2 text-right">
                    <button class="text-red-500 hover:text-red-700 font-bold delete-flavor-btn" data-id="${f.id}">Eliminar</button>
                </td>
            `;
            flavorsTableBody.appendChild(row);
        });

        // Render Rellenos
        fillingsTableBody.innerHTML = '';
        window.allFillings.forEach(f => {
            let subs = f.suboptions;
            if (typeof subs === 'string') {
                try { subs = JSON.parse(subs); } catch (e) { subs = subs.split(','); }
            }
            const subText = Array.isArray(subs) ? subs.join(', ') : '';

            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-2">${f.name}</td>
                <td class="px-4 py-2 text-center text-2xl">${f.isPaid ? '💲' : '🆓'}</td>
                <td class="px-4 py-2 text-xs text-gray-600">${subText}</td>
                <td class="px-4 py-2 text-right">
                    <button class="text-red-500 hover:text-red-700 font-bold delete-filling-btn" data-id="${f.id}">Eliminar</button>
                </td>
            `;
            fillingsTableBody.appendChild(row);
        });
    }

    if (manageIngredientsButton) {
        manageIngredientsButton.addEventListener('click', () => {
            ingredientManagementModal.classList.remove('hidden');
            renderIngredientManagementLists();
        });
    }

    if (closeIngredientModalBtn) {
        closeIngredientModalBtn.addEventListener('click', () => {
            ingredientManagementModal.classList.add('hidden');
        });
    }

    // Tabs
    if (tabFlavors && tabFillings) {
        tabFlavors.addEventListener('click', () => {
            tabFlavors.classList.add('active-tab', 'border-red-500', 'text-red-600');
            tabFlavors.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            tabFillings.classList.remove('active-tab', 'border-red-500', 'text-red-600');
            tabFillings.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            flavorsTabContent.classList.remove('hidden');
            fillingsTabContent.classList.add('hidden');
        });

        tabFillings.addEventListener('click', () => {
            tabFillings.classList.add('active-tab', 'border-red-500', 'text-red-600');
            tabFillings.classList.remove('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            tabFlavors.classList.remove('active-tab', 'border-red-500', 'text-red-600');
            tabFlavors.classList.add('border-transparent', 'hover:text-gray-600', 'hover:border-gray-300');
            fillingsTabContent.classList.remove('hidden');
            flavorsTabContent.classList.add('hidden');
        });
    }

    // Add Flavor
    if (addNewFlavorBtn) {
        addNewFlavorBtn.addEventListener('click', async () => {
            const name = document.getElementById('newFlavorName').value.trim();
            const isNormal = document.getElementById('newFlavorIsNormal').checked;
            const isTier = document.getElementById('newFlavorIsTier').checked;
            if (!name) return alert('Ingresa un nombre');

            try {
                const authToken = localStorage.getItem('authToken');
                const res = await fetch('/api/ingredients/flavors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify({ name, isNormal, isTier })
                });
                if (res.ok) {
                    document.getElementById('newFlavorName').value = '';
                    await loadIngredients();
                } else alert('Error al agregar');
            } catch (e) { console.error(e); alert('Error'); }
        });
    }

    // Add Filling
    if (addNewFillingBtn) {
        addNewFillingBtn.addEventListener('click', async () => {
            const name = document.getElementById('newFillingName').value.trim();
            const isPaid = document.getElementById('newFillingIsPaid').checked;
            const subsVal = document.getElementById('newFillingSuboptions').value.trim();
            if (!name) return alert('Ingresa un nombre');

            try {
                const authToken = localStorage.getItem('authToken');
                const res = await fetch('/api/ingredients/fillings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify({ name, isPaid, suboptions: subsVal })
                });
                if (res.ok) {
                    document.getElementById('newFillingName').value = '';
                    document.getElementById('newFillingSuboptions').value = '';
                    await loadIngredients();
                } else alert('Error al agregar');
            } catch (e) { console.error(e); alert('Error'); }
        });
    }

    // Delegate Delete Buttons
    ingredientManagementModal.addEventListener('click', async (e) => {
        const authToken = localStorage.getItem('authToken');
        if (e.target.classList.contains('delete-flavor-btn')) {
            if (!confirm('¿Eliminar sabor?')) return;
            const id = e.target.dataset.id;
            await fetch(`/api/ingredients/flavors/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` } });
            await loadIngredients();
        }
        if (e.target.classList.contains('delete-filling-btn')) {
            if (!confirm('¿Eliminar relleno?')) return;
            const id = e.target.dataset.id;
            await fetch(`/api/ingredients/fillings/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` } });
            await loadIngredients();
        }
    });


    folioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editingId = folioForm.dataset.editingId;
        // Diferenciar si viene de IA (ID temporal) o es una edición real
        const isCreatingFromAI = editingId && editingId.startsWith('ai-');
        const isEditingExisting = editingId && !isCreatingFromAI;

        const method = isEditingExisting ? 'PUT' : 'POST'; // Siempre POST si es nuevo o desde IA
        const url = isEditingExisting ? `/api/folios/${editingId}` : '/api/folios';

        loadingEl.classList.remove('hidden');
        const authToken = localStorage.getItem('authToken');
        const formData = new FormData();

        // --- Recolección de Datos del Formulario (igual que antes) ---
        let hour = parseInt(deliveryHourSelect.value);
        if (deliveryPeriodSelect.value === 'PM' && hour !== 12) { hour += 12; }
        if (deliveryPeriodSelect.value === 'AM' && hour === 12) { hour = 0; }
        const deliveryTime = `${hour.toString().padStart(2, '0')}:${deliveryMinuteSelect.value}:00`;

        let deliveryLocation = '';
        if (inStorePickupCheckbox.checked) {
            deliveryLocation = 'Recoge en Tienda';
        } else {
            const addressParts = [
                (streetInput.value || '').trim(),
                (extNumberInput.value ? `${extNumberInput.value}` : '').trim(),
                (intNumberInput.value ? `Int. ${intNumberInput.value}` : '').trim(),
                (neighborhoodInput.value ? `Col. ${neighborhoodInput.value}` : '').trim()
            ].filter(Boolean); // Filtra partes vacías
            const address = addressParts.join(', ');

            if (googleMapsLocationCheckbox.checked) {
                deliveryLocation = `El cliente envía ubicación (Google Maps)${address ? ` (${address})` : ''}`;
            } else {
                deliveryLocation = address || 'Dirección no especificada'; // Evitar enviar vacío si no es pickup ni maps
            }
        }


        formData.append('clientName', clientNameInput.value);
        formData.append('clientPhone', clientPhoneInput.value);
        formData.append('clientPhone2', clientPhone2Input.value);
        formData.append('deliveryDate', deliveryDateInput.value);
        formData.append('deliveryTime', deliveryTime);
        formData.append('folioType', folioTypeSelect.value);
        formData.append('persons', personsInput.value);
        formData.append('shape', shapeInput.value);
        formData.append('designDescription', designDescriptionTextarea.value);
        formData.append('dedication', dedicationInput.value);
        formData.append('deliveryLocation', deliveryLocation);
        formData.append('deliveryCost', deliveryCostInput.value);
        formData.append('total', totalInput.value); // Costo base del pastel
        formData.append('advancePayment', advanceInput.value);
        formData.append('accessories', accessoriesInput.value);

        // Adicionales: asegurar que el precio total esté bien calculado
        const finalAdditionalItems = additionalItems.map(item => ({
            name: `${item.quantity} x ${item.name}`,
            price: (item.quantity * item.price).toFixed(2) // Enviar precio total calculado
        }));
        formData.append('additional', JSON.stringify(finalAdditionalItems));

        formData.append('isPaid', isPaidCheckbox.checked);
        formData.append('hasExtraHeight', hasExtraHeightCheckbox.checked);
        formData.append('addCommissionToCustomer', addCommissionCheckbox.checked);


        const complementsData = [];
        document.querySelectorAll('.complement-form').forEach(form => {
            complementsData.push({
                persons: form.querySelector('.complement-persons').value || null, // Enviar null si está vacío
                shape: form.querySelector('.complement-shape').value || null,
                flavor: form.querySelector('.complement-flavor').value || null,
                filling: form.querySelector('.complement-filling').value || null,
                description: form.querySelector('.complement-description').value || null,
            });
        });
        formData.append('complements', JSON.stringify(complementsData));

        if (folioTypeSelect.value === 'Normal') {
            formData.append('cakeFlavor', JSON.stringify(selectedCakeFlavors));
            // Asegurarse de enviar solo los nombres si selectedRellenos es array de objetos
            formData.append('filling', JSON.stringify(selectedRellenos.map(r => r.name ? { name: r.name, hasCost: r.hasCost } : { name: r, hasCost: false })));
            formData.append('tiers', '[]'); // Enviar array vacío para tiers
        } else { // Base/Especial
            formData.append('cakeFlavor', '[]'); // Enviar array vacío
            formData.append('filling', '[]');    // Enviar array vacío
            const currentTiersData = Array.from(tiersTableBody.children).map((row, index) => {
                const tierState = tiersData[index] || { persons: null, panes: [], rellenos: [], notas: null }; // Asegurar estado existe
                // Validar y limpiar datos del tier antes de enviar
                const persons = parseInt(row.querySelector('.tier-persons-input').value, 10) || null;
                const panes = tierState.panes.filter(p => p); // Eliminar nulls/vacíos
                const rellenos = tierState.rellenos.filter(r => r); // Eliminar nulls/vacíos
                const notas = row.querySelector('.tier-notes-input').value || null;

                // Asegurar estructura mínima incluso si está incompleto
                return {
                    persons: persons,
                    // Asegurar 3 panes, rellenando con null si es necesario
                    panes: [...panes, null, null, null].slice(0, 3),
                    // Asegurar 2 rellenos, rellenando con null si es necesario
                    rellenos: [...rellenos, null, null].slice(0, 2),
                    notas: notas
                };
            });
            formData.append('tiers', JSON.stringify(currentTiersData));
        }


        // Manejo de Imágenes
        if (isEditingExisting) { // Solo enviar imágenes existentes si estamos editando uno real
            formData.append('existingImageUrls', JSON.stringify(existingImages.map(img => img.url)));
            formData.append('existingImageComments', JSON.stringify(existingImages.map(img => img.comment)));
        } else {
            // Si es nuevo o desde IA, no hay 'existing'
            formData.append('existingImageUrls', '[]');
            formData.append('existingImageComments', '[]');
        }

        // Nuevas imágenes y sus comentarios
        const newImageComments = selectedFiles.map(sf => sf.comment);
        formData.append('imageComments', JSON.stringify(newImageComments)); // Comentarios para las nuevas imágenes
        selectedFiles.forEach(fileData => {
            formData.append('referenceImages', fileData.file); // Los archivos nuevos
        });


        // Establecer estado a 'Nuevo' si viene de 'Pendiente' (IA)
        if (isCreatingFromAI || folioForm.dataset.originalStatus === 'Pendiente') {
            formData.append('status', 'Nuevo');
        }

        try {
            const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${authToken}` }, body: formData });

            const responseBody = await response.text(); // Leer como texto primero
            let responseData;
            try {
                responseData = JSON.parse(responseBody); // Intentar parsear como JSON
            } catch (e) {
                // Si falla el parseo, lanzar error con el texto original
                console.error("Respuesta no es JSON:", responseBody);
                throw new Error(`Respuesta inesperada del servidor: ${responseBody}`);
            }


            if (!response.ok) {
                // Usar el mensaje del JSON parseado si existe
                throw new Error(responseData.message || `Error del servidor: ${response.status}`);
            }

            // =================================================================
            // ===== INICIO DE LA MODIFICACIÓN (Arreglo 3 y 4 Combinados) =====
            // =================================================================

            // ARREGLO 3: Descartar la sesión de IA si se creó desde el formulario manual
            if (isCreatingFromAI) {
                const sessionId = editingId.split('-')[1]; // Extraer ID (ej. "31" de "ai-31")
                console.log(`Folio creado desde IA. Descartando sesión ${sessionId}...`);

                try {
                    // Llamamos a la ruta DELETE para descartar la sesión de la bandeja de entrada
                    const deleteResponse = await fetch(`/api/ai-sessions/${sessionId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });

                    if (!deleteResponse.ok) {
                        console.warn(`Error al descartar la sesión de IA ${sessionId}. Es posible que siga apareciendo en la bandeja.`);
                    } else {
                        console.log(`Sesión de IA ${sessionId} descartada exitosamente.`);
                        // Refrescamos la lista de sesiones en segundo plano para la próxima vez que entres
                        loadActiveSessions();
                    }
                } catch (discardError) {
                    console.warn(`Error de red al descartar la sesión de IA ${sessionId}:`, discardError.message);
                }
            }

            // ARREGLO 4: Refrescar el calendario (igual que hicimos en el chat submit)
            if (window.myAppCalendar) {
                console.log('Refrescando calendario desde el formulario...');
                window.myAppCalendar.refetchEvents();
            }

            // =================================================================
            // ===== FIN DE LA MODIFICACIÓN =====
            // =================================================================

            const successMessage = (isCreatingFromAI || !isEditingExisting)
                ? '¡Folio creado con éxito!'
                : '¡Folio actualizado con éxito!';

            alert(successMessage);

            const event = new CustomEvent('folioCreated'); // Reusar el mismo evento
            window.dispatchEvent(event); // Disparar evento para actualizar calendario/listas

            // Si se creó desde IA, ahora podríamos querer marcar la sesión de IA como completada
            if (isCreatingFromAI) {
                const sessionId = editingId.split('-')[1]; // Extraer ID original de 'ai-ID'
                // Opcional: Llamar a una ruta API para marcar la sesión como 'completed'
                // fetch(`/api/ai-sessions/${sessionId}/complete`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${authToken}` } });
                console.log(`Folio creado desde la sesión de IA ${sessionId}. Considerar marcarla como completada.`);
            }


        } catch (error) {
            console.error("Error al guardar folio:", error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            loadingEl.classList.add('hidden');
        }
    });

    window.addEventListener('folioCreated', () => {
        // Decide a qué vista volver basado en `previousView`
        const returnView = window.previousView || 'calendar';
        resetForm(); // Limpiar el formulario después de guardar
        showView(returnView);

        // Recargar datos relevantes para la vista de retorno
        if (returnView === 'calendar' && window.myAppCalendar) {
            window.myAppCalendar.refetchEvents();
        } else if (returnView === 'pending' || returnView === 'chat') {
            // Si volvemos a pending o chat (aunque chat no debería ser directo), recargar sesiones
            loadActiveSessions();
            // Si específicamente volvemos al chat (quizás tras error), podríamos recargar esa sesión
            if (returnView === 'chat' && currentSessionId) {
                loadChatSession(currentSessionId);
            }
        }
    });


    function renderImagePreviews() {
        // ... (código sin cambios)
        imagePreview.innerHTML = '';

        existingImages.forEach((imgData, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'relative border rounded-md overflow-hidden shadow'; // Estilo
            wrapper.innerHTML = `
                <img src="/${imgData.url.replace(/\\/g, '/')}" alt="Imagen existente ${index + 1}" class="block w-full h-32 object-cover">
                <button type="button" class="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold delete-image-btn existing" data-index="${index}">&times;</button>
                <textarea placeholder="Comentario..." class="w-full text-xs p-1 border-t existing-comment" data-index="${index}" rows="2">${imgData.comment || ''}</textarea>
            `;
            imagePreview.appendChild(wrapper);
        });

        selectedFiles.forEach((fileData, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'relative border rounded-md overflow-hidden shadow'; // Estilo
            wrapper.innerHTML = `
                <img src="${URL.createObjectURL(fileData.file)}" alt="Nueva imagen ${index + 1}" class="block w-full h-32 object-cover">
                <button type="button" class="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold delete-image-btn new" data-index="${index}">&times;</button>
                 <textarea placeholder="Comentario..." class="w-full text-xs p-1 border-t new-comment" data-index="${index}" rows="2">${fileData.comment || ''}</textarea>
            `;
            imagePreview.appendChild(wrapper);
        });
    }

    imageInput.addEventListener('change', () => {
        // ... (código sin cambios)
        const files = Array.from(imageInput.files);
        const totalImages = selectedFiles.length + existingImages.length;
        const allowedNew = 5 - totalImages;

        if (files.length > allowedNew) {
            alert(`Solo puedes añadir ${allowedNew} imágenes más (máximo 5 en total).`);
            // Mantener solo las permitidas
            files.splice(allowedNew);
        }

        if (files.length > 0) {
            selectedFiles.push(...files.map(file => ({ file, comment: '' })));
            renderImagePreviews();
        }
        imageInput.value = ''; // Limpiar input para permitir seleccionar los mismos archivos de nuevo si se borran
    });

    imagePreview.addEventListener('click', (e) => {
        // ... (código sin cambios)
        if (e.target.classList.contains('delete-image-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            if (e.target.classList.contains('existing')) {
                if (index >= 0 && index < existingImages.length) {
                    existingImages.splice(index, 1);
                }
            } else {
                if (index >= 0 && index < selectedFiles.length) {
                    const fileData = selectedFiles[index];
                    // Revocar URL para liberar memoria
                    if (fileData.file) URL.revokeObjectURL(e.target.previousElementSibling.src);
                    selectedFiles.splice(index, 1);
                }
            }
            renderImagePreviews(); // Re-renderizar con índices actualizados
            debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
        }
    });

    imagePreview.addEventListener('input', (e) => {
        // ... (código sin cambios)
        if (e.target.tagName === 'TEXTAREA') {
            const index = parseInt(e.target.dataset.index, 10);
            if (e.target.classList.contains('existing-comment')) {
                if (existingImages[index]) existingImages[index].comment = e.target.value;
            } else if (e.target.classList.contains('new-comment')) { // Asegurar que sea el comentario de una nueva imagen
                if (selectedFiles[index]) selectedFiles[index].comment = e.target.value;
            }
            debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
        }
    });

    // --- Resto de funciones auxiliares (renderTags, modales, add/remove flavors/fillings/tiers, etc.) ---
    // ... (El código de estas funciones permanece igual que en tu base) ...
    function renderTags(container, tagsArray, onRemoveCallback) {
        if (!container) return; // --- NUEVO: Chequeo ---
        container.innerHTML = '';
        (tagsArray || []).forEach((tagData, index) => {
            const tagEl = document.createElement('div'); tagEl.className = 'tag';
            // Manejar si tagData es string u objeto {name: ..., hasCost: ...}
            const tagName = (typeof tagData === 'object' ? tagData.name : tagData) || '??'; // --- NUEVO: Fallback
            const hasCost = typeof tagData === 'object' ? tagData.hasCost : false; // Asumir no costo si es string

            tagEl.innerHTML = `<span>${tagName}${hasCost ? ' ($)' : ''}</span><button type="button" class="tag-remove-btn" data-index="${index}">&times;</button>`;
            container.appendChild(tagEl);
        });
        if (onRemoveCallback) {
            container.querySelectorAll('.tag-remove-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevenir que otros listeners se activen
                    onRemoveCallback(parseInt(e.target.dataset.index, 10));
                    // --- NUEVO: La función onRemoveCallback (ej. removeCakeFlavor) llamará a debouncedGetAIValidation ---
                });
            });
        }
    }


    function openSelectionModal(title, data, currentTags, onSelectCallback, limit) {
        if (!selectionModal) return; // --- NUEVO: Chequeo ---
        modalStep1.classList.remove('hidden');
        modalStep2.classList.add('hidden');
        modalTitle.textContent = title;
        modalSearch.value = '';

        function populateList(filter = '') {
            modalList.innerHTML = '';
            const lowerFilter = filter.toLowerCase();
            // Filtrar datos y asegurar que no se añadan duplicados (basado en nombre si son objetos)
            const currentTagNames = (currentTags || []).map(tag => (typeof tag === 'object' ? tag.name : tag).toLowerCase()); // --- NUEVO: Default a array vacío ---
            const filteredData = (data || []).filter(item => { // --- NUEVO: Default a array vacío ---
                const itemName = (typeof item === 'object' ? item.name : item).toLowerCase();
                return itemName.includes(lowerFilter) && !currentTagNames.includes(itemName);
            });


            filteredData.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'modal-list-item';
                const itemName = typeof item === 'object' ? item.name : item;
                const hasCost = typeof item === 'object' ? item.hasCost : false;
                itemEl.textContent = itemName;
                if (hasCost) itemEl.classList.add('cost-extra'); // Aplicar estilo si tiene costo

                itemEl.addEventListener('click', () => {
                    if (currentTags.length < limit) {
                        onSelectCallback(item); // Pasar el item completo (puede ser string u objeto)
                        selectionModal.classList.add('hidden');
                    } else {
                        alert(`Solo puedes seleccionar un máximo de ${limit}.`);
                    }
                });
                modalList.appendChild(itemEl);
            });
            if (filteredData.length === 0) {
                modalList.innerHTML = '<p class="text-gray-500 p-2">No hay más opciones o ya están seleccionadas.</p>';
            }
        }
        populateList();
        modalSearch.oninput = () => populateList(modalSearch.value); // Usar oninput para respuesta más rápida
        selectionModal.classList.remove('hidden');
    }

    function openRellenoModal(onSelectCallback, currentRellenos, limit) {
        if (!selectionModal) return; // --- NUEVO: Chequeo ---
        modalTitle.textContent = 'Añadir Relleno';
        modalStep1.classList.remove('hidden');
        modalStep2.classList.add('hidden');
        modalSearch.value = '';
        modalList.innerHTML = '';

        // Crear lista combinada con info de costo
        const allRellenos = [
            ...Object.keys(rellenosData.incluidos).map(name => ({ name, hasCost: false, data: rellenosData.incluidos[name] })),
            ...Object.keys(rellenosData.conCosto).map(name => ({ name, hasCost: true, data: rellenosData.conCosto[name] }))
        ];
        // Nombres de rellenos ya seleccionados para evitar duplicados
        const currentRellenoNames = (currentRellenos || []).map(r => r.name.toLowerCase()); // --- NUEVO: Default a array vacío ---


        function populateList(filter = '') {
            modalList.innerHTML = '';
            const lowerFilter = filter.toLowerCase();
            const filteredRellenos = allRellenos.filter(r =>
                r.name.toLowerCase().includes(lowerFilter) &&
                !currentRellenoNames.includes(r.name.toLowerCase()) // Evitar ya seleccionados
            );


            filteredRellenos.forEach(titular => {
                const itemEl = document.createElement('div');
                itemEl.className = 'modal-list-item';
                if (titular.hasCost) itemEl.classList.add('cost-extra');
                // Indicar si tiene subopciones
                itemEl.textContent = titular.name + (titular.data.suboptions && titular.data.suboptions.length > 0 ? ' (...)' : '');

                itemEl.addEventListener('click', () => {
                    const suboptions = titular.data.suboptions;
                    if (suboptions && suboptions.length > 0) {
                        showStep2(titular, suboptions);
                    } else {
                        if (currentRellenos.length < limit) {
                            // Pasar objeto { name, hasCost }
                            onSelectCallback({ name: titular.name, hasCost: titular.hasCost });
                            selectionModal.classList.add('hidden');
                        } else {
                            alert(`Solo puedes seleccionar un máximo de ${limit} rellenos.`);
                        }
                    }
                });
                modalList.appendChild(itemEl);
            });
            if (filteredRellenos.length === 0) {
                modalList.innerHTML = '<p class="text-gray-500 p-2">No hay más opciones o ya están seleccionadas.</p>';
            }
        }

        const showStep2 = (titular, suboptions) => {
            modalStep1.classList.add('hidden');
            modalStep2.classList.remove('hidden');
            modalTitle.textContent = `Paso 2: Elige para "${titular.name}"`;
            modalStep2Title.innerHTML = `Opción para "<b>${titular.name}</b>" <button type="button" class="back-to-step1 text-sm text-blue-600 hover:underline">(Volver)</button>`;
            modalStep2List.innerHTML = '';

            // Filtrar subopciones para evitar duplicados completos (ej. "Manjar con Nuez")
            const filteredSuboptions = suboptions.filter(sub => {
                const fullName = `${titular.name} ${titular.data.separator || 'con'} ${sub}`;
                return !currentRellenoNames.includes(fullName.toLowerCase());
            });


            filteredSuboptions.forEach(comp => {
                const compEl = document.createElement('div');
                compEl.className = 'modal-list-item';
                compEl.textContent = comp;
                compEl.addEventListener('click', () => {
                    if (currentRellenos.length < limit) {
                        const separator = titular.data.separator || 'con';
                        const finalName = `${titular.name} ${separator} ${comp}`;
                        // Pasar objeto { name, hasCost }
                        onSelectCallback({ name: finalName, hasCost: titular.hasCost });
                        selectionModal.classList.add('hidden');
                    } else {
                        alert(`Solo puedes seleccionar un máximo de ${limit} rellenos.`);
                    }
                });
                modalStep2List.appendChild(compEl);
            });

            if (filteredSuboptions.length === 0) {
                modalStep2List.innerHTML = '<p class="text-gray-500 p-2">No hay más opciones o ya están seleccionadas.</p>';
            }

            modalStep2Title.querySelector('.back-to-step1').addEventListener('click', () => {
                modalStep1.classList.remove('hidden');
                modalStep2.classList.add('hidden');
                populateList(modalSearch.value); // Volver a poblar paso 1
            });
        };

        populateList();
        modalSearch.oninput = () => populateList(modalSearch.value);
        selectionModal.classList.remove('hidden');
    }

    function openRellenoModalEspecial(onSelectCallback) {
        // ... (código sin cambios)
        if (!selectionModal) return; // --- NUEVO: Chequeo ---
        let state = { principal: null, finalPrincipal: '' };
        modalSearch.value = '';

        const showPrincipales = (filter = '') => {
            modalTitle.textContent = 'Paso 1: Elige un Relleno Principal';
            modalStep1.classList.remove('hidden');
            modalStep2.classList.add('hidden');
            modalList.innerHTML = '';

            const lowerFilter = filter.toLowerCase();
            const filteredPrincipales = rellenosDataEspecial.principales.filter(item =>
                item.name.toLowerCase().includes(lowerFilter)
            );

            filteredPrincipales.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'modal-list-item';
                itemEl.textContent = item.name + (item.suboptions && item.suboptions.length > 0 ? ` (...)` : '');
                itemEl.addEventListener('click', () => {
                    state.principal = item;
                    if (item.suboptions && item.suboptions.length > 0) {
                        showPrincipalSuboptions();
                    } else {
                        state.finalPrincipal = item.name;
                        showSecundarios();
                    }
                });
                modalList.appendChild(itemEl);
            });
            if (filteredPrincipales.length === 0) {
                modalList.innerHTML = '<p class="text-gray-500 p-2">No hay opciones.</p>';
            }
            selectionModal.classList.remove('hidden');
        };

        const showPrincipalSuboptions = () => {
            modalStep1.classList.add('hidden');
            modalStep2.classList.remove('hidden');
            modalTitle.textContent = `Elige una opción para "${state.principal.name}"`;
            modalStep2Title.innerHTML = `Opción para "<b>${state.principal.name}</b>" <button type="button" class="back-to-step1 text-sm text-blue-600 hover:underline">(Volver)</button>`;
            modalStep2List.innerHTML = '';

            state.principal.suboptions.forEach(subItem => {
                const itemEl = document.createElement('div');
                itemEl.className = 'modal-list-item';
                itemEl.textContent = subItem;
                itemEl.addEventListener('click', () => {
                    const separator = state.principal.separator || ' con '; // Default a ' con '
                    state.finalPrincipal = `${state.principal.name}${separator}${subItem}`;
                    showSecundarios();
                });
                modalStep2List.appendChild(itemEl);
            });
            modalStep2Title.querySelector('.back-to-step1').addEventListener('click', () => {
                modalStep1.classList.remove('hidden');
                modalStep2.classList.add('hidden');
                showPrincipales(modalSearch.value);
            });
        };


        const showSecundarios = () => {
            modalStep1.classList.add('hidden');
            modalStep2.classList.remove('hidden');
            modalTitle.textContent = 'Paso 2: Elige un Relleno Secundario (Opcional)';
            modalStep2Title.innerHTML = `Principal: "<b>${state.finalPrincipal}</b>" <button type="button" class="back-to-step1-from-sec text-sm text-blue-600 hover:underline">(Cambiar Principal)</button>`;
            modalStep2List.innerHTML = '';

            // Opción para no añadir secundario
            const noSecundarioEl = document.createElement('div');
            noSecundarioEl.className = 'modal-list-item italic text-gray-500';
            noSecundarioEl.textContent = '(Sin relleno secundario)';
            noSecundarioEl.addEventListener('click', () => {
                onSelectCallback([state.finalPrincipal]); // Solo el principal
                selectionModal.classList.add('hidden');
            });
            modalStep2List.appendChild(noSecundarioEl);


            rellenosDataEspecial.secundarios.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'modal-list-item';
                itemEl.textContent = item;
                itemEl.addEventListener('click', () => {
                    onSelectCallback([state.finalPrincipal, item]); // Ambos rellenos
                    selectionModal.classList.add('hidden');
                });
                modalStep2List.appendChild(itemEl);
            });

            modalStep2Title.querySelector('.back-to-step1-from-sec').addEventListener('click', () => {
                // Volver al paso anterior correcto (subopciones o principales)
                if (state.principal.suboptions && state.principal.suboptions.length > 0) {
                    showPrincipalSuboptions();
                } else {
                    modalStep1.classList.remove('hidden');
                    modalStep2.classList.add('hidden');
                    showPrincipales(modalSearch.value);
                }
            });
        };

        showPrincipales();
        modalSearch.oninput = () => showPrincipales(modalSearch.value);
    }


    modalCloseBtn.addEventListener('click', () => selectionModal.classList.add('hidden'));

    function addCakeFlavor(flavor) {
        if (selectedCakeFlavors.length < 2 && !selectedCakeFlavors.includes(flavor)) {
            selectedCakeFlavors.push(flavor);
            renderTags(cakeFlavorContainer, selectedCakeFlavors, removeCakeFlavor);
            checkRestrictions();
            debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
        } else if (selectedCakeFlavors.length >= 2) {
            alert("Solo puedes seleccionar un máximo de 2 sabores.");
        }
    }
    function removeCakeFlavor(index) {
        selectedCakeFlavors.splice(index, 1);
        renderTags(cakeFlavorContainer, selectedCakeFlavors, removeCakeFlavor);
        checkRestrictions();
        debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
    }

    function addRelleno(rellenoObj) { // Ahora recibe { name, hasCost }
        if (selectedRellenos.length < 2 && !selectedRellenos.some(r => r.name === rellenoObj.name)) {
            selectedRellenos.push(rellenoObj);
            renderTags(fillingContainer, selectedRellenos, removeRelleno); // Renderizará objetos
            updateTotals();
            debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
        } else if (selectedRellenos.length >= 2) {
            alert("Solo puedes seleccionar un máximo de 2 rellenos.");
        }
    }
    function removeRelleno(index) {
        selectedRellenos.splice(index, 1);
        renderTags(fillingContainer, selectedRellenos, removeRelleno);
        updateTotals();
        debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
    }


    addCakeFlavorBtn.addEventListener('click', () => openSelectionModal('Sabor de Pan', cakeFlavorsData.normal, selectedCakeFlavors, addCakeFlavor, 2));
    addFillingBtn.addEventListener('click', () => openRellenoModal(addRelleno, selectedRellenos, 2));

    function checkRestrictions() {
        // ... (código sin cambios)
        const hasNoFillingPan = selectedCakeFlavors.some(flavor => ['Pastel de queso', 'Queso/Flan'].includes(flavor));
        const isMilHojas = selectedCakeFlavors.includes('Mil Hojas');

        const isDisabled = hasNoFillingPan || isMilHojas;
        fillingSection.classList.toggle('disabled-section', isDisabled);
        addFillingBtn.disabled = isDisabled; // Deshabilitar botón también

        designDescriptionTextarea.disabled = isMilHojas;

        if (isDisabled && selectedRellenos.length > 0) {
            // Si se deshabilita y había rellenos, limpiarlos
            selectedRellenos = [];
            renderTags(fillingContainer, selectedRellenos, removeRelleno);
            updateTotals();
        }

        if (isMilHojas) {
            designDescriptionTextarea.value = "Mil Hojas no lleva diseño";
        } else if (designDescriptionTextarea.value === "Mil Hojas no lleva diseño") {
            // Limpiar si deja de ser Mil Hojas
            designDescriptionTextarea.value = "";
        }
        debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
    }

    inStorePickupCheckbox.addEventListener('change', function () {
        const isPickup = this.checked;
        deliveryAddressSection.classList.toggle('hidden', isPickup);
        deliveryCostInput.readOnly = isPickup;
        googleMapsLocationCheckbox.disabled = isPickup; // Deshabilitar si es pickup

        if (isPickup) {
            deliveryCostInput.value = '0.00'; // Establecer a 0.00
            googleMapsLocationCheckbox.checked = false; // Desmarcar maps
            // Limpiar campos de dirección
            streetInput.value = '';
            extNumberInput.value = '';
            intNumberInput.value = '';
            neighborhoodInput.value = '';
        }
        googleMapsLocationCheckbox.dispatchEvent(new Event('change')); // Actualizar visibilidad de campos de dirección
        updateTotals();
        debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
    });

    googleMapsLocationCheckbox.addEventListener('change', function () {
        // Ocultar campos de dirección específicos si se marca "Google Maps"
        addressFields.classList.toggle('hidden', this.checked);
        if (this.checked) {
            // Opcional: Limpiar campos cuando se marca
            // streetInput.value = '';
            // extNumberInput.value = '';
            // intNumberInput.value = '';
            // neighborhoodInput.value = '';
        }
        debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
    });


    function getGrandTotal() {
        const baseCakeCost = parseFloat(totalInput.value) || 0;
        const delivery = parseFloat(deliveryCostInput.value) || 0;
        const additionalTotal = additionalItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0); // Usar totalPrice

        let calculatedFillingCost = 0;
        if (folioTypeSelect.value === 'Normal') {
            const personsValue = parseFloat(personsInput.value) || 0;
            // Calcular costo basado en los objetos {name, hasCost}
            calculatedFillingCost = selectedRellenos.reduce((sum, relleno) => {
                return (relleno && relleno.hasCost && personsValue > 0) ? sum + (Math.ceil(personsValue / 20) * 30) : sum; // Ceil para cobrar por fracción
            }, 0);
        }
        // Nota: El costo de relleno para Base/Especial podría necesitar lógica diferente si aplica.

        const subtotalForCommission = baseCakeCost + delivery + additionalTotal + calculatedFillingCost;

        let commissionCost = 0;
        if (addCommissionCheckbox.checked) {
            const commission = subtotalForCommission * 0.05;
            // Redondear comisión hacia arriba a la decena más cercana
            commissionCost = Math.ceil(commission / 10) * 10;
        }

        return subtotalForCommission + commissionCost;
    }

    function calculateBalance() {
        const grandTotal = getGrandTotal();
        const advance = parseFloat(advanceInput.value) || 0;
        balanceInput.value = (grandTotal - advance).toFixed(2);
    }

    function updateTotals() {
        const grandTotal = getGrandTotal();
        if (isPaidCheckbox.checked) {
            advanceInput.value = grandTotal.toFixed(2);
            advanceInput.readOnly = true; // Asegurar que sea readonly
        } else {
            advanceInput.readOnly = false; // Asegurar que sea editable
        }
        calculateBalance(); // Siempre recalcular balance
    }

    // --- NUEVO: Lista de campos que disparan validación IA ---
    const fieldsToWatchForAI = [
        clientNameInput, clientPhoneInput, clientPhone2Input, deliveryDateInput, deliveryHourSelect, deliveryMinuteSelect, deliveryPeriodSelect,
        folioTypeSelect, personsInput, shapeInput, accessoriesInput, designDescriptionTextarea, dedicationInput,
        deliveryCostInput, inStorePickupCheckbox, googleMapsLocationCheckbox, streetInput, extNumberInput, intNumberInput, neighborhoodInput,
        totalInput, advanceInput, isPaidCheckbox, addCommissionCheckbox, hasExtraHeightCheckbox
    ];

    fieldsToWatchForAI.forEach(input => {
        if (input) { // Verificar que el elemento exista
            const eventType = (input.tagName === 'SELECT' || input.type === 'checkbox' || input.type === 'date') ? 'change' : 'input';
            input.addEventListener(eventType, debouncedGetAIValidation);
        }
    });

    // Observar cambios en contenedores de tags/tablas para IA
    [cakeFlavorContainer, fillingContainer, additionalList, tiersTableBody, complementsContainer].forEach(container => {
        if (container) {
            const observer = new MutationObserver(debouncedGetAIValidation);
            observer.observe(container, { childList: true, subtree: true });
            if (container.tagName === 'TBODY' || container.id === 'complementsContainer') {
                container.addEventListener('input', debouncedGetAIValidation);
                container.addEventListener('change', debouncedGetAIValidation);
            }
        }
    });
    // --- FIN NUEVO ---


    [totalInput, deliveryCostInput, personsInput, advanceInput].forEach(input => input.addEventListener('input', updateTotals));
    isPaidCheckbox.addEventListener('change', updateTotals); // Usar updateTotals directamente
    addCommissionCheckbox.addEventListener('change', updateTotals);
    // Recalcular si cambian rellenos (por costo) o tipo de folio
    fillingContainer.addEventListener('DOMSubtreeModified', updateTotals);
    folioTypeSelect.addEventListener('change', updateTotals);


    function renderAdditionalItems() {
        // ... (código sin cambios)
        additionalList.innerHTML = '';
        additionalItems.forEach((item, index) => {
            // Asegurarse de que totalPrice esté calculado
            item.totalPrice = (item.quantity || 0) * (item.price || 0);
            const li = document.createElement('li');
            li.className = 'text-sm text-gray-700 flex justify-between items-center';
            li.innerHTML = `
                 <span>${item.quantity} x ${item.name} (@ $${(item.price || 0).toFixed(2)}) = <strong>$${item.totalPrice.toFixed(2)}</strong></span>
                 <button type="button" class="remove-additional-btn text-red-500 ml-2 font-bold" data-index="${index}">[X]</button>`;
            additionalList.appendChild(li);
        });
    }

    addAdditionalButton.addEventListener('click', () => {
        // ... (código sin cambios)
        const nameInput = document.getElementById('additionalName');
        const quantityInput = document.getElementById('additionalQuantity');
        const priceInput = document.getElementById('additionalPrice');

        const name = nameInput.value.trim();
        const quantity = parseInt(quantityInput.value, 10);
        const price = parseFloat(priceInput.value); // Precio unitario

        if (name && quantity > 0 && !isNaN(price) && price >= 0) {
            additionalItems.push({ name, quantity, price, totalPrice: quantity * price }); // Guardar precio unitario y total
            renderAdditionalItems();
            updateTotals(); // Recalcular total general y balance
            // Limpiar inputs
            nameInput.value = '';
            quantityInput.value = '1';
            priceInput.value = '';
            nameInput.focus(); // Foco en el nombre para el siguiente item
            debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
        } else {
            alert('Por favor, completa la descripción (texto), cantidad (>0) y precio unitario (>=0) del adicional.');
        }
    });

    additionalList.addEventListener('click', (e) => {
        // ... (código sin cambios)
        if (e.target.classList.contains('remove-additional-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            if (index >= 0 && index < additionalItems.length) {
                additionalItems.splice(index, 1);
                renderAdditionalItems();
                updateTotals(); // Recalcular
                debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
            }
        }
    });


    function addTierRow(tier = null) {
        const index = tiersData.length;
        // Crear estado inicial seguro
        const initialTierData = {
            persons: tier?.persons || '',
            panes: Array.isArray(tier?.panes) ? tier.panes.filter(p => p) : [], // Limpiar nulls/vacíos
            rellenos: Array.isArray(tier?.rellenos) ? tier.rellenos.filter(r => r) : [], // Limpiar nulls/vacíos
            notas: tier?.notas || ''
        };
        tiersData.push(initialTierData);

        const row = document.createElement('tr');
        row.className = 'tier-row border-b align-top'; // align-top para mejor layout
        row.dataset.index = index;
        row.innerHTML = `
             <td class="p-2 w-1/5"><input type="number" step="5" min="0" class="tier-persons-input bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2" placeholder="Personas" value="${initialTierData.persons}"></td>
             <td class="p-2 w-2/5">
                 <div class="tag-container panes-container mb-1"></div>
                 <button type="button" class="add-tier-pane-btn text-xs text-blue-600 hover:text-blue-800 font-medium">+ Pan (Máx 3)</button>
             </td>
             <td class="p-2 w-2/5">
                 <div class="tag-container fillings-container mb-1"></div>
                 <button type="button" class="add-tier-filling-btn text-xs text-blue-600 hover:text-blue-800 font-medium">+ Relleno (Máx 2)</button>
             </td>
             <td class="p-2 w-1/5"><input type="text" class="tier-notes-input bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2" placeholder="Notas/Forma" value="${initialTierData.notas}"></td>
             <td class="p-1 text-center"><button type="button" class="remove-tier-button text-red-500 font-bold px-2 text-lg hover:text-red-700">X</button></td>
         `;

        // Renderizar tags iniciales
        renderTags(row.querySelector('.panes-container'), initialTierData.panes, (tagIndex) => removeTierPane(index, tagIndex));
        renderTags(row.querySelector('.fillings-container'), initialTierData.rellenos, (tagIndex) => removeTierFilling(index, tagIndex));

        tiersTableBody.appendChild(row);
    }


    folioTypeSelect.addEventListener('change', function () {
        // ... (código sin cambios)
        const isSpecial = this.value === 'Base/Especial';
        normalFields.classList.toggle('hidden', isSpecial);
        specialFields.classList.toggle('hidden', !isSpecial);

        if (isSpecial) {
            // Si cambiamos a Especial y no hay filas, añadir una
            if (tiersTableBody.children.length === 0) {
                addTierRow();
            }
            // Limpiar sabores y rellenos normales si existían
            if (selectedCakeFlavors.length > 0 || selectedRellenos.length > 0) {
                selectedCakeFlavors = [];
                selectedRellenos = [];
                renderTags(cakeFlavorContainer, [], null);
                renderTags(fillingContainer, [], null);
            }
        } else { // Si cambiamos a Normal
            // Limpiar estructura de pisos si existía
            if (tiersData.length > 0) {
                tiersData = [];
                tiersTableBody.innerHTML = '';
            }
        }
        updateTotals(); // Recalcular costos (ej. costo de relleno normal)
    });
    addTierButton.addEventListener('click', () => { addTierRow(); debouncedGetAIValidation(); }); // --- NUEVO: Llamar validación ---

    const removeTierPane = (tierIndex, tagIndex) => {
        // ... (código sin cambios)
        if (tierIndex >= 0 && tierIndex < tiersData.length) {
            tiersData[tierIndex].panes.splice(tagIndex, 1);
            const row = tiersTableBody.querySelector(`tr[data-index="${tierIndex}"]`);
            if (row) {
                renderTags(row.querySelector('.panes-container'), tiersData[tierIndex].panes, (newTagIndex) => removeTierPane(tierIndex, newTagIndex));
            }
            debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
        }
    };
    const removeTierFilling = (tierIndex, tagIndex) => {
        // ... (código sin cambios)
        if (tierIndex >= 0 && tierIndex < tiersData.length) {
            tiersData[tierIndex].rellenos.splice(tagIndex, 1);
            const row = tiersTableBody.querySelector(`tr[data-index="${tierIndex}"]`);
            if (row) {
                renderTags(row.querySelector('.fillings-container'), tiersData[tierIndex].rellenos, (newTagIndex) => removeTierFilling(tierIndex, newTagIndex));
            }
            // updateTotals(); // Rellenos especiales podrían no afectar costo total directamente aquí
            debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
        }
    };

    tiersTableBody.addEventListener('click', function (e) {
        // ... (código sin cambios, asegurando que addTierPane/Filling funcionen)
        const target = e.target;
        const row = target.closest('.tier-row');
        if (!row) return;

        currentTierIndex = parseInt(row.dataset.index, 10);
        // Asegurar que el índice es válido
        if (isNaN(currentTierIndex) || currentTierIndex < 0 || currentTierIndex >= tiersData.length) {
            console.error("Índice de piso inválido:", currentTierIndex);
            return;
        }

        const addTierPane = (flavor) => {
            // No añadir si ya está o si se alcanzó el límite
            if (tiersData[currentTierIndex].panes.length < 3 && !tiersData[currentTierIndex].panes.includes(flavor)) {
                tiersData[currentTierIndex].panes.push(flavor);
                renderTags(row.querySelector('.panes-container'), tiersData[currentTierIndex].panes, (tagIndex) => removeTierPane(currentTierIndex, tagIndex));
                debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
            } else if (tiersData[currentTierIndex].panes.length >= 3) {
                alert("Máximo 3 panes por piso.");
            }
        };

        const addTierFilling = (rellenosSeleccionados) => { // Recibe array de 1 o 2 rellenos
            if (rellenosSeleccionados && rellenosSeleccionados.length > 0 && rellenosSeleccionados.length <= 2) {
                // Reemplazar los rellenos actuales por los nuevos seleccionados
                tiersData[currentTierIndex].rellenos = rellenosSeleccionados;
                renderTags(row.querySelector('.fillings-container'), tiersData[currentTierIndex].rellenos, (tagIndex) => removeTierFilling(currentTierIndex, tagIndex));
                // updateTotals(); // Podría recalcular si rellenos especiales tuvieran costo asociado
                debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
            } else if (rellenosSeleccionados.length > 2) {
                alert("Máximo 2 rellenos por piso.");
            }
        };


        if (target.classList.contains('add-tier-pane-btn')) {
            openSelectionModal(
                `Panes Piso ${currentTierIndex + 1}`,
                cakeFlavorsData.tier,
                tiersData[currentTierIndex].panes,
                addTierPane,
                3 // Límite de panes
            );
        } else if (target.classList.contains('add-tier-filling-btn')) {
            // Limpiar rellenos existentes antes de abrir modal para reemplazarlos
            tiersData[currentTierIndex].rellenos = [];
            renderTags(row.querySelector('.fillings-container'), [], (tagIndex) => removeTierFilling(currentTierIndex, tagIndex));
            // Abrir modal especial que devuelve un array de 1 o 2 rellenos
            openRellenoModalEspecial(addTierFilling);
        } else if (target.classList.contains('remove-tier-button')) {
            if (confirm(`¿Eliminar piso ${currentTierIndex + 1}?`)) {
                tiersData.splice(currentTierIndex, 1); // Eliminar del array de datos
                row.remove(); // Eliminar del DOM
                // Re-indexar las filas restantes en el DOM y en los datos si es necesario (o manejarlo al guardar)
                Array.from(tiersTableBody.children).forEach((r, i) => r.dataset.index = i);
                // updateTotals(); // Recalcular si personas afectan total
                debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
            }
        }
        // Delegación para botones de eliminar tags dentro de los tiers
        else if (target.classList.contains('tag-remove-btn')) {
            const tagContainer = target.closest('.tag-container');
            const tagIndex = parseInt(target.dataset.index, 10);
            if (tagContainer.classList.contains('panes-container')) {
                removeTierPane(currentTierIndex, tagIndex); // Esta función ya llama a debounce
            } else if (tagContainer.classList.contains('fillings-container')) {
                removeTierFilling(currentTierIndex, tagIndex); // Esta función ya llama a debounce
            }
        }

    });

    function addComplementRow(complement = null) {
        // ... (código sin cambios)
        const complementIndex = complementsContainer.children.length;
        const formWrapper = document.createElement('div');
        formWrapper.className = 'complement-form relative space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50 mb-4'; // Añadir mb-4
        formWrapper.dataset.index = complementIndex;

        formWrapper.innerHTML = `
            <button type="button" class="absolute top-2 right-2 remove-complement-btn text-red-500 font-bold text-lg hover:text-red-700">X</button>
            <h4 class="text-md font-semibold text-gray-600 border-b pb-1 mb-2">Complemento ${complementIndex + 1}</h4>
            <div class="grid md:grid-cols-4 gap-4">
                <div>
                    <label class="block mb-1 text-xs font-medium text-gray-600">Personas</label>
                    <input type="number" step="5" min="0" class="complement-persons bg-white border border-gray-300 text-sm rounded-lg block w-full p-2" value="${complement?.persons || ''}">
                </div>
                <div>
                    <label class="block mb-1 text-xs font-medium text-gray-600">Forma</label>
                    <input type="text" class="complement-shape bg-white border border-gray-300 text-sm rounded-lg block w-full p-2" value="${complement?.shape || ''}">
                </div>
                <div>
                    <label class="block mb-1 text-xs font-medium text-gray-600">Sabor Pan</label>
                    <input type="text" class="complement-flavor bg-white border border-gray-300 text-sm rounded-lg block w-full p-2" value="${complement?.flavor || ''}">
                </div>
                <div>
                    <label class="block mb-1 text-xs font-medium text-gray-600">Relleno</label>
                    <input type="text" class="complement-filling bg-white border border-gray-300 text-sm rounded-lg block w-full p-2" value="${complement?.filling || ''}">
                </div>
            </div>
            <div>
                <label class="block mb-1 text-xs font-medium text-gray-600">Descripción</label>
                <textarea rows="2" class="complement-description block p-2 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300">${complement?.description || ''}</textarea>
            </div>
        `;
        complementsContainer.appendChild(formWrapper);

        formWrapper.querySelector('.remove-complement-btn').addEventListener('click', () => {
            if (confirm(`¿Eliminar Complemento ${parseInt(formWrapper.dataset.index) + 1}?`)) {
                formWrapper.remove();
                // Re-numerar los títulos de los complementos restantes
                document.querySelectorAll('#complementsContainer .complement-form').forEach((form, index) => {
                    form.dataset.index = index; // Actualizar índice del dataset
                    form.querySelector('h4').textContent = `Complemento ${index + 1}`;
                });
                debouncedGetAIValidation(); // --- NUEVO: Llamar validación ---
            }
        });
    }

    addComplementButton.addEventListener('click', () => { addComplementRow(); debouncedGetAIValidation(); }); // --- NUEVO: Llamar validación ---

    // === INICIO NUEVO: Listeners para Análisis de Imagen ===
    if (inspirationImageInput) {
        inspirationImageInput.addEventListener('change', () => {
            if (analyzeImageBtn) analyzeImageBtn.disabled = !inspirationImageInput.files || inspirationImageInput.files.length === 0;
            // Limpiar análisis previo si se cambia la imagen
            if (imageAnalysisResultDiv) imageAnalysisResultDiv.classList.add('hidden');
            if (analysisDescription) analysisDescription.textContent = '';
            if (analysisTechniques) analysisTechniques.textContent = '';
            if (analysisComplexity) analysisComplexity.textContent = '';
            if (analysisError) analysisError.textContent = '';
            if (analysisLoading) analysisLoading.classList.add('hidden');
        });
    }

    if (analyzeImageBtn) {
        analyzeImageBtn.addEventListener('click', async () => {
            const file = inspirationImageInput.files[0];
            if (!file) {
                alert("Por favor, selecciona una imagen primero.");
                return;
            }

            const formData = new FormData();
            formData.append('inspirationImage', file);

            // Mostrar carga, ocultar resultado previo, limpiar error
            if (analysisLoading) analysisLoading.classList.remove('hidden');
            if (imageAnalysisResultDiv) imageAnalysisResultDiv.classList.add('hidden');
            if (analysisError) analysisError.textContent = '';
            analyzeImageBtn.disabled = true; // Deshabilitar mientras analiza

            try {
                const authToken = localStorage.getItem('authToken');
                const response = await fetch('/api/folios/analyze-image', { // Usa la ruta correcta
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}` }, // No 'Content-Type' con FormData
                    body: formData
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || `Error del servidor: ${response.status}`);
                }

                // Mostrar resultados
                if (analysisDescription) analysisDescription.innerHTML = `<strong>Descripción:</strong> ${result.description || 'N/A'}`;
                if (analysisTechniques) analysisTechniques.innerHTML = `<strong>Técnicas Probables:</strong> ${(result.techniques && result.techniques.length > 0) ? result.techniques.join(', ') : 'N/A'}`;
                if (analysisComplexity) analysisComplexity.innerHTML = `<strong>Complejidad:</strong> ${result.complexity || 'N/A'} (${result.complexity_reason || 'sin detalle'})`;
                if (imageAnalysisResultDiv) imageAnalysisResultDiv.classList.remove('hidden');

            } catch (error) {
                console.error("Error analizando imagen:", error);
                if (analysisError) analysisError.textContent = `Error: ${error.message}`;
                if (imageAnalysisResultDiv) imageAnalysisResultDiv.classList.remove('hidden'); // Mostrar el div para ver el error
                if (analysisDescription) analysisDescription.textContent = ''; // Limpiar otras partes
                if (analysisTechniques) analysisTechniques.textContent = '';
                if (analysisComplexity) analysisComplexity.textContent = '';
            } finally {
                if (analysisLoading) analysisLoading.classList.add('hidden');
                // Habilitar botón de nuevo solo si hay una imagen seleccionada
                analyzeImageBtn.disabled = !inspirationImageInput.files || inspirationImageInput.files.length === 0;
            }
        });
    }
    // === FIN NUEVO ===

    // --- INICIALIZACIÓN ---
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
        try {
            const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
            // Validación básica de expiración (opcional pero recomendada)
            if (tokenPayload.exp * 1000 < Date.now()) {
                throw new Error("Token expirado");
            }
            const userRole = tokenPayload.role;
            window.currentUserRole = userRole; // Guardar rol globalmente si es útil
            showAppView(storedToken, userRole);
        } catch (error) {
            console.error("Error con token almacenado:", error.message);
            localStorage.removeItem('authToken'); // Limpiar token inválido/expirado
            showView('login'); // Asegurar que muestre login si hay error
        }
    } else {
        showView('login'); // Asegurar que muestre login si no hay token
    }


    window.showMainView = showView; // Exponer función para cambiar vistas

    // --- LÓGICA DEL VISOR DE PDFS (sin cambios) ---
    // const pdfViewerModal = document.getElementById('pdfViewerModal'); // Ya definido arriba
    // const closePdfViewerBtn = document.getElementById('closePdfViewer'); // Ya definido arriba
    // const pdfViewerTitle = document.getElementById('pdfViewerTitle'); // Ya definido arriba
    // const pdfFrame = document.getElementById('pdfFrame'); // Ya definido arriba
    // const prevFolioBtn = document.getElementById('prevFolioBtn'); // Ya definido arriba
    // const nextFolioBtn = document.getElementById('nextFolioBtn'); // Ya definido arriba

    let currentFolioList = [];
    let currentFolioIndex = -1;

    function updatePdfViewer() {
        if (currentFolioIndex < 0 || currentFolioIndex >= currentFolioList.length) {
            console.warn("Índice de PDF fuera de rango.");
            closePdfViewer(); // Cerrar si el índice es inválido
            return;
        }

        const folio = currentFolioList[currentFolioIndex];
        if (!folio || !folio.id) {
            console.error("Datos de folio inválidos para el visor PDF.");
            closePdfViewer();
            return;
        }

        const authToken = localStorage.getItem('authToken');
        const pdfUrl = `/api/folios/${folio.id}/pdf?token=${authToken}`;

        pdfViewerTitle.textContent = `Viendo Folio: ${folio.folioNumber || 'N/A'} (${currentFolioIndex + 1}/${currentFolioList.length})`;
        pdfFrame.src = pdfUrl;

        prevFolioBtn.disabled = currentFolioIndex === 0;
        nextFolioBtn.disabled = currentFolioIndex === currentFolioList.length - 1;

        // Añadir/quitar clases para estilo de deshabilitado si usas Tailwind u otro framework
        prevFolioBtn.classList.toggle('opacity-50', prevFolioBtn.disabled);
        prevFolioBtn.classList.toggle('cursor-not-allowed', prevFolioBtn.disabled);
        nextFolioBtn.classList.toggle('opacity-50', nextFolioBtn.disabled);
        nextFolioBtn.classList.toggle('cursor-not-allowed', nextFolioBtn.disabled);

    }


    window.openPdfViewer = (folios, index) => {
        if (!Array.isArray(folios) || folios.length === 0 || index < 0 || index >= folios.length) {
            console.error("Datos inválidos para abrir el visor PDF.");
            return;
        }
        currentFolioList = folios;
        currentFolioIndex = index;
        updatePdfViewer();
        pdfViewerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Evitar scroll del body detrás del modal
        setTimeout(() => window.focus(), 100);
    };


    function closePdfViewer() {
        pdfViewerModal.classList.add('hidden');
        pdfFrame.src = 'about:blank'; // Limpiar iframe
        document.body.style.overflow = ''; // Restaurar scroll del body
    }

    closePdfViewerBtn.addEventListener('click', closePdfViewer);

    prevFolioBtn.addEventListener('click', () => {
        if (!prevFolioBtn.disabled) { // Solo actuar si no está deshabilitado
            currentFolioIndex--;
            updatePdfViewer();
        }
    });

    nextFolioBtn.addEventListener('click', () => {
        if (!nextFolioBtn.disabled) { // Solo actuar si no está deshabilitado
            currentFolioIndex++;
            updatePdfViewer();
        }
    });

    // Cerrar con tecla Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && !pdfViewerModal.classList.contains('hidden')) {
            closePdfViewer();
        }
        // Navegación con flechas izquierda/derecha
        else if (!pdfViewerModal.classList.contains('hidden')) {
            if (e.key === "ArrowLeft" && !prevFolioBtn.disabled) {
                currentFolioIndex--;
                updatePdfViewer();
            } else if (e.key === "ArrowRight" && !nextFolioBtn.disabled) {
                currentFolioIndex++;
                updatePdfViewer();
            }
        }
    });

    // Re-enfocar si se pierde el foco (útil para Escape/Flechas)
    window.addEventListener('blur', () => {
        if (!pdfViewerModal.classList.contains('hidden')) {
            setTimeout(() => window.focus(), 0);
        }
    });

    // --- NUEVO: Cerrar visor PDF al hacer clic fuera ---
    if (pdfViewerModal) {
        pdfViewerModal.addEventListener('click', (e) => {
            if (e.target === pdfViewerModal) { // Solo si el clic es en el fondo
                closePdfViewer();
            }
        });
    }
    // --- FIN NUEVO ---


    // --- LÓGICA DEL BOTÓN DE REPORTE (sin cambios) ---
    if (commissionReportButton) {
        commissionReportButton.addEventListener('click', () => {
            // Generar reporte para el día ANTERIOR
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const reportDate = yesterday.toISOString().split('T')[0]; // Formato YYYY-MM-DD

            const authToken = localStorage.getItem('authToken');
            // Asegurarse de que el token se pasa correctamente como query param
            const url = `/api/folios/commission-report?date=${reportDate}&token=${authToken}`;

            console.log("Abriendo URL de reporte:", url); // Log para depuración
            window.open(url, '_blank'); // Abrir en nueva pestaña
        });
    }

    // ===== SECCIÓN PARA LA BANDEJA DE ENTRADA (sin cambios) =====
    // --- NUEVA FUNCIÓN para renderizar la lista de sesiones ---
    function renderPendingSessions(sessionsToRender) {
        pendingFoliosList.innerHTML = ''; // Limpiar lista actual

        if (!sessionsToRender || sessionsToRender.length === 0) {
            const searchTerm = pendingSearchInput ? pendingSearchInput.value.trim() : '';
            if (searchTerm) {
                pendingFoliosList.innerHTML = `<p class="text-gray-500 text-center italic mt-4 p-4">No se encontraron sesiones activas para "${searchTerm}".</p>`;
            } else {
                pendingFoliosList.innerHTML = '<p class="text-gray-500 text-center italic mt-4 p-4">No hay sesiones de IA activas en este momento.</p>';
            }
            pendingCountBadge.classList.add('hidden'); // Ocultar contador si no hay resultados
            return;
        }

        // Actualizar contador (basado en resultados filtrados si hay búsqueda)
        const totalActive = allActiveSessions.length; // Total real
        // const displayedCount = sessionsToRender.length; // Si quisieras mostrar "X de Y"
        if (totalActive > 0) {
            pendingCountBadge.textContent = totalActive; // Mostrar siempre el total activo
            pendingCountBadge.classList.remove('hidden');
        } else {
            pendingCountBadge.classList.add('hidden');
        }


        sessionsToRender.forEach(session => {
            const sessionCard = document.createElement('div');
            sessionCard.className = 'p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-2 sm:gap-x-4 cursor-pointer hover:bg-blue-50 transition-colors duration-150';
            sessionCard.dataset.sessionId = session.id;

            const clientName = session.extractedData?.clientName || 'Cliente Desconocido';
            let deliveryDateStr = 'Fecha no definida';
            if (session.extractedData?.deliveryDate) {
                try {
                    // Intentar parsear y formatear la fecha
                    const dateObj = new Date(session.extractedData.deliveryDate + 'T12:00:00Z'); // Asumir UTC
                    if (!isNaN(dateObj)) {
                        deliveryDateStr = dateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });
                    }
                } catch (e) { console.error("Error formateando fecha de sesión:", e); }
            }
            const persons = session.extractedData?.persons || 'N/A';

            sessionCard.innerHTML = `
             <div class="flex-grow">
                 <p class="font-bold text-base text-gray-800">${clientName} <span class="text-sm font-normal text-gray-500">(ID: ${session.id})</span></p>
                 <p class="text-sm text-gray-600">
                     <span class="font-medium">Fecha:</span> ${deliveryDateStr} |
                     <span class="font-medium">Personas:</span> ${persons}
                 </p>
             </div>
             <button class="bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors flex-shrink-0">Abrir Asistente</button>
        `;

            // Event listener para abrir el chat
            sessionCard.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    window.previousView = 'pending';
                    loadChatSession(session.id);
                }
            });
            sessionCard.querySelector('button').addEventListener('click', () => {
                window.previousView = 'pending';
                loadChatSession(session.id);
            });

            pendingFoliosList.appendChild(sessionCard);
        });
    }
    // --- MODIFICAR la función `loadActiveSessions` original ---
    async function loadActiveSessions() {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            console.warn("No auth token found for loading sessions.");
            return;
        }

        const pendingTitle = document.querySelector('#pendingView h2');
        if (pendingTitle) pendingTitle.textContent = 'Bandeja de Entrada - Sesiones de IA Activas';

        pendingFoliosList.innerHTML = '<p class="text-gray-500 text-center italic mt-4 p-4">Cargando sesiones activas...</p>';
        pendingCountBadge.classList.add('hidden');
        if (pendingSearchInput) pendingSearchInput.value = ''; // Limpiar búsqueda al recargar

        try {
            const response = await fetch('/api/ai-sessions?status=active', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    pendingFoliosList.innerHTML = '<p class="text-orange-600 text-center italic mt-4 p-4">Funcionalidad de Sesiones IA no disponible o sin sesiones activas.</p>';
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Error ${response.status} al cargar sesiones.`);
                }
                allActiveSessions = []; // Limpiar caché local
                renderPendingSessions(allActiveSessions); // Renderizar lista vacía
                return;
            }

            allActiveSessions = await response.json(); // Guardar en la variable global
            renderPendingSessions(allActiveSessions); // Mostrar todas inicialmente

        } catch (error) {
            console.error("Error en loadActiveSessions:", error);
            pendingFoliosList.innerHTML = `<p class="text-red-600 text-center p-4">Error al cargar sesiones: ${error.message}</p>`;
            allActiveSessions = []; // Limpiar caché
            renderPendingSessions(allActiveSessions); // Renderizar lista vacía
            pendingCountBadge.classList.add('hidden');
        }
    }

    // --- Event Listener para Búsqueda en Bandeja de Entrada ---
    if (pendingSearchInput) {
        pendingSearchInput.addEventListener('input', () => {
            const searchTerm = pendingSearchInput.value.toLowerCase().trim();

            if (!searchTerm) {
                renderPendingSessions(allActiveSessions); // Mostrar todas si no hay búsqueda
                return;
            }

            const filteredSessions = allActiveSessions.filter(session => {
                const clientName = session.extractedData?.clientName?.toLowerCase() || '';
                // Busca si el nombre del cliente incluye el término de búsqueda
                return clientName.includes(searchTerm);
            });

            renderPendingSessions(filteredSessions); // Mostrar solo las filtradas
        });
    }
    // --- Fin Event Listener ---

}); // Fin de DOMContentLoaded

// --- Fin de main.js ---