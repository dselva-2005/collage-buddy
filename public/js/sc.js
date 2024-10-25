let cartCount = 0;

let searchForm = document.querySelector('.search-form');
const cart = document.getElementById('cart');

let products_quantity = {};

// Load cart from local storage when the page is loaded
window.onload = () => {
  const storedCart = JSON.parse(localStorage.getItem('cart')) || {};
  products_quantity = storedCart;
  cartCount = parseInt(localStorage.getItem('cartCount')) || 0; // Load cartCount from localStorage

  for (const [productId, quantity] of Object.entries(products_quantity)) {
    // Mocked product data; replace this with your actual product data retrieval
    const productDetails = {
      name: document.getElementById(`${productId}`).querySelector('h1').innerHTML, // Replace with actual product name
      price: document.getElementById(`${productId}`).querySelector('div').innerHTML.replace("₹",''), // Replace with actual price
      image: document.getElementById(`${productId}`).querySelector('img').src, // Replace with actual image path
    };

    addProductToCartDisplay(productId, quantity, productDetails);
  }

  updateCartCount(); // Update the displayed cart count
};

document.querySelector('#search-btn').onclick = () => {
  searchForm.classList.toggle('active');
};

let shoppingCart = document.querySelector('.shopping-cart');

document.querySelector('#cart-btn').onclick = () => {
  shoppingCart.classList.toggle('active');
};

let loginForm = document.querySelector('.login-form');

document.querySelector('#login-btn').onclick = () => {
  loginForm.classList.toggle('active');
};

var swiper = new Swiper(".product-slider", {
  loop: true,
  spaceBetween: 20,
  autoplay: {
    delay: 7500,
    disableOnInteraction: false,
  },
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1020: {
      slidesPerView: 3,
    },
  },
});

function addTocart(event) {
  const target_product = event.target.parentNode;
  const productId = target_product.id;

  if (productId in products_quantity) {
    products_quantity[productId] += 1;
  } else {
    products_quantity[productId] = 1;
  }

  // Save to local storage
  localStorage.setItem('cart', JSON.stringify(products_quantity));

  // Update cartCount and save to local storage
  cartCount++;
  localStorage.setItem('cartCount', cartCount);

  // Mocked product data; replace this with your actual product data retrieval
  const productDetails = {
    name: target_product.querySelector('h1').innerText, // Product name
    price: target_product.querySelector('.price').innerText.replace('₹', '').replace('/-', ''), // Product price
    image: target_product.querySelector('img').getAttribute('src'), // Product image URL
  };

  addProductToCartDisplay(productId, products_quantity[productId], productDetails);
}

function addProductToCartDisplay(productId, quantity, productDetails) {
  let productElement = document.getElementById(`cart${productId}`);
  if (productElement) {
    // Update existing product
    productElement.querySelector('.quantity').innerText = quantity;
  } else {
    // Create new product element
    productElement = document.createElement('div');
    productElement.classList.add('box');
    productElement.classList.add('cartbox');
    productElement.id = `cart${productId}`;
    productElement.innerHTML = `
      <img src="${productDetails.image}">
      <div class="content">
        <h3>${productDetails.name}</h3>
        <span class="price">₹${productDetails.price}/-</span>
        <p class="label">Qty: <span class="quantity">${quantity}</span></p>
        <button class="qty-btn" onclick="changeQuantity('${productId}', 1)">+</button>
        <button class="qty-btn" onclick="changeQuantity('${productId}', -1)">-</button>
      </div>
      <i class="fa fa-trash" onclick="delete_ele(event)"></i>
    `;
    cart.appendChild(productElement);
  }

  updateCartCount();
}

