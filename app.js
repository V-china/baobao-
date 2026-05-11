// 数据存储
let products = JSON.parse(localStorage.getItem('weigou_products')) || [];
let friends = JSON.parse(localStorage.getItem('weigou_friends')) || generateDefaultFriends();
let selectedProductIds = [];
let selectedFriendIds = [];
let forwardCount = parseInt(localStorage.getItem('weigou_forwards')) || 0;
let totalRevenue = parseFloat(localStorage.getItem('weigou_revenue')) || 0;

// 生成默认好友列表（模拟数据）
function generateDefaultFriends() {
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二', '小明', '小红', '老王', '老李', '小张'];
    const statuses = ['在线', '离线', '忙碌'];
    return names.map((name, i) => ({
        id: `friend_${i}`,
        name: name,
        avatar: name.charAt(0),
        status: statuses[i % 3]
    }));
}

// 保存数据
function saveData() {
    localStorage.setItem('weigou_products', JSON.stringify(products));
    localStorage.setItem('weigou_friends', JSON.stringify(friends));
    localStorage.setItem('weigou_forwards', forwardCount.toString());
    localStorage.setItem('weigou_revenue', totalRevenue.toString());
}

// 显示提示消息
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// 切换视图
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        item.classList.add('active');
        document.getElementById(view + 'View').classList.add('active');
        
        // 根据视图刷新数据
        if (view === 'forward') renderSelectedProducts();
        if (view === 'friends') renderFriends();
        if (view === 'stats') updateStats();
        if (view === 'albums') renderAlbums();
        if (view === 'orders') renderOrders();
    });
});

// === 订单管理 ===
function getOrders() {
    return JSON.parse(localStorage.getItem('weigou_orders')) || [];
}

function saveOrders(orders) {
    localStorage.setItem('weigou_orders', JSON.stringify(orders));
}

