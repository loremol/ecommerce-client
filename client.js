const API_ENDPOINT = 'https://ecommerce-django-production-f55b.up.railway.app';

let currentUser = null;
let products = [];
let cart = [];
let orders = [];
let users = [];
let allUsers = []; // For search functionality

// Utility function to show status messages
function showStatus(message, type = 'success') {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    setTimeout(() => statusDiv.style.display = 'none', 5000);
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        console.log(cookies);
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Authentication
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
        const response = await fetch(`${API_ENDPOINT}/auth/register/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-CSRFToken': `${getCookie('csrftoken')}`},
            body: JSON.stringify({username, email, password, password_confirm}),
            credentials: 'include',
            withCredentials: true
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
        const response = await fetch(`${API_ENDPOINT}/auth/login/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-CSRFToken': `${getCookie('csrftoken')}`},
            body: JSON.stringify({email, password}),
            credentials: 'include',
            withCredentials: true
        });

        const data = await response.json();

        if (response.ok) {
            // localStorage.setItem('authToken', data.token);
            currentUser = data.user;
            showLoggedInState();
            showStatus(`Welcome back, ${currentUser.username || currentUser.email}!`);
        } else {
            showStatus(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }

}

async function logout() {
    try {
        await fetch(`${API_ENDPOINT}/auth/logout/`, {
            method: 'POST',
            // headers: { 'Authorization': `Token ${localStorage.authToken}`,
            //             'Content-Type': 'application/json'},
            headers: {'Content-Type': 'application/json', 'X-CSRFToken': `${getCookie('csrftoken')}`},
            credentials: 'include',
            withCredentials: true
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

// User Management (Moderators Only)
async function fetchUsers() {

    try {
        const response = await fetch(`${API_ENDPOINT}/auth/users/`, {
            headers: {'Authorization': `Token ${authToken}`}
        });

        const data = await response.json();

        if (response.ok) {
            users = data;
            allUsers = [...data]; // Store original list for search
            displayUsers();
            showStatus('Users loaded successfully');
        } else {
            showStatus(data.message || 'Failed to fetch users', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

function displayUsers() {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        const statusClass = user.is_banned ? 'banned' : 'active';
        const statusText = user.is_banned ? 'BANNED' : 'ACTIVE';
        const banButtonText = user.is_banned ? 'Unban' : 'Ban';
        const banButtonClass = user.is_banned ? 'btn-success' : 'btn-danger';

        row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td><span class="user-status ${statusClass}">${statusText}</span></td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                        <button onclick="toggleUserBan('${user.username}', ${user.is_banned})" class="${banButtonClass}" 
                                ${user.id === currentUser.id ? 'disabled' : ''}>${banButtonText}</button>
                        <button onclick="viewUserProfile(${user.id})" class="btn-warning">View Profile</button>
                    </td>
                `;
        tbody.appendChild(row);
    });

    document.getElementById('usersTable').classList.remove('hidden');
}

async function toggleUserBan(username, currentlyBanned) {

    const action = currentlyBanned ? 'unban' : 'ban';
    const confirmMessage = `Are you sure you want to ${action} user "${username}"?`;

    if (!confirm(confirmMessage)) return;

    try {
        const endpoint = currentlyBanned ?
            `${API_ENDPOINT}/auth/unban/` :
            `${API_ENDPOINT}/auth/ban/`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`
            },
            body: JSON.stringify({username})
        });

        const data = await response.json();

        if (response.ok) {
            showStatus(`User ${username} ${action}ned successfully`);
            fetchUsers(); // Refresh the user list
        } else {
            showStatus(data.error || `Failed to ${action} user`, 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

async function viewUserProfile(userId) {
    try {
        const response = await fetch(`${API_ENDPOINT}/auth/users/${userId}/`, {
            headers: {'Authorization': `Token ${authToken}`}
        });

        const data = await response.json();

        if (response.ok) {
            const userInfo = `
                User Profile:
                ID: ${data.id}
                Username: ${data.username}
                Email: ${data.email}
                Phone: ${data.phone || 'Not provided'}
                Address: ${data.address || 'Not provided'}
                Date of Birth: ${data.date_of_birth || 'Not provided'}
                Status: ${data.is_banned ? 'BANNED' : 'ACTIVE'}
                Date Joined: ${new Date(data.created_at).toLocaleDateString()}
                Last Updated: ${new Date(data.updated_at).toLocaleDateString()}
                    `;
            alert(userInfo);
        } else {
            showStatus(data.message || 'Failed to fetch user profile', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

function filterUsers() {
    const searchTerm = document.getElementById('userSearchBox').value.toLowerCase();

    if (searchTerm === '') {
        users = [...allUsers];
    } else {
        users = allUsers.filter(user =>
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
    }

    displayUsers();
}

function clearUserSearch() {
    document.getElementById('userSearchBox').value = '';
    users = [...allUsers];
    displayUsers();
}


// Product
async function fetchProducts() {
    try {
        const response = await fetch(`${API_ENDPOINT}/store/products/`, {
            headers: {'Authorization': `Token ${localStorage.authToken}`}
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

async function fetchCategories() {
    try {
        const response = await fetch(`${API_ENDPOINT}/store/categories/`, {
            headers: {'Authorization': `Token ${authToken}`}
        });

        const data = await response.json();

        if (response.ok) {
            categories = data;
            populateCategorySelect();
        } else {
            showStatus(data.message || 'Failed to fetch categories', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

function populateCategorySelect() {
    const categorySelect = document.getElementById('productCategory');
    categorySelect.innerHTML = '<option value="">Select a category</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
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
            <td>${product.category.name}</td>
            <td>${product.stock_quantity}</td>
            <td>${product.weight}</td>
            <td>${product.dimensions}</td>
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
    fetchCategories(); // Load categories when showing the form
    document.getElementById('addProductForm').classList.remove('hidden');
}

function hideAddProductForm() {
    document.getElementById('addProductForm').classList.add('hidden');
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDescription').value = '';
}

async function createProduct() {
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const description = document.getElementById('productDescription').value;
    const category = document.getElementById('productCategory').value;
    const stock_quantity = document.getElementById('productStock').value || 0;
    const weight = document.getElementById('productWeight').value || '';
    const dimensions = document.getElementById('productDimensions').value || '';

    if (!name || !price || !category) {
        showStatus('Please fill in name, price, and category', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/store/products/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`
            },
            body: JSON.stringify({
                name,
                price: parseFloat(price),
                description,
                category: parseInt(category),
                stock_quantity: parseInt(stock_quantity),
                weight,
                dimensions
            })
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
        const response = await fetch(`${API_ENDPOINT}/store/products/${productId}/`, {
            method: 'DELETE',
            headers: {'Authorization': `Token ${authToken}`}
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

// Cart
async function fetchCart() {
    try {
        const response = await fetch(`${API_ENDPOINT}/cart/`, {
            headers: {'Authorization': `Token ${localStorage.authToken}`}
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

async function addToCart(product) {
    try {
        const response = await fetch(`${API_ENDPOINT}/cart/add/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.authToken}`
            },
            body: JSON.stringify({product: product, quantity: 1})
        });

        if (response.ok) {
            showStatus('Item added to cart');
            fetchCart();
        } else if (response.status === 400) {
            showStatus('Not enough product in stock', 'error');
        } else {
            const data = await response.json();
            showStatus(data.message || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
    await fetchProducts();
}

async function removeFromCart(itemId) {
    try {
        const response = await fetch(`${API_ENDPOINT}/cart/${itemId}`, {
            method: 'DELETE',
            headers: {'Authorization': `Token ${localStorage.authToken}`}
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
        const response = await fetch(`${API_ENDPOINT}/cart/clear/`, {
            method: 'DELETE',
            headers: {'Authorization': `Token ${localStorage.authToken}`}
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

async function applyDiscount() {
    const discountCode = document.getElementById('discountCode').value.trim();

    if (!discountCode) {
        showStatus('Please enter a discount code', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/cart/apply_discount/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.authToken}`
            },
            body: JSON.stringify({discount_code: discountCode})
        });

        const data = await response.json();

        if (response.ok) {
            showStatus('Discount applied successfully!');
            document.getElementById('discountCode').value = ''; // Clear the input
            fetchCart(); // Refresh cart to show updated prices
        } else {
            showStatus(data.error || 'Failed to apply discount', 'error');
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
    let originalTotal = 0;

    cart.forEach(item => {
        // Access product details from the nested product object
        const productName = item.product.name;
        const originalPrice = parseFloat(item.product.price);

        // Check if discounted_price exists, otherwise use original price
        const discountedPrice = item.discounted_price ? parseFloat(item.discounted_price) : originalPrice;
        const hasDiscount = item.discount_applied || (item.discounted_price && item.discounted_price !== item.product.price);

        const itemTotal = discountedPrice * item.quantity;
        const originalItemTotal = originalPrice * item.quantity;

        total += itemTotal;
        originalTotal += originalItemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.style.cssText = 'border: 1px solid #ddd; padding: 10px; margin: 5px 0; display: flex; justify-content: space-between; align-items: center;';

        // Show original price crossed out if discount is applied
        const priceDisplay = hasDiscount ?
            `<span style="text-decoration: line-through; color: #999;">€${originalPrice.toFixed(2)}</span> <span style="color: #090; font-weight: bold;">€${discountedPrice.toFixed(2)}</span>` :
            `€${discountedPrice.toFixed(2)}`;

        const totalDisplay = hasDiscount ?
            `<span style="text-decoration: line-through; color: #999;">€${originalItemTotal.toFixed(2)}</span> <span style="color: #090; font-weight: bold;">€${itemTotal.toFixed(2)}</span>` :
            `€${itemTotal.toFixed(2)}`;

        itemDiv.innerHTML = `
            <div>
                <strong>${productName}</strong><br>
                ${priceDisplay} x ${item.quantity} = ${totalDisplay}
                ${hasDiscount ? '<br><small style="color: #090;">✓ Discount applied</small>' : ''}
            </div>
            <div>
                <button onclick="removeFromCart(${item.id})" class="btn-danger">Remove</button>
            </div>
        `;
        cartDiv.appendChild(itemDiv);
    });

    // Show total with savings if any discounts were applied
    const totalDiv = document.createElement('div');
    totalDiv.style.cssText = 'border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;';

    if (originalTotal > total) {
        const savings = originalTotal - total;
        totalDiv.innerHTML = `
            <div style="text-align: right;">
                <div style="text-decoration: line-through; color: #999;">Original Total: €${originalTotal.toFixed(2)}</div>
                <div style="color: #090; font-weight: bold;">You Save: €${savings.toFixed(2)}</div>
                <h3 style="color: #090;">Final Total: €${total.toFixed(2)}</h3>
            </div>
        `;
    } else {
        totalDiv.innerHTML = `<h3 style="text-align: right;">Total: €${total.toFixed(2)}</h3>`;
    }

    cartDiv.appendChild(totalDiv);
}

// Order
async function fetchOrders() {
    try {
        const response = await fetch(`${API_ENDPOINT}/orders/`, {
            headers: {'Authorization': `Token ${localStorage.authToken}`}
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
            <td>€${order.total}</td>
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
        const response = await fetch(`${API_ENDPOINT}/orders/${orderId}/`, {
            headers: {'Authorization': `Token ${localStorage.authToken}`}
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
        const response = await fetch(`${API_ENDPOINT}/orders/cancel/${orderId}/`, {
            method: 'DELETE',
            headers: {'Authorization': `Token ${localStorage.authToken}`}
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
    await fetchProducts();
}

async function checkout() {
    // Check if cart has items before attempting checkout
    if (!cart || cart.length === 0) {
        showStatus('Your cart is empty. Add some items before checkout.', 'error');
        return;
    }

    // Confirm checkout with user
    if (!confirm('Are you sure you want to proceed with checkout?')) {
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/orders/checkout/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.authToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Successful checkout
            showStatus(`Order created successfully! Order ID: ${data.order_id}. Total: €${data.total.toFixed(2)}`);

            // Clear the cart display and refresh data
            cart = [];
            displayCart();

            // Optionally refresh orders and products to show updated data
            if (document.getElementById('ordersSection').classList.contains('hidden') === false) {
                fetchOrders();
            }
            fetchProducts(); // Refresh to show updated stock quantities

        } else {
            // Handle specific error cases
            if (data.error) {
                showStatus(data.error, 'error');
            } else {
                showStatus('Checkout failed. Please try again.', 'error');
            }
        }
    } catch (error) {
        showStatus('Network error during checkout: ' + error.message, 'error');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    showLoggedOutState();
});