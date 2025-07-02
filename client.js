// API Base URL - Update this to your actual API endpoint
const API_BASE = 'http://localhost:8000';

let currentUser = null;
let authToken = null;
let products = [];
let cart = [];
let orders = [];

// Utility function to show status messages
function showStatus(message, type = 'success') {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    setTimeout(() => statusDiv.style.display = 'none', 5000);
}

// Authentication Functions
async function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const password_confirm = document.getElementById('confirmPassword').value;

    if (!username || !email || !password) {
        showStatus('Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, password_confirm })
        });

        const data = await response.json();

        if (response.ok) {
            showStatus('Registration successful! Please login.');
            document.getElementById('regUsername').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            showStatus(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showStatus('Please enter email and password', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            showLoggedInState();
            showStatus(`Welcome back, ${currentUser.username || currentUser.email}!`);
        } else {
            showStatus(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }

    localStorage.setItem('authToken', authToken);
}

async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout/`, {
            method: 'POST',
            headers: { 'Authorization': `Token ${localStorage.authToken}` }
        });
    } catch (error) {
        console.log('Logout request failed:', error);
    }

    authToken = null;
    currentUser = null;
    showLoggedOutState();
    showStatus('Logged out successfully');
}

function showLoggedInState() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('productsSection').classList.remove('hidden');
    document.getElementById('cartSection').classList.remove('hidden');
    document.getElementById('ordersSection').classList.remove('hidden');
    document.getElementById('userInfo').classList.remove('hidden');
    document.getElementById('currentUser').textContent = currentUser.username || currentUser.email;
}

function showLoggedOutState() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('productsSection').classList.add('hidden');
    document.getElementById('cartSection').classList.add('hidden');
    document.getElementById('ordersSection').classList.add('hidden');
    document.getElementById('userInfo').classList.add('hidden');
}

// Product Functions
async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE}/store/products/`, {
            headers: { 'Authorization': `Token ${localStorage.authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            products = data;
            displayProducts();
            showStatus('Products loaded successfully');
        } else {
            showStatus(data.message || 'Failed to fetch products', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

function displayProducts() {
    const tbody = document.querySelector('#productsTable tbody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>$${product.price}</td>
            <td>${product.description}</td>
            <td>
                <button onclick="addToCart(${product.id})" class="btn-success">Add to Cart</button>
                <button onclick="deleteProduct(${product.id})" class="btn-danger">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('productsTable').classList.remove('hidden');
}

function showAddProductForm() {
    document.getElementById('addProductForm').classList.remove('hidden');
}

function hideAddProductForm() {
    document.getElementById('addProductForm').classList.add('hidden');
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDescription').value = '';
}

async function addProduct() {
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const description = document.getElementById('productDescription').value;

    if (!name || !price) {
        showStatus('Please fill in name and price', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/products/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.authToken}`
            },
            body: JSON.stringify({ name, price: parseFloat(price), description })
        });

        const data = await response.json();

        if (response.ok) {
            hideAddProductForm();
            fetchProducts();
            showStatus('Product added successfully');
        } else {
            showStatus(data.message || 'Failed to add product', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Token ${localStorage.authToken}` }
        });

        if (response.ok) {
            fetchProducts();
            showStatus('Product deleted successfully');
        } else {
            const data = await response.json();
            showStatus(data.message || 'Failed to delete product', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

// Cart Functions
async function fetchCart() {
    try {
        const response = await fetch(`${API_BASE}/cart`, {
            headers: { 'Authorization': `Token ${localStorage.authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            cart = data;
            displayCart();
            showStatus('Cart loaded successfully');
        } else {
            showStatus(data.message || 'Failed to fetch cart', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

function displayCart() {
    const cartDiv = document.getElementById('cartItems');
    cartDiv.innerHTML = '';

    if (cart.length === 0) {
        cartDiv.innerHTML = '<p>Your cart is empty</p>';
        return;
    }

    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div>
                <strong>${item.name}</strong> - $${item.price} x ${item.quantity}
            </div>
            <div>
                <button onclick="updateCartItem(${item.id}, ${item.quantity - 1})">-</button>
                <button onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                <button onclick="removeFromCart(${item.id})" class="btn-danger">Remove</button>
            </div>
        `;
        cartDiv.appendChild(itemDiv);
    });

    const totalDiv = document.createElement('div');
    totalDiv.innerHTML = `<h3>Total: $${total.toFixed(2)}</h3>`;
    cartDiv.appendChild(totalDiv);
}

async function addToCart(productId) {
    try {
        const response = await fetch(`${API_BASE}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.authToken}`
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (response.ok) {
            showStatus('Item added to cart');
            fetchCart();
        } else {
            const data = await response.json();
            showStatus(data.message || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

async function updateCartItem(itemId, quantity) {
    if (quantity <= 0) {
        removeFromCart(itemId);
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/cart/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.authToken}`
            },
            body: JSON.stringify({ quantity })
        });

        if (response.ok) {
            fetchCart();
        } else {
            const data = await response.json();
            showStatus(data.message || 'Failed to update cart', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

async function removeFromCart(itemId) {
    try {
        const response = await fetch(`${API_BASE}/cart/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Token ${localStorage.authToken}` }
        });

        if (response.ok) {
            fetchCart();
            showStatus('Item removed from cart');
        } else {
            const data = await response.json();
            showStatus(data.message || 'Failed to remove from cart', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

async function clearCart() {
    if (!confirm('Are you sure you want to clear your cart?')) return;

    try {
        const response = await fetch(`${API_BASE}/cart`, {
            method: 'DELETE',
            headers: { 'Authorization': `Token ${localStorage.authToken}` }
        });

        if (response.ok) {
            cart = [];
            displayCart();
            showStatus('Cart cleared');
        } else {
            const data = await response.json();
            showStatus(data.message || 'Failed to clear cart', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

async function checkout() {
    if (cart.length === 0) {
        showStatus('Cart is empty', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Authorization': `Token ${localStorage.authToken}` }
        });

        if (response.ok) {
            cart = [];
            displayCart();
            fetchOrders();
            showStatus('Order placed successfully!');
        } else {
            const data = await response.json();
            showStatus(data.message || 'Checkout failed', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

// Order Functions
async function fetchOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            headers: { 'Authorization': `Token ${localStorage.authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            orders = data;
            displayOrders();
            showStatus('Orders loaded successfully');
        } else {
            showStatus(data.message || 'Failed to fetch orders', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

function displayOrders() {
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = '';

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>$${order.total}</td>
            <td>${order.status}</td>
            <td>
                <button onclick="viewOrderDetails(${order.id})">View Details</button>
                <button onclick="cancelOrder(${order.id})" class="btn-danger">Cancel</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('ordersTable').classList.remove('hidden');
}

async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}`, {
            headers: { 'Authorization': `Token ${localStorage.authToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Order Details:\n${JSON.stringify(data, null, 2)}`);
        } else {
            showStatus(data.message || 'Failed to fetch order details', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Token ${localStorage.authToken}` }
        });

        if (response.ok) {
            fetchOrders();
            showStatus('Order cancelled successfully');
        } else {
            const data = await response.json();
            showStatus(data.message || 'Failed to cancel order', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    showLoggedOutState();
});