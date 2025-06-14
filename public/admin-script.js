/* public/admin-script.js */
// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAjAUVa7_4cAHtFqm8xBuzDVzxDknPMYJM",
    authDomain: "cafe-da-fazenda-a2ec3.firebaseapp.com",
    projectId: "cafe-da-fazenda-a2ec3",
    storageBucket: "cafe-da-fazenda-a2ec3.appspot.com",
    messagingSenderId: "604485035435",
    appId: "1:604485035435:web:876f003565cec1ac4a5eee"
};

// Inicialização dos serviços Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Variáveis de estado globais
let activeListeners = [];
let sortableInstances = [];
let activeCharts = [];
window.menuData = []; // Cache do cardápio para categorização rápida

// --- Funções Utilitárias ---
window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if(modal) modal.remove();
}

function showLoader(elementId) {
    const container = document.getElementById(elementId);
    if (container) {
        container.innerHTML = `<div class="flex justify-center items-center h-64"><div class="loader"></div></div>`;
    }
}

function showConfirmModal(message, onConfirm) {
    const modalId = `confirm-modal-${Date.now()}`;
    const modalHTML = `
    <div id="${modalId}" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-overlay">
        <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md modal-content">
            <h3 class="text-xl font-bold mb-4">Confirmação</h3>
            <p class="text-[var(--verde-escuro)] mb-6">${message}</p>
            <div class="flex justify-end gap-4">
                <button id="cancel-btn" class="bg-gray-200 hover:bg-gray-300 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button id="confirm-btn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Confirmar</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modal-container').insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('confirm-btn').onclick = () => { onConfirm(); closeModal(modalId); };
    document.getElementById('cancel-btn').onclick = () => closeModal(modalId);
}

function clearListeners() {
    activeListeners.forEach(unsubscribe => unsubscribe());
    activeListeners = [];
    sortableInstances.forEach(sortable => sortable.destroy());
    sortableInstances = [];
    activeCharts.forEach(chart => chart.destroy());
    activeCharts = [];
}

// --- Lógica Principal do Aplicativo ---
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        clearListeners();
        if (user) {
            document.getElementById('login-view').classList.add('hidden');
            document.getElementById('app-view').classList.remove('hidden');
            document.getElementById('user-email').textContent = user.email;
            initializeApp();
        } else {
            document.getElementById('login-view').classList.remove('hidden');
            document.getElementById('app-view').classList.add('hidden');
        }
    });

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const loginError = document.getElementById('login-error');

            if (!emailInput || !passwordInput || !loginError) return;
            const email = emailInput.value;
            const password = passwordInput.value;
            try {
                loginError.classList.add('hidden');
                await auth.signInWithEmailAndPassword(email, password);
            } catch (error) {
                loginError.textContent = "Erro: " + error.message;
                loginError.classList.remove('hidden');
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.signOut());
    }
});


// --- Inicialização e Navegação do App ---
async function initializeApp() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    function navigateTo(targetId) {
        clearListeners();
        document.querySelectorAll('.content-section').forEach(section => section.style.display = 'none');
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.style.display = 'block';

        sidebarLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.target === targetId) {
                link.classList.add('active');
                document.getElementById('main-title').textContent = link.textContent.trim();
            }
        });

        switch(targetId) {
            case 'dashboard': loadDashboard(); break;
            case 'orders': loadOrders(); break;
            case 'menu': loadMenu(); break;
            case 'settings': loadSettings(); break;
        }
    }
    
    await cacheMenuData();

    sidebarLinks.forEach(link => {
        const target = link.dataset.target;
        if (target) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(target);
            });
        }
    });
    
    navigateTo('dashboard');
}

// --- Cache de Dados do Cardápio ---
async function cacheMenuData() {
    // ... (código inalterado)
}

// --- Seção Dashboard ---
function loadDashboard() {
    showLoader('dashboard');
    const unsubscribe = db.collection('pedidos').orderBy('timestampPedido', 'desc').onSnapshot(snapshot => {
        const orders = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        renderDashboard(orders);
    }, error => {
        console.error("Error loading dashboard data:", error);
        document.getElementById('dashboard').innerHTML = `<p class="text-red-500">Erro ao carregar dados: ${error.message}</p>`;
    });
    activeListeners.push(unsubscribe);
}

function renderDashboard(orders) {
    // ... (código inalterado)
}

// --- Seção de Pedidos e Impressão ---
function loadOrders() {
    showLoader('orders');
    const unsubscribe = db.collection('pedidos').orderBy('timestampPedido', 'desc').onSnapshot(snapshot => {
        const orders = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        renderOrders(orders);
    }, error => {
        console.error("Error loading orders:", error);
        document.getElementById('orders').innerHTML = `<p class="text-red-500">Erro ao carregar pedidos: ${error.message}</p>`;
    });
    activeListeners.push(unsubscribe);
}

function renderOrders(orders) {
    // ... (código inalterado)
}

// --- Modais e Impressão ---
window.openOrderDetailModal = async (orderId) => { /* ... (código inalterado) ... */ };
window.updateOrderStatus = async (orderId) => { /* ... (código inalterado) ... */ };
window.printOpenOrdersSummary = async () => { /* ... (código inalterado) ... */ };
function printElement(content, isHtmlString = false) { /* ... (código inalterado) ... */ };

// --- Seção de Cardápio ---
function loadMenu() {
    showLoader('menu');
    renderMenu(window.menuData); 
}
function renderMenu(categories) {
    // ... (código inalterado) ...
}

// --- Seção de Configurações ---
function loadSettings() {
    showLoader('settings');
    const geralPromise = db.collection('configuracoes').doc('geral').get();
    const appPromise = db.collection('configuracoes').doc('app').get();

    Promise.all([geralPromise, appPromise]).then(([geralDoc, appDoc]) => {
        const geralConfig = geralDoc.exists ? geralDoc.data() : { cabanas: [], horariosEntrega: [] };
        const appConfig = appDoc.exists ? appDoc.data() : { nomeFazenda: '', subtitulo: '', textoIntroducao: '', textoAgradecimento: '', corPrimaria: '#97A25F', corSecundaria: '#4B4F36', logoUrl: '' };
        renderSettings(geralConfig, appConfig);
    }).catch(error => console.error("Error loading settings:", error));
}

function renderSettings(geralConfig, appConfig) {
    const settingsHTML = `
        <!-- Formulário para adicionar Admin -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-[var(--cinza-taupe)] mb-8">
            <h4 class="text-lg font-semibold mb-4">Adicionar Novo Administrador</h4>
            <p class="text-sm text-[var(--cinza-taupe)] mb-4">O usuário já deve estar cadastrado no Firebase Authentication para poder ser promovido.</p>
            <div class="flex flex-col sm:flex-row gap-2">
                <input type="email" id="new-admin-email" placeholder="Email do novo admin" class="flex-grow border border-gray-300 rounded-lg px-3 py-2">
                <button id="add-admin-btn" class="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-lg">Promover a Admin</button>
            </div>
            <div id="admin-feedback" class="mt-4 text-sm"></div>
        </div>

        <div class="mb-6"><h3 class="text-xl font-semibold">Configurações Gerais</h3><p class="text-[var(--cinza-taupe)] mt-1">Gerencie os parâmetros do sistema e a aparência do aplicativo.</p></div>
        <div class="space-y-8">
             <div class="bg-white p-6 rounded-xl shadow-sm border border-[var(--cinza-taupe)]">
                <h4 class="text-lg font-semibold mb-4">Personalização do Aplicativo</h4>
                <div class="space-y-4">
                    <!-- ... (resto do formulário de personalização) ... -->
                </div>
             </div>
             <div class="bg-white p-6 rounded-xl shadow-sm border border-[var(--cinza-taupe)]">
                 <h4 class="text-lg font-semibold mb-4">Gerenciar Cabanas</h4>
                 <!-- ... (resto do formulário de cabanas) ... -->
            </div>
             <div class="bg-white p-6 rounded-xl shadow-sm border border-[var(--cinza-taupe)]">
                <h4 class="text-lg font-semibold mb-4">Gerenciar Horários de Entrega</h4>
                 <!-- ... (resto do formulário de horários) ... -->
            </div>
        </div>`;
    document.getElementById('settings').innerHTML = settingsHTML;
    
    // Adiciona os listeners para os botões de Configurações
    initializeSettingsSortablesAndButtons();
    initializeAdminButton(); // <--- NOVA FUNÇÃO CHAMADA AQUI
}

function initializeAdminButton() {
    const addAdminBtn = document.getElementById('add-admin-btn');
    if(addAdminBtn) {
        addAdminBtn.addEventListener('click', async () => {
            const emailInput = document.getElementById('new-admin-email');
            const feedbackDiv = document.getElementById('admin-feedback');
    
            if (!emailInput || !feedbackDiv) return;
    
            const email = emailInput.value;
            if (!email) {
                feedbackDiv.textContent = 'Por favor, insira um e-mail.';
                feedbackDiv.className = 'mt-4 text-sm text-red-600';
                return;
            }
    
            feedbackDiv.textContent = 'Processando...';
            feedbackDiv.className = 'mt-4 text-sm text-gray-500';
    
            try {
                if (firebase.functions) {
                    const addAdminRole = firebase.functions().httpsCallable('addAdminRole');
                    const result = await addAdminRole({ email: email });
                    feedbackDiv.textContent = result.data.message;
                    feedbackDiv.className = 'mt-4 text-sm text-green-600';
                    emailInput.value = '';
                } else {
                    throw new Error("O SDK do Firebase Functions não está carregado.");
                }
            } catch (error) {
                console.error('Erro ao adicionar admin:', error);
                feedbackDiv.textContent = 'Erro: ' + error.message;
                feedbackDiv.className = 'mt-4 text-sm text-red-600';
            }
        });
    }
}

function initializeSettingsSortablesAndButtons() {
    // ... (código inalterado) ...
}

// ... (Resto do arquivo, funções para salvar, deletar, etc., sem alterações) ...
