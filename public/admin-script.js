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
    // Declaração de todas as constantes no início
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const authLoader = document.getElementById('auth-loader');
    const userEmailSpan = document.getElementById('user-email');
    const loginErrorDiv = document.getElementById('login-error');

    // Lógica de autenticação com o Firestore
    auth.onAuthStateChanged(async (user) => {
        clearListeners();

        if (user) {
            loginView.classList.add('hidden');
            appView.classList.add('hidden');
            authLoader.classList.remove('hidden');
            authLoader.classList.add('flex');

            try {
                // Lógica que consulta o Firestore para verificar se é admin
                const adminDocRef = db.collection('admins').doc(user.uid);
                const adminDoc = await adminDocRef.get();

                if (adminDoc.exists && adminDoc.data().isAdmin === true) {
                    userEmailSpan.textContent = user.email;
                    if (loginErrorDiv) loginErrorDiv.classList.add('hidden');
                    appView.classList.remove('hidden');
                    initializeApp();
                } else {
                    if (loginErrorDiv) {
                        loginErrorDiv.textContent = "Você não tem permissão para acessar este painel.";
                        loginErrorDiv.classList.remove('hidden');
                    }
                    await auth.signOut();
                    loginView.classList.remove('hidden');
                }
            } catch (error) {
                console.error("Erro ao verificar permissões:", error);
                if (loginErrorDiv) {
                    loginErrorDiv.textContent = "Erro ao verificar permissões: " + error.message;
                    loginErrorDiv.classList.remove('hidden');
                }
                await auth.signOut();
                loginView.classList.remove('hidden');
            } finally {
                authLoader.classList.add('hidden');
                authLoader.classList.remove('flex');
            }
        } else {
            loginView.classList.remove('hidden');
            appView.classList.add('hidden');
            authLoader.classList.add('hidden');
            authLoader.classList.remove('flex');
        }
    });

    // Lógica do botão de Login
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
            } catch (error) {
                loginErrorDiv.textContent = "Erro: " + error.message;
                loginErrorDiv.classList.remove('hidden');
            }
        });
    }

    // Lógica do botão de Logout
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
     const statusColors = { 'Novo': 'bg-blue-100 text-blue-800', 'Em Preparação': 'bg-amber-100 text-amber-800', 'Entregue': 'bg-green-100 text-green-800', 'Cancelado': 'bg-red-100 text-red-800' };
    const ordersHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
                <h3 class="text-xl font-semibold">Pedidos Recebidos</h3>
                <p class="text-[var(--cinza-taupe)] mt-1">A lista é atualizada em tempo real.</p>
            </div>
            <button onclick="printOpenOrdersSummary()" class="mt-4 sm:mt-0 bg-white border border-[var(--cinza-taupe)] hover:bg-gray-50 font-bold py-2 px-4 rounded-lg flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-8a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                Imprimir Resumo da Cozinha
            </button>
        </div>
        <div class="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-[var(--cinza-taupe)]">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead><tr class="border-b bg-gray-50"><th class="p-3">Data/Hora</th><th class="p-3">Cabana</th><th class="p-3">Hóspede</th><th class="p-3">Entrega</th><th class="p-3">Status</th></tr></thead>
                    <tbody>${orders.map(order => `<tr class="border-b hover:bg-gray-50 cursor-pointer" onclick="openOrderDetailModal('${order.id}')">
                        <td class="p-3 whitespace-nowrap">${order.timestampPedido?.toDate().toLocaleString('pt-BR') || 'N/A'}</td>
                        <td class="p-3 font-medium">${order.cabanaNumero}</td><td class="p-3">${order.hospedeNome}</td><td class="p-3">${order.horarioEntrega}</td>
                        <td class="p-3"><span class="font-medium px-2.5 py-0.5 rounded-full ${statusColors[order.status] || 'bg-slate-100 text-slate-800'}">${order.status}</span></td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    document.getElementById('orders').innerHTML = ordersHTML;
}

window.openOrderDetailModal = async (orderId) => {
    const doc = await db.collection('pedidos').doc(orderId).get();
    if (!doc.exists) return;
    const order = { id: doc.id, ...doc.data() };
    const modalId = `order-detail-modal-${orderId}`;
    const categoryOrder = ["pratos quentes", "bebidas", "pães"];
    const categorizedItems = {};
    categoryOrder.forEach(cat => categorizedItems[cat] = []);
    categorizedItems['outros'] = [];

    (order.itensPedido || []).forEach(item => {
        let foundCategory = false;
        for (const category of window.menuData) {
            const categoryName = category.nomeCategoria.toLowerCase();
            if (category.items.some(menuItem => menuItem.nomeItem === item.nomeItem.split(' - ')[0])) {
                let targetCategory = categoryOrder.includes(categoryName) ? categoryName : 'outros';
                categorizedItems[targetCategory].push(item);
                foundCategory = true;
                break;
            }
        }
        if (!foundCategory) { categorizedItems['outros'].push(item); }
    });

    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 modal-overlay">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl modal-content flex flex-col max-h-[95vh]">
                <div class="p-6 flex-grow overflow-y-auto" id="printable-order-${orderId}">
                    <div class="text-center mb-4">
                        <h3 class="text-xl font-bold">FAZENDA DO ROSA</h3>
                        <p class="text-sm">PEDIDO DE CAFÉ DA MANHÃ</p>
                    </div>
                    <div class="comanda-header grid grid-cols-3 gap-x-4 text-sm border-y-2 border-dashed border-black py-2 mb-4 font-mono">
                        <p><strong>CABANA:</strong> <span class="text-lg font-extrabold">${order.cabanaNumero}</span></p>
                        <p><strong>HÓSPEDE:</strong> ${order.hospedeNome}</p>
                        <p><strong>ENTREGA:</strong> ${order.horarioEntrega}</p>
                        <p><strong>PESSOAS:</strong> ${order.numeroPessoas}</p>
                        <p><strong>PEDIDO:</strong> #${order.id.substring(0,6)}</p>
                        <p><strong>DATA:</strong> ${order.timestampPedido?.toDate().toLocaleDateString('pt-BR')}</p>
                    </div>
                    ${Object.keys(categorizedItems).map(categoryKey => {
                        if (categorizedItems[categoryKey].length === 0) return '';
                        return `
                        <h4 class="font-bold text-md mt-4 mb-1 uppercase tracking-wider">-- ${categoryKey} --</h4>
                        <ul class="space-y-1 ${categoryKey !== 'pratos quentes' ? 'columns-2' : ''}">
                            ${categorizedItems[categoryKey].map(item => `<li><strong>${item.quantidade}x ${item.nomeItem}</strong> ${item.observacao ? `<br><em class="ml-4 text-gray-600 text-xs">Obs: ${item.observacao}</em>` : ''}</li>`).join('')}
                        </ul>`;
                    }).join('')}
                    ${order.observacoesPratosQuentes ? `<div class="mt-2"><h5 class="font-semibold text-xs uppercase">Obs. Gerais (Pratos Quentes):</h5><p class="text-sm italic pl-2 border-l-2 border-gray-300">${order.observacoesPratosQuentes}</p></div>` : ''}
                    ${order.observacoesGerais ? `<div class="mt-4 border-t pt-2"><h4 class="font-bold text-md mb-1 uppercase">Observações Gerais do Pedido</h4><p class="text-sm font-semibold">${order.observacoesGerais}</p></div>` : ''}
                </div>
                <div class="bg-gray-50 p-4 border-t rounded-b-xl flex justify-between items-center no-print">
                     <div>
                        <label for="status-select" class="mr-2 font-medium">Status:</label>
                        <select id="status-select" class="border-gray-300 rounded-lg">
                            <option value="Novo" ${order.status === 'Novo' ? 'selected' : ''}>Novo</option>
                            <option value="Em Preparação" ${order.status === 'Em Preparação' ? 'selected' : ''}>Em Preparação</option>
                            <option value="Entregue" ${order.status === 'Entregue' ? 'selected' : ''}>Entregue</option>
                            <option value="Cancelado" ${order.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                    <div class="flex gap-4">
                        <button class="bg-gray-200 hover:bg-gray-300 font-bold py-2 px-4 rounded-lg" onclick="closeModal('${modalId}')">Fechar</button>
                        <button onclick="printOrderReceipt('${order.id}')" class="bg-[var(--verde-escuro)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Imprimir Comanda</button>                        <button onclick="updateOrderStatus('${orderId}')" class="bg-[var(--verde-medio)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Salvar</button>
                    </div>
                </div>
            </div>
        </div>`;
    document.getElementById('modal-container').innerHTML = modalHTML;
}
window.updateOrderStatus = async (orderId) => {
    const newStatus = document.getElementById('status-select').value;
    await db.collection('pedidos').doc(orderId).update({ status: newStatus });
    closeModal(`order-detail-modal-${orderId}`);
};
window.printOpenOrdersSummary = async () => {
    const snapshot = await db.collection('pedidos').where('status', 'in', ['Novo', 'Em Preparação']).orderBy('horarioEntrega').get();
    const openOrders = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    if (openOrders.length === 0) { alert("Nenhum pedido em aberto para imprimir."); return; }
    const ordersByTime = openOrders.reduce((acc, order) => { (acc[order.horarioEntrega] = acc[order.horarioEntrega] || []).push(order); return acc; }, {});
    const summary = {};
    openOrders.forEach(order => { (order.itensPedido || []).forEach(item => { summary[item.nomeItem] = (summary[item.nomeItem] || 0) + item.quantidade; }); });
    const printHTML = `
        <div>
            <h2 class="text-xl font-bold mb-2">Resumo da Cozinha - ${new Date().toLocaleString('pt-BR')}</h2>
            <h3 class="text-lg font-bold mt-4 mb-1 border-b">TOTAL DE ITENS</h3>
            <table class="w-full text-left border-collapse text-xs"><tbody>${Object.entries(summary).sort((a,b) => a[0].localeCompare(b[0])).map(([name, qty]) => `<tr class="border-b"><td class="p-1">${name}</td><td class="p-1 text-right font-bold">${qty}</td></tr>`).join('')}</tbody></table>
            <div class="page-break"></div>
            <h3 class="text-lg font-bold mt-4 mb-1 border-b">PEDIDOS POR HORÁRIO</h3>
             ${Object.keys(ordersByTime).sort().map(time => `<div class="mb-4"><h4 class="text-md font-bold bg-gray-200 p-1">HORÁRIO DE ENTREGA: ${time}</h4>${ordersByTime[time].map(order => `<div class="border-b-2 border-dashed border-black py-2"><p><strong>${order.cabanaNumero} - ${order.hospedeNome}</strong> (${order.numeroPessoas}p)</p><ul class="list-disc list-inside text-xs pl-2">${(order.itensPedido || []).map(item => `<li><strong>${item.quantidade}x</strong> ${item.nomeItem} ${item.observacao ? `<em class="text-gray-600">- Obs: ${item.observacao}</em>` : ''}</li>`).join('')}</ul></div>`).join('')}</div>`).join('')}
        </div>`;
    printElement(printHTML, true);
}
function printElement(content, isHtmlString = false) {
    const printArea = document.getElementById('print-area');
    if (isHtmlString) { printArea.innerHTML = content; } else { const contentToPrint = document.getElementById(content); if (!contentToPrint) return; printArea.innerHTML = contentToPrint.innerHTML; }
    window.print();
}
const printOrderReceipt = async (orderId) => {
    const doc = await db.collection('pedidos').doc(orderId).get();
    if (!doc.exists) { alert("Pedido não encontrado."); return; }
    const order = { id: doc.id, ...doc.data() };
    const categoryOrder = ["pratos quentes", "bebidas", "pães", "outros"];
    const categorizedItems = {};
    categoryOrder.forEach(cat => categorizedItems[cat] = []);
    (order.itensPedido || []).forEach(item => {
        let foundCategory = false;
        for (const category of window.menuData) {
            const categoryName = category.nomeCategoria.toLowerCase();
            if (category.items.some(menuItem => menuItem.nomeItem.startsWith(item.nomeItem.split(' - ')[0]))) {
                const targetCategory = categoryOrder.includes(categoryName) ? categoryName : 'outros';
                categorizedItems[targetCategory].push(item);
                foundCategory = true; break;
            }
        }
        if (!foundCategory) { categorizedItems['outros'].push(item); }
    });
    const receiptHTML = `
        <div class="receipt-format">
            <div style="text-align: center; margin-bottom: 10px;"><h3 style="font-size: 1.2em; font-weight: bold; margin: 0;">FAZENDA DO ROSA</h3><p style="font-size: 0.9em; margin: 0;">Comanda de Café da Manhã</p></div>
            <p><strong>CABANA:</strong> ${order.cabanaNumero}</p><p><strong>HÓSPEDE:</strong> ${order.hospedeNome}</p><p><strong>ENTREGA:</strong> ${order.horarioEntrega}</p><p><strong>PESSOAS:</strong> ${order.numeroPessoas}</p><p><strong>PEDIDO:</strong> #${order.id.substring(0,6)}</p><p><strong>DATA:</strong> ${order.timestampPedido?.toDate().toLocaleString('pt-BR')}</p><hr>
            ${Object.keys(categorizedItems).map(categoryKey => { const items = categorizedItems[categoryKey]; if (!items || items.length === 0) return '';
                return `<div><h4 style="font-weight: bold; text-transform: uppercase; margin: 8px 0 4px 0;">-- ${categoryKey.replace(/-/g, ' ')} --</h4>${items.map(item => `<div style="margin-bottom: 2px;"><span><strong>${item.quantidade}x</strong> ${item.nomeItem}</span>${item.observacao ? `<br><span style="padding-left: 15px; font-style: italic;">Obs: ${item.observacao}</span>` : ''}</div>`).join('')}</div>`;
            }).join('')}
            ${order.observacoesPratosQuentes ? `<hr><div><h5 style="font-weight: bold; text-transform: uppercase;">Obs. Pratos Quentes</h5><p>${order.observacoesPratosQuentes}</p></div>` : ''}
            ${order.observacoesGerais ? `<hr><div><h4 style="font-weight: bold; text-transform: uppercase;">Obs. Gerais</h4><p>${order.observacoesGerais}</p></div>` : ''}
            <hr><p style="text-align: center; font-size: 0.8em; margin: 5px 0 0 0;">.</p>
        </div>`;
    printElement(receiptHTML, true);
};
window.printOrderReceipt = printOrderReceipt;

function loadMenu() {
    showLoader('menu');
    renderMenu(window.menuData); 
}
function renderMenu(categories) {
    const menuHTML = `
        <div class="flex justify-between items-center mb-6">
            <div>
                <h3 class="text-xl font-semibold">Gestão de Cardápio</h3>
                <p class="text-[var(--cinza-taupe)] mt-1">Arraste para reordenar. As mudanças são salvas em tempo real.</p>
            </div>
            <button onclick="openCategoryModal()" class="bg-[var(--verde-medio)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Nova Categoria</button>
        </div>
        <div id="categories-list" class="space-y-6">
        ${(categories || []).map(cat => `
            <div class="bg-white rounded-xl shadow-sm border border-[var(--cinza-taupe)]" data-id="${cat.id}">
                <div class="p-4 border-b border-[var(--cinza-taupe)] flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div class="flex items-center gap-4">
                        <svg class="w-5 h-5 text-gray-400 drag-handle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        <h4 class="text-lg font-semibold">${cat.nomeCategoria}</h4>
                    </div>
                    <div class="space-x-4">
                        <button onclick="openMenuItemModal('${cat.id}')" class="text-sm font-medium text-[var(--verde-medio)] hover:underline">Adicionar Item</button>
                        <button onclick="openCategoryModal('${cat.id}', '${cat.nomeCategoria}')" class="text-sm font-medium text-gray-500 hover:text-gray-700">Editar</button>
                    </div>
                </div>
                <div class="p-2">
                   <table class="w-full">
                       <tbody class="item-list" data-category-id="${cat.id}">
                        ${(cat.items || []).map(item => `
                            <tr class="rounded-lg" data-id="${item.id}">
                                <td class="p-3 w-10 text-center"><svg class="w-5 h-5 text-gray-300 drag-handle inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></td>
                                <td class="p-3">
                                    <span class="font-medium">${item.nomeItem}</span>
                                    <span class="text-gray-500 text-sm ml-2">(${item.calorias || 0} kcal)</span>
                                </td>
                                <td class="p-3"><span class="text-sm font-medium px-2.5 py-0.5 rounded-full ${item.disponivel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${item.disponivel ? 'Ativo' : 'Inativo'}</span></td>
                                <td class="p-3 text-right space-x-4"><button onclick="openMenuItemModal('${cat.id}', '${item.id}')" class="text-gray-500 hover:text-[var(--verde-medio)]">Editar</button><button onclick="deleteMenuItem('${cat.id}', '${item.id}')" class="text-gray-500 hover:text-red-600">Excluir</button></td>
                            </tr>`).join('')}
                        </tbody>
                   </table>
                </div>
            </div>`).join('')}
        </div>`;
    document.getElementById('menu').innerHTML = menuHTML;
    initializeMenuSortables();
}

function initializeMenuSortables() {
    const categoriesList = document.getElementById('categories-list');
    if (categoriesList) {
        sortableInstances.push(new Sortable(categoriesList, { handle: '.drag-handle', animation: 150,
            onEnd: async (evt) => {
                const batch = db.batch();
                Array.from(evt.target.children).forEach((item, index) => { batch.update(db.collection('cardapio').doc(item.dataset.id), { posicao: index }); });
                await batch.commit();
                cacheMenuData();
            }
        }));
    }
    document.querySelectorAll('.item-list').forEach(list => {
        sortableInstances.push(new Sortable(list, { handle: '.drag-handle', animation: 150,
            onEnd: async (evt) => {
                const categoryId = evt.target.dataset.categoryId;
                const batch = db.batch();
                Array.from(evt.target.children).forEach((item, index) => { batch.update(db.collection('cardapio').doc(categoryId).collection('itens').doc(item.dataset.id), { posicao: index }); });
                await batch.commit();
                cacheMenuData();
            }
        }));
    });
}
window.openCategoryModal = (id = null, name = '') => {
    // ...
};
window.saveCategory = async (modalId, id) => {
    // ...
};
window.deleteCategory = (id) => {
    // ...
};
window.openMenuItemModal = async (categoryId, itemId = null) => {
    // ...
};
window.saveMenuItem = async (modalId, categoryId, itemId) => {
    // ...
};
window.deleteMenuItem = (categoryId, itemId) => {
    // ...
};


function loadSettings() {
    showLoader('settings');
    Promise.all([
        db.collection('configuracoes').doc('geral').get(),
        db.collection('configuracoes').doc('app').get()
    ]).then(([geralDoc, appDoc]) => {
        const geralConfig = geralDoc.exists ? geralDoc.data() : { cabanas: [], horariosEntrega: [] };
        const appConfig = appDoc.exists ? appDoc.data() : { nomeFazenda: '', subtitulo: '' };
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
                 <div id="cabanas-list" class="space-y-2 mb-4">${(geralConfig.cabanas || []).map((c) => `<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border" data-name="${c.nomeCabana}" data-capacity="${c.capacidadeMaxima}"><div class="flex items-center gap-3"><svg class="w-5 h-5 text-gray-400 drag-handle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg><span>${c.nomeCabana} (Cap: ${c.capacidadeMaxima})</span></div><button onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 text-sm font-medium">Remover</button></div>`).join('')}</div>
                 <div class="flex flex-col sm:flex-row gap-2 mb-4">
                    <input type="text" id="new-cabana-name" placeholder="Nome da Cabana" class="flex-grow border border-gray-300 rounded-lg px-3 py-2">
                    <input type="number" id="new-cabana-capacity" placeholder="Cap." class="w-full sm:w-24 border border-gray-300 rounded-lg px-3 py-2">
                    <button id="add-cabana-btn" class="bg-gray-200 hover:bg-gray-300 font-bold py-2 px-4 rounded-lg">Adicionar</button>
                 </div>
                 <div class="text-right"><button onclick="saveList('cabanas')" class="bg-[var(--verde-medio)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Salvar Cabanas</button></div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-[var(--cinza-taupe)]">
                <h4 class="text-lg font-semibold mb-4">Gerenciar Horários de Entrega</h4>
                 <div id="horarios-list" class="space-y-2 mb-4">${(geralConfig.horariosEntrega || []).map((h) => `<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border" data-value="${h}"><div class="flex items-center gap-3"><svg class="w-5 h-5 text-gray-400 drag-handle" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg><span>${h}</span></div><button onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 text-sm font-medium">Remover</button></div>`).join('')}</div>
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
            const uidInput = document.getElementById('new-admin-uid');
            const feedbackDiv = document.getElementById('admin-feedback');
            if (!uidInput || !feedbackDiv) return;

            const newAdminUid = uidInput.value.trim();
            if (!newAdminUid) {
                feedbackDiv.textContent = 'Por favor, insira um UID.';
                feedbackDiv.className = 'mt-4 text-sm text-red-600';
                return;
            }

            feedbackDiv.textContent = 'Adicionando...';
            feedbackDiv.className = 'mt-4 text-sm text-gray-500';

            try {
                // Nova lógica: escreve diretamente no Firestore
                await db.collection('admins').doc(newAdminUid).set({ isAdmin: true });
                feedbackDiv.textContent = `Sucesso! Usuário ${newAdminUid} agora é um administrador.`;
                feedbackDiv.className = 'mt-4 text-sm text-green-600';
                uidInput.value = '';
            } catch (error) {
                console.error('Erro ao adicionar admin:', error);
                feedbackDiv.textContent = 'Erro: ' + error.message;
                feedbackDiv.className = 'mt-4 text-sm text-red-600';
            }
        });
    }
}

function initializeSettingsSortablesAndButtons() {
    // ...
}

window.saveAppConfig = async () => {
    // ...
}

window.saveList = async (type) => {
    // ...
}
