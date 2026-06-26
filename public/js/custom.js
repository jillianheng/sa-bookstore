/**
 * Clientside helper functions
 */
$(document).ready(function() {
  // DEFINE JS LOGIC BASED ON PATH
  var pathName = window.location.pathname;
  switch (pathName) {
    case ("/checkout"):
      startCheckoutFlow();
      break;
    case ("/success"):
      startConfirmationFlow();
      break;
    default:
      break;
  }
})

// Initialize stripe using Publishable Key
async function initializeStripe() {
  const response = await fetch("/get-publishable-key");
  const { publishableKey } = await response.json();
  return Stripe(publishableKey);
}

// --- CONFIRMATION FLOW INCLUDES RETRIEVING INTENT DETAILS AND DISPLAYING PAYMENT ---
function startConfirmationFlow() {
  initializeStripe().then(stripe => {
    // Retrieve URL query params included by Stripe during redirect
    // http://localhost:3000/success?payment_intent=pi_xxx&payment_intent_client_secret=pi_xxx_secret_yyy&redirect_status=succeeded
    const paymentIntentSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
    
    // Get payment intent details
    stripe.retrievePaymentIntent(paymentIntentSecret).then(res => {
      // Handle Payment intent details
      if (res.paymentIntent) {
        displayPaymentDetails(res.paymentIntent);
      }
      else if (res.error) {
        displayError(res.error)
      }
    });
  })
}

// --- CHECKOUT FLOW INCLUDES CONVERTING AMOUNT, DISPLAYING ELEMENT AND COMPLETING PAYMENT ---
function startCheckoutFlow() {
  var amounts = document.getElementsByClassName("amount");

  // iterate through all "amount" elements and convert from cents to dollars
  let amount;
  for (var i = 0; i < amounts.length; i++) {
    amount = amounts[i].getAttribute('data-amount') / 100;  
    amounts[i].innerHTML = amount.toFixed(2);
  }

  // Initialize payment with item details
  if (amount && amount != 0) {
    initializePayment(amount)
  }
}

// Initialize payment and display element
async function initializePayment(amount) {
  // Create a payment intent
  const response = await fetch("/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount })
  });
  const { clientSecret } = await response.json();

  // Create Stripe Payment Element
  initializeStripe().then(stripe => {
    const appearance = {
      theme: 'stripe',
    };
    const options = { mode: 'shipping' };
    const elements = stripe.elements({ appearance, clientSecret });
    const paymentElementOptions = {
        layout: "accordion",
    };

    const paymentElement = elements.create("payment", paymentElementOptions);
    const addressElement = elements.create("address", options);
    paymentElement.mount("#payment-element");
    addressElement.mount("#address-element");

    // Add event handler to payment submission
    document.querySelector("#payment-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      setLoading(true);
      // Confirm payment using stripe
      stripe.confirmPayment({
        elements,
        confirmParams: {
          // Make sure to change this to your payment completion page
          return_url: "http://localhost:3000/success",
          receipt_email: document.getElementById("email").value // Optional to trigger Stripe email in Live mode
        },
      }).then(error => {
        // Error handling
        if (error.type == "card_error" || error.type == "validation_error") {
          showMessage(error.message);
        } else {
          showMessage("An unexpected error occurred.");
        }
        setLoading(false);
      });
    })
  });
}

// ------- UI helpers for Confirmation flow ------
// Display Payment Intent ID and amount
function displayPaymentDetails(paymentIntent) {
    const paymentDetails = document.querySelector("#payment-details");
  if (paymentIntent.status == "succeeded") {
    document.querySelector("#error").hidden = true;
    var amountString = paymentIntent.currency.toUpperCase() + " " + paymentIntent.amount/100;
    paymentDetails.innerHTML = "Thank you for your purchase. Your order for has been completed. <br> A receipt has also been sent to " + 
    paymentIntent.receipt_email +
    "<br><br><b>Order ID</b>: " + paymentIntent.id +
    "<br><b>Amount</b>: " + amountString
  }
  else {
    document.querySelector("#error").hidden = false;
    document.querySelector("#success").hidden = true;
    paymentDetails.innerHTML = "Order ID: " + paymentIntent.id + " has failed. Please try again.";
  }
}

// Handle UI error
function displayError(error) {
  const paymentDetails = document.querySelector("#payment-details");
  paymentDetails.innerHTML = "Unable to retrieve intent." + error.toString();
}

// ------- UI helpers for Checkout flow -------
// From Stripe documents

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.hidden = false;
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.hidden = true;
    messageContainer.textContent = "";
  }, 4000);
}

// Show a spinner on payment submission
function setLoading(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").hidden = false;
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").hidden = true;
  }
}