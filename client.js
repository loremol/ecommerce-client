const API_ENDPOINT = 'https://ecommerce-django-production-f55b.up.railway.app';

let currentUser = null;
let categories = [];
let products = [];
let cart = [];
let ownOrders = [];

let users = [];
let allOrders = [];


// Utility function to show status messages
function showStatus(message, type = 'success') {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.className = `status ${type}`;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    setTimeout(() => statusDiv.style.display = 'none', 5000);
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, email, password, password_confirm})
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password}),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('authToken', data.token);
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
            headers: {'Authorization': `Token ${localStorage.authToken}`},
        });
    } catch (error) {
        console.log('Logout request failed:', error);
    }

    currentUser = null;
    showLoggedOutState();
    showStatus('Logged out successfully');
}

async function populateProfile() {
    try {
        const response = await fetch(`${API_ENDPOINT}/auth/profile/`, {
            method: 'GET',
            headers: {'Authorization': `Token ${localStorage.authToken}`},
        });
        const data = await response.json();

        if (response.ok) {
            document.getElementById('updUsername').value = data.username || '';
            document.getElementById('updEmail').value = data.email || '';
            document.getElementById('updPhone').value = data.phone || '';
            document.getElementById('updAddress').value = data.address || '';
            document.getElementById('updDateOfBirth').value = data.date_of_birth || '';
        } else {
            showStatus(`Failed to fetch profile: ${data}`)
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

async function updateProfile() {
    const username = document.getElementById('updUsername').value;
    const email = document.getElementById('updEmail').value;
    const password = document.getElementById('updPassword').value;
    const phone = document.getElementById('updPhone').value;
    const address = document.getElementById('updAddress').value;
    const date_of_birth = document.getElementById('updDateOfBirth').value;

    try {
        const response = await fetch(`${API_ENDPOINT}/auth/update/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.authToken}`
            },
            body: JSON.stringify({username, email, password, phone, address, date_of_birth})
        });

        const data = await response.json();

        if (response.ok) {
            showStatus('Profile updated successfully!');
        } else {
            showStatus(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

function showLoggedInState() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('userInfo').classList.remove('hidden');
    document.getElementById('profileSection').classList.remove('hidden');
    document.getElementById('categoriesSection').classList.remove('hidden');
    document.getElementById('productsSection').classList.remove('hidden');
    document.getElementById('cartSection').classList.remove('hidden');
    document.getElementById('ordersSection').classList.remove('hidden');
    document.getElementById('userManagementSection').classList.remove('hidden');
    document.getElementById('allOrdersSection').classList.remove('hidden');
    document.getElementById('discountsManagementSection').classList.remove('hidden');
    document.getElementById('currentUser').textContent = currentUser.username || currentUser.email;
}

function showLoggedOutState() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('userInfo').classList.add('hidden');
    document.getElementById('profileSection').classList.add('hidden');
    document.getElementById('categoriesSection').classList.add('hidden');
    document.getElementById('productsSection').classList.add('hidden');
    document.getElementById('cartSection').classList.add('hidden');
    document.getElementById('ordersSection').classList.add('hidden');
    document.getElementById('userManagementSection').classList.add('hidden');
    document.getElementById('allOrdersSection').classList.add('hidden');
    document.getElementById('discountsManagementSection').classList.add('hidden');
}

// User Management (Moderators Only)
async function fetchUsers() {

    try {
        const response = await fetch(`${API_ENDPOINT}/auth/users/`, {
            headers: {'Authorization': `Token ${localStorage.authToken}`}
        });

        const data = await response.json();

        if (response.ok) {
            users = data;
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
                'Authorization': `Token ${localStorage.authToken}`
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
            headers: {'Authorization': `Token ${localStorage.authToken}`}
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

// Category
// Fetch categories from the API
async function fetchCategories() {
    try {
        const response = await fetch(`${API_ENDPOINT}/store/categories/`, {
            headers: {'Authorization': `Token ${localStorage.authToken}`}
        });

        const data = await response.json();

        if (response.ok) {
            categories = data;
            displayCategories();
            populateCategorySelect(); // Update the product form dropdown
            showStatus('Categories loaded successfully');
        } else {
            showStatus(data.message || 'Failed to fetch categories', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

// Display categories in the table
function displayCategories() {
    const tbody = document.querySelector('#categoriesTable tbody');
    tbody.innerHTML = '';

    categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.id}</td>
            <td>${category.name}</td>
            <td>${category.description || 'No description'}</td>
            <td>
                <button onclick="showUpdateCategoryForm(${category.id})" class="btn-warning">Edit</button>
                <button onclick="deleteCategory(${category.id})" class="btn-danger">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('categoriesTable').classList.remove('hidden');
}

// Create a new category
async function createCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();

    if (!name) {
        showStatus('Please enter a category name', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/store/categories/create/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.authToken}`
            },
            body: JSON.stringify({
                name,
                description
            })
        });

        const data = await response.json();

        if (response.ok) {
            hideAddCategoryForm();
            fetchCategories(); // Refresh the categories list
            showStatus('Category created successfully');
        } else {
            showStatus(data.message || 'Failed to create category', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

// Delete a category
async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/store/categories/delete/${categoryId}/`, {
            method: 'DELETE',
            headers: {'Authorization': `Token ${localStorage.authToken}`}
        });

        if (response.ok) {
            await fetchCategories();
            showStatus('Category deleted successfully');
        } else {
            const data = await response.json();
            showStatus(data.message || 'Failed to delete category', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

function showAddCategoryForm() {
    document.getElementById('addCategoryForm').classList.remove('hidden');
}

function hideAddCategoryForm() {
    document.getElementById('addCategoryForm').classList.add('hidden');
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDescription').value = '';
}

function populateCategorySelect() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return; // Exit if element doesn't exist

    categorySelect.innerHTML = '<option value="">Select a category</option>';

    if (categories && categories.length > 0) {
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }
}

function showUpdateCategoryForm(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
        showStatus('Category not found', 'error');
        return;
    }

    document.getElementById('updateCategoryId').value = category.id;
    document.getElementById('updateCategoryName').value = category.name;
    document.getElementById('updateCategoryDescription').value = category.description || '';

    // Hide add form if visible
    hideAddCategoryForm();

    document.getElementById('updateCategoryForm').classList.remove('hidden');
}

function hideUpdateCategoryForm() {
    document.getElementById('updateCategoryForm').classList.add('hidden');
    document.getElementById('updateCategoryId').value = '';
    document.getElementById('updateCategoryName').value = '';
    document.getElementById('updateCategoryDescription').value = '';
}

async function updateCategory() {
    const categoryId = document.getElementById('updateCategoryId').value;
    const name = document.getElementById('updateCategoryName').value.trim();
    const description = document.getElementById('updateCategoryDescription').value.trim();

    if (!name) {
        showStatus('Please enter a category name', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/store/categories/update/${categoryId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.authToken}`
            },
            body: JSON.stringify({
                name,
                description
            })
        });

        const data = await response.json();

        if (response.ok) {
            hideUpdateCategoryForm();
            fetchCategories(); // Refresh the categories list
            showStatus('Category updated successfully');
        } else {
            showStatus(data.message || 'Failed to update category', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
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
                <button onclick="showUpdateProductForm(${product.id})" class="btn-warning">Edit</button>
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
                'Authorization': `Token ${localStorage.authToken}`
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

function showUpdateProductForm(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showStatus('Product not found', 'error');
        return;
    }

    // Populate category dropdown first
    populateUpdateCategorySelect();

    document.getElementById('updateProductId').value = product.id;
    document.getElementById('updateProductName').value = product.name;
    document.getElementById('updateProductPrice').value = product.price;
    document.getElementById('updateProductDescription').value = product.description || '';
    document.getElementById('updateProductCategory').value = product.category.id;
    document.getElementById('updateProductStock').value = product.stock_quantity;
    document.getElementById('updateProductWeight').value = product.weight || '';
    document.getElementById('updateProductDimensions').value = product.dimensions || '';

    // Hide add form if visible
    hideAddProductForm();

    document.getElementById('updateProductForm').classList.remove('hidden');
}

function hideUpdateProductForm() {
    document.getElementById('updateProductForm').classList.add('hidden');
    document.getElementById('updateProductId').value = '';
    document.getElementById('updateProductName').value = '';
    document.getElementById('updateProductPrice').value = '';
    document.getElementById('updateProductDescription').value = '';
    document.getElementById('updateProductCategory').value = '';
    document.getElementById('updateProductStock').value = '';
    document.getElementById('updateProductWeight').value = '';
    document.getElementById('updateProductDimensions').value = '';
}

function populateUpdateCategorySelect() {
    const categorySelect = document.getElementById('updateProductCategory');
    if (!categorySelect) return;

    categorySelect.innerHTML = '<option value="">Select a category</option>';

    if (categories && categories.length > 0) {
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }
}

async function updateProduct() {
    const productId = document.getElementById('updateProductId').value;
    const name = document.getElementById('updateProductName').value;
    const price = document.getElementById('updateProductPrice').value;
    const description = document.getElementById('updateProductDescription').value;
    const categoryId = document.getElementById('updateProductCategory').value;
    const stock_quantity = document.getElementById('updateProductStock').value || 0;
    const weight = document.getElementById('updateProductWeight').value || '';
    const dimensions = document.getElementById('updateProductDimensions').value || '';

    if (!name || !price || !categoryId) {
        showStatus('Please fill in name, price, and category', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/store/products/update/${productId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.authToken}`
            },
            body: JSON.stringify({
                name,
                price: parseFloat(price),
                description,
                category: parseInt(categoryId), // Send just the category ID
                stock_quantity: parseInt(stock_quantity),
                weight,
                dimensions
            })
        });

        const data = await response.json();

        if (response.ok) {
            hideUpdateProductForm();
            fetchProducts();
            showStatus('Product updated successfully');
        } else {
            showStatus(data.message || 'Failed to update product', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`${API_ENDPOINT}/store/products/delete/${productId}/`, {
            method: 'DELETE',
            headers: {'Authorization': `Token ${localStorage.authToken}`}
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

// Discounts
// Add this function to fetch categories and populate the dropdown
async function loadCategories() {
    try {
        const response = await fetch(`${API_ENDPOINT}/store/categories/`, {
            method: 'DELETE',
            headers: {'Authorization': `Token ${localStorage.authToken}`}
        });
        const data = await response.json();
        const categorySelect = document.getElementById('category');
        categories = data;
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        showStatus('Failed to load categories: ' + error.message, 'error');
    }
}

// Add this function to create a discount
async function createDiscount() {
    const code = document.getElementById('code').value;
    const percentage = parseFloat(document.getElementById('percentage').value);
    const expiryDate = document.getElementById('expiryDate').value;
    const category = document.getElementById('category').value;

    try {
        const response = await fetch(`${API_ENDPOINT}/cart/create_discount`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Authorization': `Token ${localStorage.authToken}`},
            body: JSON.stringify({code, percentage, expiry_date: expiryDate, category})
        });

        if (response.ok) {
            showStatus('Discount created successfully!');
            document.getElementById('discountForm').reset();
            await loadDiscounts(); // Refresh the list of discounts
        } else {
            const data = await response.json();
            showStatus(data.message || 'Failed to create discount', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

// Add this function to delete a discount
async function deleteDiscount(discountId) {
    try {
        const response = await fetch(`${API_ENDPOINT}/cart/delete_discount/${discountId}`, {
            headers: {'Authorization': `Token ${localStorage.authToken}`},
            method: 'DELETE'
        });

        if (response.ok) {
            showStatus('Discount deleted successfully!');
            await loadDiscounts(); // Refresh the list of discounts
        } else {
            const data = await response.json();
            showStatus(data.message || 'Failed to delete discount', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

// Add this function to load and display all discounts
async function loadDiscounts() {
    try {
        const response = await fetch(`${API_ENDPOINT}/cart/discounts/`, {
            headers: {'Authorization': `Token ${localStorage.authToken}`}
        });
        const data = await response.json();
        const discountList = document.getElementById('discountList');
        discountList.innerHTML = ''; // Clear the list

        data.forEach(discount => {
            const li = document.createElement('li');
            li.textContent = `${discount.code} - ${discount.percentage}% off until ${discount.expiry_date}`;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteDiscount(discount.id);
            li.appendChild(deleteButton);
            discountList.appendChild(li);
        });
    } catch (error) {
        showStatus('Failed to load discounts: ' + error.message, 'error');
    }
}

function toggleDiscountForm() {
    const discountForm = document.getElementById('discountForm');
    if (discountForm.style.display === 'none' || discountForm.style.display === '') {
        discountForm.style.display = 'block';
    } else {
        discountForm.style.display = 'none';
    }
}



// Order
async function fetchOrders() {
    try {
        const response = await fetch(`${API_ENDPOINT}/orders/`, {
            headers: {'Authorization': `Token ${localStorage.authToken}`}
        });

        const data = await response.json();

        if (response.ok) {
            ownOrders = data;
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

    ownOrders.forEach(order => {
        const row = document.createElement('tr');

        let cancelOrderButton = `<button onclick="updateOrderStatus(${order.id}, 'C')"
                    class="btn-danger" style="margin-left: 10px;"> Cancel Order</button>`;


        const statusBadgeColors = {
            'P': '#f39c12',  // Orange for Pending
            'S': '#3498db',  // Blue for Shipped
            'D': '#27ae60',  // Green for Delivered
            'C': '#e74c3c'   // Red for Cancelled
        };

        const statusNames = {
            'P': 'Pending',
            'S': 'Shipped',
            'D': 'Delivered',
            'C': 'Cancelled'
        };

        row.innerHTML = `
            <td>${order.id}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>€${order.total}</td>
            <td>
                <span style="background: ${statusBadgeColors[order.status]}; 
                           color: white; 
                           padding: 3px 8px; 
                           border-radius: 3px; 
                           font-size: 0.9em;">
                    ${statusNames[order.status] || order.status}
                </span>
                ${cancelOrderButton}
            </td>
            <td>
                <button onclick="viewOrderDetails(${order.id})">View Details</button>
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

async function updateOrderStatus(orderId, newStatus) {
    const statusNames = {
        'P': 'Pending',
        'S': 'Shipped',
        'D': 'Delivered',
        'C': 'Cancelled'
    };

    if (!confirm(`Are you sure you want to change this order to "${statusNames[newStatus]}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/orders/update/${orderId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.authToken}`
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        const data = await response.json();

        if (response.ok) {
            showStatus(`Order #${orderId} updated successfully`);

            // Refresh appropriate view
            if (document.getElementById('allOrdersSection').classList.contains('hidden') === false) {
                await fetchAllOrders(); // Refresh all orders if in admin view
            } else {
                fetchOrders(); // Refresh user's orders
            }

            // If the order was cancelled, also refresh products to show updated stock
            if (newStatus === 'C') {
                fetchProducts();
            }
        } else {
            showStatus(data.error || 'Failed to update order', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

// admin
async function fetchAllOrders() {
    try {
        const response = await fetch(`${API_ENDPOINT}/orders/all/`, {
            headers: {'Authorization': `Token ${localStorage.authToken}`}
        });

        const data = await response.json();

        if (response.ok) {
            allOrders = data;
            displayAllOrders();
            await fetchOrderStatistics();
            showStatus('All orders loaded successfully');
        } else {
            showStatus(data.error || 'Failed to fetch all orders', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

function displayAllOrders() {
    const tbody = document.querySelector('#allOrdersTable tbody');
    tbody.innerHTML = '';

    const statusBadgeColors = {
        'P': '#f39c12',  // Orange for Pending
        'S': '#3498db',  // Blue for Shipped
        'D': '#27ae60',  // Green for Delivered
        'C': '#e74c3c'   // Red for Cancelled
    };

    const statusNames = {
        'P': 'Pending',
        'S': 'Shipped',
        'D': 'Delivered',
        'C': 'Cancelled'
    };

    document.getElementById('allOrdersTable').classList.remove('hidden');
}

async function fetchOrderStatistics() {
    try {
        const response = await fetch(`${API_ENDPOINT}/orders/stats/`, {
            method: 'GET',
            headers: {'Authorization': `Token ${localStorage.authToken}`}
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('totalOrders').textContent = `Total: ${data.total_orders}`;
            document.getElementById('pendingOrders').textContent = `Pending: ${data.pending_orders}`;
            document.getElementById('shippedOrders').textContent = `Shipped: ${data.shipped_orders}`;
            document.getElementById('deliveredOrders').textContent = `Delivered: ${data.delivered_orders}`;
            document.getElementById('cancelledOrders').textContent = `Cancelled: ${data.cancelled_orders}`;
            document.getElementById('totalRevenue').textContent = data.total_revenue.toFixed(2);

            document.getElementById('ordersStats').style.display = 'block';
        }
    } catch (error) {
        showStatus('Error fetching order statistics: ' + error.message, 'error');
    }
}

async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to permanently delete this order? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}/orders/cancel/${orderId}/`, {
            method: 'DELETE',
            headers: {'Authorization': `Token ${localStorage.authToken}`}
        });

        if (response.ok) {
            await fetchAllOrders(); // Refresh all orders
            await fetchProducts(); // Refresh products to show restored stock
            showStatus('Order deleted successfully');
        } else {
            const data = await response.json();
            showStatus(data.error || 'Failed to delete order', 'error');
        }
    } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    showLoggedOutState();
});