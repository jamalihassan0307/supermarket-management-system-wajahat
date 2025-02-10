// API Base URL
const BASE_URL = "https://677513ab92222241481a9631.mockapi.io/api";

// API Service functions
const apiService = {
  // Products API
  async getProducts() {
    const response = await fetch(`${BASE_URL}/products`);
    return await response.json();
  },

  async addProduct(product) {
    const response = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    return await response.json();
  },

  async updateProduct(id, product) {
    const response = await fetch(`${BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    return await response.json();
  },

  async deleteProduct(id) {
    await fetch(`${BASE_URL}/products/${id}`, {
      method: "DELETE",
    });
  },

  // Bills API
  async getBills() {
    const response = await fetch(`${BASE_URL}/bills`);
    return await response.json();
  },

  async getBill(id) {
    const response = await fetch(`${BASE_URL}/bills/${id}`);
    return await response.json();
  },

  async createBill(bill) {
    const response = await fetch(`${BASE_URL}/bills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bill),
    });
    return await response.json();
  },
};

// Check if we're on the index page
function isIndexPage() {
  return window.location.pathname.includes("index.html");
}

// Login functionality
function validateLogin(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Simple validation (in real app, this should be more secure)
  if (username === "demo" && password === "1234") {
    // Store login state in sessionStorage
    sessionStorage.setItem("isLoggedIn", "true");
    window.location.href = "index.html";
  } else {
    alert("Invalid credentials!");
  }
}

// Product management
async function addProduct(event) {
  event.preventDefault();
  try {
    const name = document.getElementById("productName").value;
    const price = parseFloat(document.getElementById("productPrice").value);
    const editId = document.getElementById("editProductId").value;
    const submitBtn = document.getElementById("productSubmitBtn");
    const formTitle = document.querySelector("#productForm h2");

    if (editId) {
      // Update existing product
      await apiService.updateProduct(editId, { name, price });

      // Update the specific product in the list without full reload
      const updatedProduct = { id: editId, name, price };
      updateProductInList(updatedProduct);

      // Reset form state
      document.getElementById("editProductId").value = "";
      submitBtn.textContent = "Add Product";
      submitBtn.classList.remove("update-btn");
      document.getElementById("cancelEditBtn").classList.add("hidden");
      formTitle.textContent = "Product Management";

      alert("Product updated successfully!");
    } else {
      // Add new product
      const newProduct = await apiService.addProduct({ name, price });
      // Add the new product to the list
      addProductToList(newProduct);
      alert("Product added successfully!");
    }

    // Reset form and UI
    event.target.reset();

    // Update product select and stats
    await Promise.all([updateProductSelect(), updateStats()]);
  } catch (error) {
    console.error("Error:", error);
    alert(editId ? "Failed to update product" : "Failed to add product");
  }
}

// Add new function to update a single product in the list
function updateProductInList(product) {
  const productElement = document.querySelector(
    `[data-product-id="${product.id}"]`
  );
  if (productElement) {
    productElement.innerHTML = `
      <div class="info">
        <h4>${product.name}</h4>
        <p>Price: $${product.price}</p>
      </div>
      <div class="actions">
        <button onclick="editProduct(${product.id})" class="edit-btn">Edit</button>
        <button onclick="deleteProduct(${product.id})" class="delete-btn">Delete</button>
      </div>
    `;
  }
}

// Add new function to add a single product to the list
function addProductToList(product) {
  const container = document.getElementById("productsContainer");
  const productElement = document.createElement("div");
  productElement.className = "data-card";
  productElement.setAttribute("data-product-id", product.id);
  productElement.innerHTML = `
    <div class="info">
      <h4>${product.name}</h4>
      <p>Price: $${product.price}</p>
    </div>
    <div class="actions">
      <button onclick="editProduct(${product.id})" class="edit-btn">Edit</button>
      <button onclick="deleteProduct(${product.id})" class="delete-btn">Delete</button>
    </div>
  `;
  container.appendChild(productElement);
}

