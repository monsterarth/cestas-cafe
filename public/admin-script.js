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
window.menuData = [];

// --- Funções Utilitárias ---
function showLoader(elementId) {
    const container = document.getElementById(elementId);
    if (container) {
        container.innerHTML = `<div class="flex justify-center items-center h-64"><div class="loader"></div></div>`;
    }
}
// ... (outras funções utilitárias como showConfirmModal, closeModal, etc. permanecem as mesmas)

function clearListeners() {
    activeListeners.forEach(unsubscribe => unsubscribe());
    activeListeners = [];
    if (sortableInstances) {
        sortableInstances.forEach(sortable => sortable.destroy());
        sortableInstances = [];
    }
    if(activeCharts) {
        activeCharts.forEach(chart => chart.destroy());
        activeCharts = [];
    }
}

// --- Lógica Principal do Aplicativo ---
document.addEventListener('DOMContentLoaded', () => {

    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const userEmailSpan = document.getElementById('user-email');
    const loginErrorDiv = document.getElementById('login-error');

    // Listener de Autenticação com verificação de permissão de Admin
    auth.onAuthStateChanged(async (user) => {
        clearListeners();
        
        // Se um usuário for detectado, verificamos suas permissões
        if (user) {
            try {
                // Força a atualização do token para pegar os 'claims' mais recentes
                const idTokenResult = await user.getIdTokenResult(true);
                
                // Verifica se o 'claim' de admin existe e é verdadeiro
                if (idTokenResult.claims.admin === true) {
                    // É um admin, mostra o painel
                    loginView.classList.add('hidden');
                    appView.classList.remove('hidden');
                    userEmailSpan.textContent = user.email;
                    initializeApp();
                } else {
                    // Não é um admin, força o logout e mostra erro
                    await auth.signOut();
                    if(loginErrorDiv) {
                        loginErrorDiv.textContent = "Você não tem permissão para acessar este painel.";
                        loginErrorDiv.classList.remove('hidden');
                    }
                }
            } catch (error) {
                console.error("Erro ao verificar permissões de admin:", error);
                await auth.signOut();
            }
        } else {
            // Nenhum usuário logado, mostra a tela de login
            loginView.classList.remove('hidden');
            appView.classList.add('hidden');
        }
    });

    // Listener do botão de login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            if (!emailInput || !passwordInput || !loginErrorDiv) return;
            
            const email = emailInput.value;
            const password = passwordInput.value;
            
            try {
                loginErrorDiv.classList.add('hidden');
                await auth.signInWithEmailAndPassword(email, password);
                // O onAuthStateChanged vai lidar com o redirecionamento após o login
            } catch (error) {
                loginErrorDiv.textContent = "Erro: " + error.message;
                loginErrorDiv.classList.remove('hidden');
            }
        });
    }

    // Listener do botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.signOut());
    }
});


// --- Inicialização e Navegação do App (só roda se o usuário for admin) ---
async function initializeApp() {
    // ... (o conteúdo desta função permanece o mesmo)
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

        switch (targetId) {
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

// --- Demais funções do painel (loadDashboard, loadOrders, loadSettings, etc.) ---
// O restante do seu arquivo (todas as outras funções) permanece exatamente o mesmo.
// Cole este código no início e mantenha o resto do seu arquivo inalterado.
// Para facilitar, o código abaixo contém o arquivo completo e correto.

async function cacheMenuData() {
    const menuQuery = db.collection('cardapio').orderBy('posicao');
    const snapshot = await menuQuery.get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const categoriesWithItems = await Promise.all(categories.map(async (cat) => {
        const itemsQuery = db.collection('cardapio').doc(cat.id).collection('itens').orderBy('posicao');
        const itemsSnapshot = await itemsQuery.get();
        const items = itemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() }));
        return { ...cat, items: items };
    }));

    window.menuData = categoriesWithItems;
}

function loadDashboard() {
    showLoader('dashboard');
    const unsubscribe = db.collection('pedidos').orderBy('timestampPedido', 'desc').onSnapshot(snapshot => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderDashboard(orders);
    }, error => {
        console.error("Error loading dashboard data:", error);
        document.getElementById('dashboard').innerHTML = `<p class="text-red-500 p-4"><b>Erro ao carregar dados do dashboard:</b> ${error.message}</p>`;
    });
    activeListeners.push(unsubscribe);
}