function changeQuantity(productId, change) {
  const newQuantity = products_quantity[productId] + change;

  if (newQuantity <= 0) {
    delete products_quantity[productId];
    cartCount--;
  } else {
    products_quantity[productId] = newQuantity;
    cartCount += change;
  }

  // Save updated cart and cartCount to local storage
  localStorage.setItem('cart', JSON.stringify(products_quantity));
  localStorage.setItem('cartCount', cartCount);

  const productElement = document.getElementById(`cart${productId}`);
  if (productElement) {
    productElement.querySelector('.quantity').innerText = products_quantity[productId] || 0;
  }

  updateCartCount();
  if (newQuantity <= 0) {
    productElement.remove(); // Remove product from cart display if quantity is 0
  }
}

function delete_ele(event) {
  const productId = event.target.parentNode.id.replace('cart', '');
  const quantity = products_quantity[productId]; // Get the quantity of the product being deleted
  
  cartCount -= quantity; // Decrease cartCount by the total quantity of the item
  delete products_quantity[productId]; // Remove the product from products_quantity

  // Save updated cart and cartCount to local storage
  localStorage.setItem('cart', JSON.stringify(products_quantity));
  localStorage.setItem('cartCount', cartCount);

  event.target.parentNode.remove(); // Remove the product element from the display
  updateCartCount(); // Update the cart count display
}


// Function to handle checkout
function checkout() {
   // Collect all cart items
   let cartItems = [];
   const boxes = document.querySelectorAll('.cartbox'); // Select all cart items (divs with class 'box')
   if(boxes.length != 0){
    boxes.forEach(box => {
      let itemId = box.id.replace('cart', ''); // Extract the unique ID
      let itemName = box.querySelector('h3').textContent;
      let itemPrice = box.querySelector('.price').textContent.replace('₹', '').replace('/-', ''); // Remove currency symbols
      let itemQuantity = box.querySelector('.quantity').textContent ;
  
      // Push the item into the array as an object
      cartItems.push({
          id: itemId,
          name: itemName,
          price: parseFloat(itemPrice),
          quantity: parseInt(itemQuantity)
      });
  });
   }
   else{
    alert("cart is empty")
    return
   }
 
  //  Convert cart items to JSON
   const cartData = JSON.stringify(cartItems);
   // Send the cart data to the backend using Fetch API
   fetch('/checkout', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json'
       },
       body: cartData
   })
   .then(response => response.json())
   .then(data => {
    console.log(data)
       if (data.success) {
        const { orderId } = data; // Assuming the response sends back orderId
        // Redirect to the bill page
        clearCart();
        window.location.href = `/order/${orderId}`;
           // Redirect or perform any action after checkout
       } else {
           alert('Checkout failed. Please try again.');
       }
   })
   .catch(error => {
       console.error('Error:', error);
   });
}

// Attach the checkout function to the button
document.querySelector('#checkout-btn').onclick = (event) => {
  event.preventDefault(); // Prevent default anchor link behavior
  checkout();
};

// Example of how to call addTocart on a product button click
document.querySelectorAll('.add-to-cart').forEach(button => {
  button.onclick = addTocart;
});

function updateCartCount() {
  const cartCountElement = document.getElementById('cart-count');

  // Show the cart count and red dot only if there are items in the cart
  if (cartCount > 0) {
    cartCountElement.style.display = 'inline-block';
    cartCountElement.textContent = cartCount;
  } else {
    cartCountElement.style.display = 'none';
  }
}

function specific_page(event) {
  window.location.href = `http://localhost:3000/products/${event.target.parentNode.id}`;
}

function clearCart() {
  // Clear the products_quantity object and reset cartCount
  products_quantity = {};
  cartCount = 0;

  // Remove cart items from local storage
  localStorage.removeItem('cart');
  localStorage.removeItem('cartCount');

  // Remove all cart items from the display
  while (cart.firstChild) {
    cart.removeChild(cart.firstChild);
  }

  // Update the cart count display
  updateCartCount();
}

// Attach the clearCart function to a button, for example
document.querySelector('#clear-cart-btn').onclick = clearCart;