// Update the updateProductList function to add data-product-id
async function updateProductList() {
  try {
    const products = await apiService.getProducts();
    const container = document.getElementById("productsContainer");
    container.innerHTML = products
      .map(
        (prod) => `
          <div class="data-card" data-product-id="${prod.id}">
            <div class="info">
              <h4>${prod.name}</h4>
              <p>Price: $${prod.price}</p>
            </div>
            <div class="actions">
              <button onclick="editProduct(${prod.id})" class="edit-btn">Edit</button>
              <button onclick="deleteProduct(${prod.id})" class="delete-btn">Delete</button>
            </div>
          </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to load products");
  }
}

// Cart management
let cart = [];

async function addToCart() {
  try {
    const select = document.getElementById("productSelect");
    const quantity = parseInt(document.getElementById("quantity").value);
    const products = await apiService.getProducts();
    const product = products.find(
      (p) => p.id.toString() === select.value.toString()
    );

    if (product) {
      cart.push({
        ...product,
        quantity,
        total: product.price * quantity,
      });
      updateCart();
    } else {
      throw new Error("Product not found");
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    alert("Failed to add product to cart");
  }
}

function updateCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <li>${item.name} x ${item.quantity} = $${item.total}</li>
    `
    )
    .join("");

  cartTotal.textContent = cart.reduce((sum, item) => sum + item.total, 0);
}

// Bill generation
async function createOrder(event) {
  event.preventDefault();
  if (cart.length === 0) {
    alert("Please add items to cart first!");
    return;
  }

  try {
    const bill = {
      customerName: document.getElementById("customerName").value,
      phoneNumber: document.getElementById("phoneNumber").value,
      items: [...cart],
      total: cart.reduce((sum, item) => sum + item.total, 0),
      date: new Date().toLocaleString(),
    };

    const newBill = await apiService.createBill(bill);
    await updateStats();
    showCurrentBill(newBill);
    cart = [];
    event.target.reset();
    updateCart();
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to create bill");
  }
}

// New function to show current bill
function showCurrentBill(bill) {
  hideAllSections();
  const billsContainer = document.getElementById("billsContainer");
  document.getElementById("billsList").classList.remove("hidden");

  billsContainer.innerHTML = `
    <div class="current-bill">
      <h2>Bill Generated Successfully</h2>
      <div class="bill-card">
        <h3>Bill #${bill.id}</h3>
        <p>Customer: ${bill.customerName}</p>
        <p>Phone: ${bill.phoneNumber}</p>
        <p>Date: ${bill.date}</p>
        <h4>Items:</h4>
        <ul>
          ${bill.items
            .map(
              (item) => `
            <li>${item.name} x ${item.quantity} = $${item.total}</li>
          `
            )
            .join("")}
        </ul>
        <p class="bill-total">Total Amount: $${bill.total}</p>
      </div>
      <button onclick="showOrderForm()" class="new-order-btn">Create New Order</button>
    </div>
  `;
}

// UI updates
async function updateStats() {
  try {
    const [products, bills] = await Promise.all([
      apiService.getProducts(),
      apiService.getBills(),
    ]);

    document.getElementById("totalProducts").textContent = products.length;
    document.getElementById("totalBills").textContent = bills.length;
    document.getElementById("totalRevenue").textContent = bills.reduce(
      (sum, bill) => sum + bill.total,
      0
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

async function updateProductSelect() {
  try {
    const products = await apiService.getProducts();
    const select = document.getElementById("productSelect");
    if (select) {
      select.innerHTML = products
        .map(
          (product) =>
            `<option value="${product.id}">${product.name} - $${product.price}</option>`
        )
        .join("");
    }
  } catch (error) {
    console.error("Error updating product select:", error);
    alert("Failed to load products");
  }
}

function showProductForm() {
  hideAllSections();
  document.getElementById("productForm").classList.remove("hidden");
  setActiveButton("ProductForm");
  document.getElementById("productForm").scrollIntoView();
}

async function showOrderForm() {
  try {
    hideAllSections();
    document.getElementById("orderForm").classList.remove("hidden");
    setActiveButton("OrderForm");
    await updateProductSelect();
    cart = [];
    updateCart();
    document.getElementById("orderForm").scrollIntoView();
  } catch (error) {
    console.error("Error showing order form:", error);
    alert("Failed to load order form");
  }
}

async function showBillsList() {
  try {
    hideAllSections();
    const billsContainer = document.getElementById("billsContainer");
    document.getElementById("billsList").classList.remove("hidden");
    setActiveButton("BillsList");

    const bills = await apiService.getBills();

    if (bills.length === 0) {
      billsContainer.innerHTML = `
        <div class="no-bills">
          <h3>No bills found</h3>
          <p>Start creating orders to generate bills</p>
        </div>
      `;
    } else {
      billsContainer.innerHTML = bills
        .map(
          (bill) => `
        <div class="bill-card">
          <h3>Bill #${bill.id}</h3>
          <p>Customer: ${bill.customerName}</p>
          <p>Phone: ${bill.phoneNumber}</p>
          <p>Date: ${bill.date}</p>
          <h4>Items:</h4>
          <ul>
            ${bill.items
              .map(
                (item) => `
              <li>${item.name} x ${item.quantity} = $${item.total}</li>
            `
              )
              .join("")}
          </ul>
          <p class="bill-total">Total Amount: $${bill.total}</p>
        </div>
      `
        )
        .join("");
    }

    document.getElementById("billsList").scrollIntoView();
  } catch (error) {
    console.error("Error loading bills:", error);
    alert("Failed to load bills");
  }
}

function hideAllSections() {
  const sections = document.querySelectorAll(".form-section");
  sections.forEach((section) => section.classList.add("hidden"));
  // Remove active class from all navigation buttons
  document.querySelectorAll(".nav-buttons button").forEach((btn) => {
    btn.classList.remove("active");
  });
}

function logout() {
  // Clear session storage
  sessionStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}

// Add these new functions for product management
async function editProduct(id) {
  try {
    const products = await apiService.getProducts();
    const product = products.find((p) => p.id.toString() === id.toString());
    if (product) {
      // Scroll to product form first
      document
        .getElementById("productForm")
        .scrollIntoView({ behavior: "smooth" });

      // Show the form section if hidden
      hideAllSections();
      document.getElementById("productForm").classList.remove("hidden");
      setActiveButton("ProductForm");

      // Set form values
      document.getElementById("productName").value = product.name;
      document.getElementById("productPrice").value = product.price;
      document.getElementById("editProductId").value = product.id;

      // Update button text and show cancel button
      const submitBtn = document.getElementById("productSubmitBtn");
      const cancelBtn = document.getElementById("cancelEditBtn");

      submitBtn.textContent = "Update Product";
      submitBtn.classList.add("update-btn");

      cancelBtn.classList.remove("hidden");
      cancelBtn.onclick = cancelEdit; // Ensure cancel button has correct handler

      // Change form title to indicate editing mode
      const formTitle = document.querySelector("#productForm h2");
      formTitle.textContent = `Edit Product: ${product.name}`;
    }
  } catch (error) {
    console.error("Error editing product:", error);
    alert("Failed to load product details");
  }
}

async function deleteProduct(id) {
  if (confirm("Are you sure you want to delete this product?")) {
    try {
      await apiService.deleteProduct(id);
      await updateProductList();
      await updateProductSelect();
      await updateStats();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  }
}

function cancelEdit() {
  // Get form elements
  const form = document.getElementById("productForm");
  const submitBtn = document.getElementById("productSubmitBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");
  const formTitle = document.querySelector("#productForm h2");
  const editIdInput = document.getElementById("editProductId");
  const nameInput = document.getElementById("productName");
  const priceInput = document.getElementById("productPrice");

  // Clear all input values
  nameInput.value = "";
  priceInput.value = "";
  editIdInput.value = "";

  // Reset button states
  submitBtn.textContent = "Add Product";
  submitBtn.classList.remove("update-btn");
  cancelBtn.classList.add("hidden");

  // Reset form title
  formTitle.textContent = "Product Management";

  // Prevent form submission
  return false;
}

// Add new function to reset product form
function resetProductForm() {
  const form = document.getElementById("productForm");
  const submitBtn = document.getElementById("productSubmitBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");
  const formTitle = document.querySelector("#productForm h2");

  // Reset form inputs
  form.reset();
  document.getElementById("editProductId").value = "";

  // Reset button states
  submitBtn.textContent = "Add Product";
  submitBtn.classList.remove("update-btn");
  submitBtn.style.display = "inline-block"; // Show Add Product button
  cancelBtn.classList.add("hidden");

  // Reset form title
  formTitle.textContent = "Product Management";
}

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";

  if (isIndexPage()) {
    if (!isLoggedIn) {
      window.location.href = "login.html";
      return;
    }
    try {
      await Promise.all([
        updateStats(),
        updateProductList(),
        updateProductSelect(),
      ]);
    } catch (error) {
      console.error("Error initializing app:", error);
      alert("Failed to load initial data");
    }
  } else {
    if (isLoggedIn) {
      window.location.href = "index.html";
    }
  }
});

function setActiveButton(buttonId) {
  // Remove active class from all buttons
  document.querySelectorAll(".nav-buttons button").forEach((btn) => {
    btn.classList.remove("active");
  });
  // Add active class to clicked button
  document
    .querySelector(`button[onclick="show${buttonId}()"]`)
    .classList.add("active");
}