function updateOrderBadge() {
    const orders = getOrders();
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const badge = document.getElementById('orderBadge');
    if (!badge) return;
    if (pendingCount > 0) {
        badge.textContent = pendingCount;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

const STATUS_LABEL = { pending: '待发货', shipped: '已发货', completed: '已完成' };

function renderOrders() {
    const container = document.getElementById('ordersContainer');
    const orders = getOrders();
    if (orders.length === 0) {
        container.innerHTML = '<p class="empty-state">暂无订单</p>';
        return;
    }
    container.innerHTML = orders.map(o => {
        const time = new Date(o.paidAt || o.createdAt).toLocaleString('zh-CN');
        return `
            <div class="order-card ${o.status}">
                <div class="order-header">
                    <div>
                        <div class="order-id">订单号 ${o.id.slice(-12)}</div>
                        <div class="order-time">下单时间 ${time}</div>
                    </div>
                    <span class="order-status ${o.status}">${STATUS_LABEL[o.status] || o.status}</span>
                </div>
                <div class="order-items">
                    ${o.items.map(it => `
                        <div class="order-item-row">
                            <img src="${it.image || ''}" onerror="this.style.visibility='hidden'">
                            <span class="name">${it.name}</span>
                            <span class="qty">×${it.qty}</span>
                            <span class="price">¥${(it.price * it.qty).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <span class="order-total">共 ${o.count} 件 合计 <b>¥${o.total.toFixed(2)}</b></span>
                    <div class="order-actions">
                        ${o.status === 'pending' ? `<button class="btn-ship" onclick="shipOrder('${o.id}')">📦 标记发货</button>` : ''}
                        ${o.status === 'shipped' ? `<button class="btn-complete" onclick="completeOrder('${o.id}')">✅ 标记完成</button>` : ''}
                        <button class="btn-delete" onclick="deleteOrder('${o.id}')">删除</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.shipOrder = function(id) {
    const orders = getOrders();
    const o = orders.find(x => x.id === id);
    if (o) { o.status = 'shipped'; o.shippedAt = new Date().toISOString(); }
    saveOrders(orders);
    renderOrders();
    updateOrderBadge();
    showToast('已标记发货');
};

window.completeOrder = function(id) {
    const orders = getOrders();
    const o = orders.find(x => x.id === id);
    if (o) { o.status = 'completed'; o.completedAt = new Date().toISOString(); }
    saveOrders(orders);
    renderOrders();
    showToast('订单已完成');
};

window.deleteOrder = function(id) {
    if (!confirm('确定删除该订单吗？')) return;
    let orders = getOrders();
    orders = orders.filter(x => x.id !== id);
    saveOrders(orders);
    renderOrders();
    updateOrderBadge();
    showToast('订单已删除');
};

// 监听新订单（同源不同标签实时同步）
window.addEventListener('storage', (e) => {
    if (e.key === 'weigou_orders') {
        updateOrderBadge();
        const ordersView = document.getElementById('ordersView');
        if (ordersView && ordersView.classList.contains('active')) renderOrders();
        // 检测是否有新订单
        const oldVal = JSON.parse(e.oldValue || '[]');
        const newVal = JSON.parse(e.newValue || '[]');
        if (newVal.length > oldVal.length) {
            showToast('🔔 收到新订单！');
            playNotifySound();
        }
    }
});

// 简单的提示音（Web Audio）
function playNotifySound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        o.start(); o.stop(ctx.currentTime + 0.4);
    } catch(e) {}
}

// 定时刷新徽章（防止 storage 事件失效）
setInterval(updateOrderBadge, 3000);

// 渲染商品列表
function renderProducts(filter = '') {
    const grid = document.getElementById('productsGrid');
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(filter.toLowerCase()))
    );
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p class="empty-state">暂无商品，点击右上角"添加商品"开始创建</p>';
        return;
    }
    
    grid.innerHTML = filtered.map(product => `
        <div class="product-card">
            ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ''}
            <div class="product-image-wrap">
                <img src="${product.image || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect width=%22200%22 height=%22200%22 fill=%22%23eee%22/><text x=%22100%22 y=%22100%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2220%22>无图片</text></svg>'}" class="product-image" alt="${product.name}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect width=%22200%22 height=%22200%22 fill=%22%23f0f0f0%22/><text x=%22100%22 y=%22110%22 text-anchor=%22middle%22 font-size=%2260%22>👜</text></svg>'">
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price-row">
                    <span class="product-price">¥${parseFloat(product.price).toFixed(2)}</span>
                    ${product.originalPrice ? `<span class="product-original-price">¥${parseFloat(product.originalPrice).toFixed(2)}</span>` : ''}
                </div>
                ${product.sales ? `<div class="product-sales">已售 ${product.sales > 10000 ? (product.sales/10000).toFixed(1) + '万' : product.sales}+</div>` : ''}
                <div class="product-actions">
                    <button class="btn-select ${selectedProductIds.includes(product.id) ? 'selected' : ''}" onclick="toggleSelectProduct('${product.id}')">
                        ${selectedProductIds.includes(product.id) ? '✓ 已选' : '选择'}
                    </button>
                    <button class="btn-edit" onclick="editProduct('${product.id}')">编辑</button>
                    <button class="btn-delete" onclick="deleteProduct('${product.id}')">删除</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 选择/取消选择商品
function toggleSelectProduct(id) {
    const idx = selectedProductIds.indexOf(id);
    if (idx > -1) {
        selectedProductIds.splice(idx, 1);
    } else {
        selectedProductIds.push(id);
    }
    renderProducts(document.getElementById('searchInput').value);
}

// 删除商品
function deleteProduct(id) {
    if (confirm('确定删除该商品吗？')) {
        products = products.filter(p => p.id !== id);
        selectedProductIds = selectedProductIds.filter(pid => pid !== id);
        saveData();
        renderProducts();
        showToast('商品已删除');
    }
}

// 编辑商品
let editingId = null;
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    editingId = id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productDesc').value = product.description || '';
    
    const preview = document.getElementById('imagePreview');
    if (product.image) {
        preview.innerHTML = `<img src="${product.image}" alt="预览">`;
    } else {
        preview.innerHTML = '';
    }
    
    document.querySelector('.modal-header h3').textContent = '编辑商品';
    document.getElementById('addProductModal').classList.add('active');
}

// 渲染选中的商品
function renderSelectedProducts() {
    const container = document.getElementById('selectedProducts');
    const selected = products.filter(p => selectedProductIds.includes(p.id));
    
    if (selected.length === 0) {
        container.innerHTML = '<p class="empty-state">请先在"商品管理"中选择商品</p>';
        return;
    }
    
    container.innerHTML = selected.map(p => `
        <div class="selected-product-item">
            <img src="${p.image || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23eee%22/></svg>'}" alt="${p.name}">
            <div>
                <div style="font-weight:600">${p.name}</div>
                <div style="color:#f44336">¥${parseFloat(p.price).toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

// 渲染好友列表
function renderFriends() {
    const container = document.getElementById('friendsList');
    container.innerHTML = friends.map(f => `
        <div class="friend-card ${selectedFriendIds.includes(f.id) ? 'selected' : ''}" onclick="toggleSelectFriend('${f.id}')">
            <div class="friend-avatar">${f.avatar}</div>
            <div class="friend-info">
                <div class="friend-name">${f.name}</div>
                <div class="friend-status">${f.status}</div>
            </div>
        </div>
    `).join('');
}

function toggleSelectFriend(id) {
    const idx = selectedFriendIds.indexOf(id);
    if (idx > -1) {
        selectedFriendIds.splice(idx, 1);
    } else {
        selectedFriendIds.push(id);
    }
    renderFriends();
}

// 渲染相册
function renderAlbums() {
    const container = document.getElementById('albumsContainer');
    if (products.length === 0) {
        container.innerHTML = '<p class="empty-state">暂无商品图片</p>';
        return;
    }
    container.innerHTML = `
        <div class="products-grid">
            ${products.map(p => `
                <div class="product-card">
                    <img src="${p.image || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect width=%22200%22 height=%22200%22 fill=%22%23eee%22/></svg>'}" class="product-image">
                    <div class="product-info">
                        <div class="product-name">${p.name}</div>
                        <div class="product-price">¥${parseFloat(p.price).toFixed(2)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 更新统计
function updateStats() {
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalFriends').textContent = friends.length;
    document.getElementById('totalForwards').textContent = forwardCount;
    document.getElementById('totalRevenue').textContent = '¥' + totalRevenue.toFixed(2);
}

// 添加商品按钮
document.getElementById('addProductBtn').addEventListener('click', () => {
    editingId = null;
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    document.querySelector('.modal-header h3').textContent = '添加商品';
    document.getElementById('addProductModal').classList.add('active');
});

// 关闭弹窗
function closeModal() {
    document.getElementById('addProductModal').classList.remove('active');
    editingId = null;
}
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);

// 图片上传预览
document.getElementById('productImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        document.getElementById('imagePreview').innerHTML = `<img src="${ev.target.result}" alt="预览">`;
    };
    reader.readAsDataURL(file);
});

// 表单提交
document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const desc = document.getElementById('productDesc').value;
    const imageEl = document.getElementById('imagePreview').querySelector('img');
    const image = imageEl ? imageEl.src : '';
    
    if (editingId) {
        const product = products.find(p => p.id === editingId);
        if (product) {
            product.name = name;
            product.price = price;
            product.description = desc;
            if (image) product.image = image;
        }
        showToast('商品已更新');
    } else {
        products.push({
            id: 'p_' + Date.now(),
            name, price, description: desc, image,
            createdAt: new Date().toISOString()
        });
        showToast('商品已添加');
    }
    
    saveData();
    renderProducts();
    closeModal();
});

// 搜索
document.getElementById('searchInput').addEventListener('input', (e) => {
    renderProducts(e.target.value);
});

// 一键转发到好友
document.getElementById('forwardToFriends').addEventListener('click', () => {
    if (selectedProductIds.length === 0) {
        showToast('请先选择要转发的商品');
        return;
    }
    if (selectedFriendIds.length === 0) {
        showToast('请先在"好友管理"中选择好友');
        return;
    }
    forwardCount += selectedProductIds.length * selectedFriendIds.length;
    saveData();
    showToast(`成功转发 ${selectedProductIds.length} 个商品给 ${selectedFriendIds.length} 位好友！`);
});

// 转发到店铺
document.getElementById('forwardToShop').addEventListener('click', () => {
    if (selectedProductIds.length === 0) {
        showToast('请先选择要转发的商品');
        return;
    }
    forwardCount += selectedProductIds.length;
    saveData();
    showToast(`成功转发 ${selectedProductIds.length} 个商品到店铺！`);
});

// 复制链接
document.getElementById('copyLink').addEventListener('click', () => {
    if (selectedProductIds.length === 0) {
        showToast('请先选择要转发的商品');
        return;
    }
    const links = selectedProductIds.map(id => `${window.location.origin}/product/${id}`).join('\n');
    navigator.clipboard.writeText(links).then(() => {
        showToast('链接已复制到剪贴板');
    }).catch(() => {
        showToast('复制失败，请手动复制');
    });
});

// 生成二维码（简化版）
document.getElementById('generateQR').addEventListener('click', () => {
    if (selectedProductIds.length === 0) {
        showToast('请先选择要转发的商品');
        return;
    }
    showToast(`已为 ${selectedProductIds.length} 个商品生成二维码`);
});

// 全选好友
document.getElementById('selectAllFriends').addEventListener('click', () => {
    if (selectedFriendIds.length === friends.length) {
        selectedFriendIds = [];
        document.getElementById('selectAllFriends').textContent = '全选';
    } else {
        selectedFriendIds = friends.map(f => f.id);
        document.getElementById('selectAllFriends').textContent = '取消全选';
    }
    renderFriends();
});

// 我的店铺
document.getElementById('myShopBtn').addEventListener('click', () => {
    document.querySelector('[data-view="albums"]').click();
});

// 点击弹窗外部关闭
document.getElementById('addProductModal').addEventListener('click', (e) => {
    if (e.target.id === 'addProductModal') closeModal();
});

// === 收款码上传 ===
const payQRModal = document.getElementById('payQRModal');
const payQRPreview = document.getElementById('payQRPreview');
let payQRDataURL = localStorage.getItem('weigou_pay_qr') || '';

function openPayQRModal() {
    payQRPreview.innerHTML = payQRDataURL ? `<img src="${payQRDataURL}" alt="收款码">` : '<p style="color:#999;padding:60px">尚未上传</p>';
    payQRModal.classList.add('active');
}

document.getElementById('uploadPayQRBtn').addEventListener('click', openPayQRModal);
document.getElementById('closePayQRModal').addEventListener('click', () => payQRModal.classList.remove('active'));
payQRModal.addEventListener('click', (e) => { if (e.target.id === 'payQRModal') payQRModal.classList.remove('active'); });

document.getElementById('payQRInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        payQRDataURL = ev.target.result;
        payQRPreview.innerHTML = `<img src="${payQRDataURL}" alt="收款码预览">`;
    };
    reader.readAsDataURL(file);
});

