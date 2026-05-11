// 从同源 localStorage 读取管理端商品数据
let products = JSON.parse(localStorage.getItem('weigou_products')) || [];
let cart = JSON.parse(localStorage.getItem('weigou_cart')) || [];
let currentCategory = 'all';
let searchKeyword = '';

// 如果没有商品数据，使用默认包包数据（与管理端一致）
if (products.length === 0) {
    products = [
        { id: 'p_bag_0', name: '【爆款】牛皮女士单肩手提包', price: 299, originalPrice: 599, description: '头层牛皮 大容量 通勤百搭 送妈妈送女友首选', tag: '热销', sales: 12580, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop' },
        { id: 'p_bag_1', name: '2026新款时尚链条小方包', price: 159, originalPrice: 399, description: '网红同款 ins风 斜挎链条包 时尚百搭', tag: '新品', sales: 8932, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop' },
        { id: 'p_bag_2', name: '真皮男士商务公文包', price: 459, originalPrice: 999, description: '头层牛皮 大容量电脑包 商务出差必备', tag: '精选', sales: 5621, image: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=400&h=400&fit=crop' },
        { id: 'p_bag_3', name: '韩版双肩包学生书包', price: 89, originalPrice: 199, description: '大容量学生书包 防水耐磨 多色可选', tag: '学生价', sales: 23410, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop' },
        { id: 'p_bag_4', name: '【限时】奢华手拿宴会包', price: 199, originalPrice: 599, description: '亮片设计 晚宴party必备 高级感拉满', tag: '限时', sales: 3421, image: 'https://images.unsplash.com/photo-1591561954555-607968c989ab?w=400&h=400&fit=crop' },
        { id: 'p_bag_5', name: '潮流男士胸包斜挎包', price: 79, originalPrice: 159, description: '潮牌设计 防水尼龙 出街必备神器', tag: '潮品', sales: 15820, image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&h=400&fit=crop' },
        { id: 'p_bag_6', name: '复古英伦风托特包', price: 188, originalPrice: 399, description: 'PU软皮 复古英伦 大容量通勤包', tag: '复古', sales: 7250, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop' },
        { id: 'p_bag_7', name: '迷你水桶包女士斜挎包', price: 119, originalPrice: 269, description: 'ins网红同款 抽绳水桶包 可爱少女风', tag: '少女', sales: 9876, image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=400&fit=crop' },
        { id: 'p_bag_8', name: '大容量旅行行李包', price: 269, originalPrice: 599, description: '加厚牛津布 防水耐磨 出差旅行收纳', tag: '旅行', sales: 6543, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop' },
        { id: 'p_bag_9', name: '编织草编沙滩包', price: 99, originalPrice: 229, description: '夏季度假必备 草编手工 海边度假风', tag: '夏季', sales: 4321, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=400&fit=crop' },
        { id: 'p_bag_10', name: '气质腋下包法棍包', price: 139, originalPrice: 299, description: '今年最火法棍包 高级感腋下包', tag: '爆款', sales: 18750, image: 'https://images.unsplash.com/photo-1606522754091-a3bbf9ad4cb3?w=400&h=400&fit=crop' },
        { id: 'p_bag_11', name: '休闲帆布单肩斜挎包', price: 59, originalPrice: 129, description: '日系帆布包 学生休闲 简约百搭', tag: '日系', sales: 21034, image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=400&h=400&fit=crop' }
    ];
}

const FALLBACK_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f0f0f0"/><text x="100" y="115" text-anchor="middle" font-size="60">👜</text></svg>';

// 工具
function showToast(msg, duration = 2000) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}

function saveCart() {
    localStorage.setItem('weigou_cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartBadge').textContent = total;
}

// 渲染商品列表
function renderProducts() {
    const grid = document.getElementById('shopProducts');
    let filtered = products;
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.tag === currentCategory);
    }
    if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(kw) ||
            (p.description && p.description.toLowerCase().includes(kw))
        );
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center;padding:60px;color:#999;grid-column:1/-1">暂无商品</p>';
        return;
    }
    
    grid.innerHTML = filtered.map(p => `
        <div class="shop-card" onclick="showDetail('${p.id}')">
            ${p.tag ? `<span class="shop-card-tag">${p.tag}</span>` : ''}
            <img src="${p.image || FALLBACK_IMG}" class="shop-card-img" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
            <div class="shop-card-info">
                <div class="shop-card-name">${p.name}</div>
                <div class="shop-card-price-row">
                    <span class="shop-card-price">¥${parseFloat(p.price).toFixed(2)}</span>
                    ${p.originalPrice ? `<span class="shop-card-original">¥${parseFloat(p.originalPrice).toFixed(2)}</span>` : ''}
                </div>
                ${p.sales ? `<div class="shop-card-sales">已售 ${p.sales > 10000 ? (p.sales/10000).toFixed(1) + '万' : p.sales}+</div>` : ''}
            </div>
        </div>
    `).join('');
}

// 商品详情
let currentDetailProduct = null;
let currentQty = 1;

function showDetail(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    currentDetailProduct = p;
    currentQty = 1;
    
    document.getElementById('detailBody').innerHTML = `
        <div class="detail-img-wrap">
            <img src="${p.image || FALLBACK_IMG}" class="detail-img" onerror="this.src='${FALLBACK_IMG}'">
        </div>
        <div class="detail-info">
            <div class="detail-name">${p.name}</div>
            <div class="detail-price-row">
                <span class="detail-price">¥${parseFloat(p.price).toFixed(2)}</span>
                ${p.originalPrice ? `<span class="detail-original">¥${parseFloat(p.originalPrice).toFixed(2)}</span>` : ''}
            </div>
            <div class="detail-desc">${p.description || ''}</div>
            <div class="quantity-row">
                <span class="quantity-label">购买数量</span>
                <div class="quantity-control">
                    <button class="qty-btn" onclick="changeQty(-1)">−</button>
                    <input type="number" class="qty-input" id="qtyInput" value="1" min="1" onchange="setQty(this.value)">
                    <button class="qty-btn" onclick="changeQty(1)">+</button>
                </div>
            </div>
            <div class="detail-actions">
                <button class="btn-add-cart" onclick="addToCart()">加入购物车</button>
                <button class="btn-buy-now" onclick="buyNow()">立即购买</button>
            </div>
        </div>
    `;
    document.getElementById('detailModal').classList.add('active');
}

function changeQty(delta) {
    currentQty = Math.max(1, currentQty + delta);
    document.getElementById('qtyInput').value = currentQty;
}

function setQty(val) {
    currentQty = Math.max(1, parseInt(val) || 1);
    document.getElementById('qtyInput').value = currentQty;
}

function addToCart() {
    const existing = cart.find(c => c.id === currentDetailProduct.id);
    if (existing) {
        existing.qty += currentQty;
    } else {
        cart.push({ ...currentDetailProduct, qty: currentQty });
    }
    saveCart();
    showToast(`已加入购物车 ×${currentQty}`);
    document.getElementById('detailModal').classList.remove('active');
}

function buyNow() {
    addToCart();
    setTimeout(() => openCart(), 300);
}

// 购物车
function openCart() {
    renderCart();
    document.getElementById('cartModal').classList.add('active');
}

function renderCart() {
    const body = document.getElementById('cartBody');
    const footer = document.getElementById('cartFooter');
    
    if (cart.length === 0) {
        body.innerHTML = '<div class="cart-empty">🛒 购物车空空如也<br><br>快去挑选商品吧~</div>';
        footer.innerHTML = '';
        return;
    }
    
    body.innerHTML = cart.map((item, idx) => `
        <div class="cart-item">
            <img src="${item.image || FALLBACK_IMG}" class="cart-item-img" onerror="this.src='${FALLBACK_IMG}'">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-bottom">
                    <span class="cart-item-price">¥${parseFloat(item.price).toFixed(2)}</span>
                    <div class="cart-item-qty">
                        <button onclick="updateCartQty(${idx}, -1)">−</button>
                        <span>${item.qty}</span>
                        <button onclick="updateCartQty(${idx}, 1)">+</button>
                        <button class="cart-remove" onclick="removeCartItem(${idx})">删除</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    footer.innerHTML = `
        <div class="cart-total">
            <span>共 ${count} 件商品</span>
            <span>合计：<span class="cart-total-price">¥${total.toFixed(2)}</span></span>
        </div>
        <button class="btn-checkout" onclick="checkout()">去支付 ¥${total.toFixed(2)}</button>
    `;
}

function updateCartQty(idx, delta) {
    cart[idx].qty = Math.max(1, cart[idx].qty + delta);
    saveCart();
    renderCart();
}

function removeCartItem(idx) {
    cart.splice(idx, 1);
    saveCart();
    renderCart();
}

// 结账 -> 弹支付码
function checkout() {
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    if (total <= 0) return;
    document.getElementById('payAmount').textContent = '¥' + total.toFixed(2);
    
    // 优先使用管理端上传的收款码
    const savedQR = localStorage.getItem('weigou_pay_qr');
    const qrImg = document.getElementById('payQR');
    const qrPlaceholder = document.getElementById('qrPlaceholder');
    if (savedQR) {
        qrImg.src = savedQR;
        qrImg.style.display = 'block';
        if (qrPlaceholder) qrPlaceholder.style.display = 'none';
    } else {
        qrImg.style.display = 'none';
        if (qrPlaceholder) qrPlaceholder.style.display = 'block';
    }
    
    document.getElementById('cartModal').classList.remove('active');
    document.getElementById('payModal').classList.add('active');
}

// 支付完成
document.getElementById('paidBtn').addEventListener('click', () => {
    // 生成订单
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const orders = JSON.parse(localStorage.getItem('weigou_orders')) || [];
    const order = {
        id: 'ORDER_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6).toUpperCase(),
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            image: item.image
        })),
        total: total,
        count: cart.reduce((sum, item) => sum + item.qty, 0),
        status: 'pending', // pending=待发货, shipped=已发货, completed=已完成
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString()
    };
    orders.unshift(order);
    localStorage.setItem('weigou_orders', JSON.stringify(orders));
    
    // 累计收益
    const revenue = parseFloat(localStorage.getItem('weigou_revenue')) || 0;
    localStorage.setItem('weigou_revenue', (revenue + total).toString());
    
    cart = [];
    saveCart();
    document.getElementById('payModal').classList.remove('active');
    showToast(`✅ 订单 ${order.id.slice(-8)} 提交成功！等待商家发货`, 3500);
});

// 事件
document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', () => document.getElementById('cartModal').classList.remove('active'));
document.getElementById('closeDetail').addEventListener('click', () => document.getElementById('detailModal').classList.remove('active'));
document.getElementById('closePay').addEventListener('click', () => document.getElementById('payModal').classList.remove('active'));

document.getElementById('shopSearch').addEventListener('input', (e) => {
    searchKeyword = e.target.value;
    renderProducts();
});

document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;
        renderProducts();
    });
});

// 点击弹窗外部关闭
['detailModal', 'cartModal', 'payModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', (e) => {
        if (e.target.id === id) e.target.classList.remove('active');
    });
});

// 暴露到全局供 onclick 使用
window.showDetail = showDetail;
window.changeQty = changeQty;
window.setQty = setQty;
window.addToCart = addToCart;
window.buyNow = buyNow;
window.updateCartQty = updateCartQty;
window.removeCartItem = removeCartItem;
window.checkout = checkout;

// 初始化
renderProducts();
updateCartBadge();