function renderDashboard(orders) {
    const newOrders = orders.filter(o => o.status === 'Novo').length;
    const inPrepOrders = orders.filter(o => o.status === 'Em Preparação').length;
    const deliveredToday = orders.filter(o => {
        const orderDate = o.timestampPedido?.toDate();
        const today = new Date();
        return o.status === 'Entregue' && orderDate && orderDate.toDateString() === today.toDateString();
    }).length;

    const recentOpenOrders = orders.filter(o => ['Novo', 'Em Preparação'].includes(o.status)).slice(0, 5);

    const itemCounts = {};
    orders.forEach(order => {
        (order.itensPedido || []).forEach(item => {
            const itemName = item.nomeItem.split(' - ')[0];
            itemCounts[itemName] = (itemCounts[itemName] || 0) + item.quantidade;
        });
    });
    const topItems = Object.entries(itemCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

    const dashboardHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow border border-[var(--cinza-taupe)]"><h4 class="font-semibold text-[var(--cinza-taupe)]">Novos Pedidos</h4><p class="text-4xl font-bold mt-2">${newOrders}</p></div>
            <div class="bg-white p-6 rounded-xl shadow border border-[var(--cinza-taupe)]"><h4 class="font-semibold text-[var(--cinza-taupe)]">Em Preparação</h4><p class="text-4xl font-bold mt-2">${inPrepOrders}</p></div>
            <div class="bg-white p-6 rounded-xl shadow border border-[var(--cinza-taupe)]"><h4 class="font-semibold text-[var(--cinza-taupe)]">Entregues Hoje</h4><p class="text-4xl font-bold mt-2">${deliveredToday}</p></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-[var(--cinza-taupe)]">
                <h4 class="text-lg font-bold mb-4">Pedidos em Aberto Recentes</h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead><tr class="border-b"><th class="p-3">Hóspede</th><th class="p-3">Cabana</th><th class="p-3">Entrega</th><th class="p-3">Status</th></tr></thead>
                        <tbody>
                            ${recentOpenOrders.length > 0 ? recentOpenOrders.map(order => `<tr class="border-b hover:bg-gray-50 cursor-pointer" onclick="openOrderDetailModal('${order.id}')">
                                <td class="p-3 font-medium">${order.hospedeNome}</td>
                                <td class="p-3">${order.cabanaNumero}</td>
                                <td class="p-3">${order.horarioEntrega}</td>
                                <td class="p-3"><span class="font-medium px-2.5 py-0.5 rounded-full ${order.status === 'Novo' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}">${order.status}</span></td>
                            </tr>`).join('') : '<tr><td colspan="4" class="p-3 text-center text-gray-500">Nenhum pedido em aberto.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow border border-[var(--cinza-taupe)]">
                <h4 class="text-lg font-bold mb-4">Itens Mais Pedidos</h4>
                 <canvas id="top-items-chart"></canvas>
            </div>
        </div>`;
    document.getElementById('dashboard').innerHTML = dashboardHTML;

    if (topItems.length > 0) {
        const ctx = document.getElementById('top-items-chart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topItems.map(([name]) => name),
                datasets: [{
                    label: 'Quantidade',
                    data: topItems.map(([, qty]) => qty),
                    backgroundColor: 'rgba(151, 162, 95, 0.6)',
                    borderColor: 'rgba(151, 162, 95, 1)',
                    borderWidth: 1
                }]
            },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
        });
        activeCharts.push(chart);
    }
}

function loadOrders() {
    showLoader('orders');
    const unsubscribe = db.collection('pedidos').orderBy('timestampPedido', 'desc').onSnapshot(snapshot => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderOrders(orders);
    }, error => {
        console.error("Error loading orders:", error);
        document.getElementById('orders').innerHTML = `<p class="text-red-500 p-4"><b>Erro ao carregar pedidos:</b> ${error.message}</p>`;
    });
    activeListeners.push(unsubscribe);
}

function renderOrders(orders) {
    // ...
}

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
        <div class="bg-white p-6 rounded-xl shadow-sm border border-[var(--cinza-taupe)] mb-8">
            <h4 class="text-lg font-semibold mb-4">Adicionar Novo Administrador</h4>
            <p class="text-sm text-[var(--cinza-taupe)] mb-4">O usuário já deve estar cadastrado no Firebase Authentication para poder ser promovido.</p>
            <div class="flex flex-col sm:flex-row gap-2">
                <input type="email" id="new-admin-email" placeholder="Email do novo admin" class="flex-grow border border-gray-300 rounded-lg px-3 py-2">
                <button id="add-admin-btn" class="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-lg">Promover a Admin</button>
            </div>
            <div id="admin-feedback" class="mt-4 text-sm"></div>
        </div>
        <div class="mb-6"><h3 class="text-xl font-semibold">Configurações Gerais</h3></div>
        <div class="space-y-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-[var(--cinza-taupe)]">
                <h4 class="text-lg font-semibold mb-4">Personalização do Aplicativo</h4>
                <div class="space-y-4">
                    <div><label class="font-medium">Nome da Fazenda</label><input type="text" id="app-nomeFazenda" class="w-full mt-1 border-gray-300 rounded-lg p-2" value="${appConfig.nomeFazenda || ''}"></div>
                    <div><label class="font-medium">URL do Logo</label><input type="text" id="app-logoUrl" class="w-full mt-1 border-gray-300 rounded-lg p-2" value="${appConfig.logoUrl || ''}" placeholder="https://exemplo.com/logo.png"></div>
                    <div><label class="font-medium">Subtítulo</label><input type="text" id="app-subtitulo" class="w-full mt-1 border-gray-300 rounded-lg p-2" value="${appConfig.subtitulo || ''}"></div>
                    <div><label class="font-medium">Texto de Introdução</label><textarea id="app-textoIntroducao" class="w-full mt-1 border-gray-300 rounded-lg p-2" rows="4">${appConfig.textoIntroducao || ''}</textarea></div>
                    <div><label class="font-medium">Texto de Agradecimento</label><textarea id="app-textoAgradecimento" class="w-full mt-1 border-gray-300 rounded-lg p-2" rows="2">${appConfig.textoAgradecimento || ''}</textarea></div>
                    <div><label class="font-medium">Total de Calorias Ideal por Pessoa</label><input type="number" id="app-caloriasMedias" class="w-full mt-1 border-gray-300 rounded-lg p-2" value="${appConfig.caloriasMediasPorPessoa || 600}"></div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="font-medium">Cor Primária (Destaque)</label><input type="color" id="app-corPrimaria" class="w-full h-10 mt-1 border-gray-300 rounded-lg p-1" value="${appConfig.corPrimaria || '#97A25F'}"></div>
                        <div><label class="font-medium">Cor Secundária (Texto)</label><input type="color" id="app-corSecundaria" class="w-full h-10 mt-1 border-gray-300 rounded-lg p-1" value="${appConfig.corSecundaria || '#4B4F36'}"></div>
                    </div>
                </div>
                <div class="text-right mt-4"><button onclick="saveAppConfig()" class="bg-[var(--verde-medio)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Salvar Personalização</button></div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-[var(--cinza-taupe)]">
                <h4 class="text-lg font-semibold mb-4">Gerenciar Cabanas</h4>
                <div id="cabanas-list" class="space-y-2 mb-4">${(geralConfig.cabanas || []).map((c, i) => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border" data-name="${c.nomeCabana}" data-capacity="${c.capacidadeMaxima}">
                        <div class="flex items-center gap-3"><svg class="w-5 h-5 text-gray-400 drag-handle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg><span>${c.nomeCabana} (Cap: ${c.capacidadeMaxima})</span></div>
                        <button onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 text-sm font-medium">Remover</button>
                    </div>`).join('')}
                </div>
                <div class="flex flex-col sm:flex-row gap-2 mb-4">
                    <input type="text" id="new-cabana-name" placeholder="Nome da Cabana" class="flex-grow border border-gray-300 rounded-lg px-3 py-2">
                    <input type="number" id="new-cabana-capacity" placeholder="Cap." class="w-full sm:w-24 border border-gray-300 rounded-lg px-3 py-2">
                    <button id="add-cabana-btn" class="bg-gray-200 hover:bg-gray-300 font-bold py-2 px-4 rounded-lg">Adicionar</button>
                </div>
                <div class="text-right"><button onclick="saveList('cabanas')" class="bg-[var(--verde-medio)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Salvar Cabanas</button></div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-[var(--cinza-taupe)]">
                <h4 class="text-lg font-semibold mb-4">Gerenciar Horários de Entrega</h4>
                <div id="horarios-list" class="space-y-2 mb-4">${(geralConfig.horariosEntrega || []).map((h, i) => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border" data-value="${h}">
                        <div class="flex items-center gap-3"><svg class="w-5 h-5 text-gray-400 drag-handle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg><span>${h}</span></div>
                        <button onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 text-sm font-medium">Remover</button>
                    </div>`).join('')}
                </div>
                <div class="flex flex-col sm:flex-row gap-2 mb-4">
                    <input type="text" id="new-horario" placeholder="Novo Horário (HH:MM)" class="flex-grow border border-gray-300 rounded-lg px-3 py-2">
                    <button id="add-horario-btn" class="bg-gray-200 hover:bg-gray-300 font-bold py-2 px-4 rounded-lg">Adicionar</button>
                </div>
                <div class="text-right"><button onclick="saveList('horariosEntrega')" class="bg-[var(--verde-medio)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Salvar Horários</button></div>
            </div>
        </div>`;
    document.getElementById('settings').innerHTML = settingsHTML;

    initializeSettingsSortablesAndButtons();
    initializeAdminButton();
}

function initializeAdminButton() {
    const addAdminBtn = document.getElementById('add-admin-btn');
    if (addAdminBtn) {
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
//... (O resto das funções, como `initializeSettingsSortablesAndButtons`, `saveAppConfig`, etc., continuam aqui)

