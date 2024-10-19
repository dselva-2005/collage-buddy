let searchForm = document.querySelector('.search-form');
const cart = document.getElementById('cart')

let products_quantity = {

}

document.querySelector('#search-btn').onclick = () => {
  searchForm.classList.toggle('active');
}

let shoppingCart = document.querySelector('.shopping-cart');

document.querySelector('#cart-btn').onclick = () => {
  shoppingCart.classList.toggle('active');
}

let loginForm = document.querySelector('.login-form');

document.querySelector('#login-btn').onclick = () => {
  loginForm.classList.toggle('active');
}

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

function addTocart(event){
  const target_product = event.target.parentNode
  if (target_product.id in products_quantity) {
    products_quantity[target_product.id] += 1;
    document.getElementById(`cart${target_product.id}`).querySelector('p').innerHTML = `Qty ${products_quantity[target_product.id]}`;
    return
} else {
  products_quantity[target_product.id] = 1;
}
  const product = document.createElement('div')
  product.classList.add('box')
  product.id = `cart${target_product.id}`
  product.innerHTML = `
  <img src="/${target_product.querySelector('img').getAttribute('src')}">
  <div class="content">
  <h3>Notebooks</h3>
  <span class="price">${target_product.querySelector('div').innerHTML}/-</span>
  <p class="label">Qty : ${products_quantity[target_product.id]}</p>
  </div>
  <i class="fa fa-trash" onclick="delete_ele(event)"></i>
`
    cart.appendChild(product)
    console.log(target_product.id)
}

function delete_ele(event){
  console.log(event.target.parentNode.id)
  delete products_quantity[`${event.target.parentNode.id}`.replace('cart','')]
  event.target.parentNode.remove()
}


// Function to handle checkout
function checkout() {
  if (Object.keys(products_quantity).length === 0) {
      alert("Your cart is empty!");
      return;
  }

  // Calculate total price
  let totalPrice = 0;
  for (const [productId, quantity] of Object.entries(products_quantity)) {
      const productPrice = parseFloat(document.getElementById(`cart${productId}`).querySelector('.price').innerText.replace('₹', '').replace('/-', ''));
      totalPrice += productPrice * quantity;
  }

  // Display the total price
  alert(`Your total is ₹${totalPrice}/-`);

  // Redirect to the checkout page (uncomment and set the URL for your checkout page)
  // window.location.href = '/checkout';
}

// Attach the checkout function to the button
document.querySelector('#checkout-btn').onclick = (event) => {
  event.preventDefault(); // Prevent default anchor link behavior
  checkout();
};

// Example of how to call addTocart on a product button click
// Assuming you have a button with the class 'add-to-cart' in your product items
document.querySelectorAll('.add-to-cart').forEach(button => {
  button.onclick = addTocart;
});