document.getElementById('savePayQR').addEventListener('click', () => {
    if (!payQRDataURL) {
        showToast('请先选择图片');
        return;
    }
    localStorage.setItem('weigou_pay_qr', payQRDataURL);
    showToast('收款码已保存，客户端付款时将自动显示');
    payQRModal.classList.remove('active');
});

document.getElementById('clearPayQR').addEventListener('click', () => {
    payQRDataURL = '';
    localStorage.removeItem('weigou_pay_qr');
    payQRPreview.innerHTML = '<p style="color:#999;padding:60px">已清除</p>';
    document.getElementById('payQRInput').value = '';
    showToast('收款码已清除');
});

// 初始化示例数据（包包商品 - 参考淘宝/拼多多风格）
const SAMPLE_BAGS = [
    { name: '【爆款】牛皮女士单肩手提包', price: 299, originalPrice: 599, description: '头层牛皮 大容量 通勤百搭 送妈妈送女友首选', tag: '热销', sales: 12580, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop' },
    { name: '2026新款时尚链条小方包', price: 159, originalPrice: 399, description: '网红同款 ins风 斜挎链条包 时尚百搭', tag: '新品', sales: 8932, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop' },
    { name: '真皮男士商务公文包', price: 459, originalPrice: 999, description: '头层牛皮 大容量电脑包 商务出差必备', tag: '精选', sales: 5621, image: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=400&h=400&fit=crop' },
    { name: '韩版双肩包学生书包', price: 89, originalPrice: 199, description: '大容量学生书包 防水耐磨 多色可选', tag: '学生价', sales: 23410, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop' },
    { name: '【限时】奢华手拿宴会包', price: 199, originalPrice: 599, description: '亮片设计 晚宴party必备 高级感拉满', tag: '限时', sales: 3421, image: 'https://images.unsplash.com/photo-1591561954555-607968c989ab?w=400&h=400&fit=crop' },
    { name: '潮流男士胸包斜挎包', price: 79, originalPrice: 159, description: '潮牌设计 防水尼龙 出街必备神器', tag: '潮品', sales: 15820, image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&h=400&fit=crop' },
    { name: '复古英伦风托特包', price: 188, originalPrice: 399, description: 'PU软皮 复古英伦 大容量通勤包', tag: '复古', sales: 7250, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop' },
    { name: '迷你水桶包女士斜挎包', price: 119, originalPrice: 269, description: 'ins网红同款 抽绳水桶包 可爱少女风', tag: '少女', sales: 9876, image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=400&fit=crop' },
    { name: '大容量旅行行李包', price: 269, originalPrice: 599, description: '加厚牛津布 防水耐磨 出差旅行收纳', tag: '旅行', sales: 6543, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop' },
    { name: '编织草编沙滩包', price: 99, originalPrice: 229, description: '夏季度假必备 草编手工 海边度假风', tag: '夏季', sales: 4321, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=400&fit=crop' },
    { name: '气质腋下包法棍包', price: 139, originalPrice: 299, description: '今年最火法棍包 高级感腋下包', tag: '爆款', sales: 18750, image: 'https://images.unsplash.com/photo-1606522754091-a3bbf9ad4cb3?w=400&h=400&fit=crop' },
    { name: '休闲帆布单肩斜挎包', price: 59, originalPrice: 129, description: '日系帆布包 学生休闲 简约百搭', tag: '日系', sales: 21034, image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=400&h=400&fit=crop' }
];

if (products.length === 0 || localStorage.getItem('weigou_init_v2') !== '1') {
    products = SAMPLE_BAGS.map((s, i) => ({
        id: 'p_bag_' + i,
        ...s,
        createdAt: new Date().toISOString()
    }));
    localStorage.setItem('weigou_init_v2', '1');
    saveData();
}

// 初始渲染
renderProducts();
updateStats();
updateOrderBadge();
