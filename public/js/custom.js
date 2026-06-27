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
  // Retrieve URL query params included by Stripe during redirect
  // IF Payment Intent API: http://localhost:3000/success?payment_intent=pi_xxx&payment_intent_client_secret=pi_xxx_secret_yyy&redirect_status=succeeded
  // IF Checkout Session API: http://localhost:3000/success?session_id=cs_test_xxx
  const paymentIntentSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
  const checkoutSessionId = new URLSearchParams(window.location.search).get("session_id");
  
  // Retrieve checkout session details
  if (checkoutSessionId) {
    fetch(`/session-status?session_id=${checkoutSessionId}`).then(res => {
      sessionDetails = res.json().then(sessionDetails => {
        displayPaymentDetails(sessionDetails.payment_intent)
      });
    });
  }

  // Retrieve payment intent details
  if (paymentIntentSecret) {
    initializeStripe().then(stripe => { 
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
    const title = document.querySelector("#title").innerText;
    // Use different checkout flow based on item number
    const itemNumber = new URLSearchParams(window.location.search).get("item");
    switch (itemNumber) {
      case '1':
        initializeSession(title, amount);
        break;
      case '2':
        break;
      case '3':
        initializePayment(amount)
        break;
      default:
        alert("Invalid item number. Redirecting back to home page.");
        window.location.href = "/";
    }
  }
}

// Initialize session and display element
async function initializeSession(title, amount) {
  // Create a session
  const response = await fetch("/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title, amount: amount })
  });
  const { clientSecret } = await response.json(); 
  initializeStripe().then(async stripe => {
    const appearance = {
      theme: 'stripe',
    };
    checkout = stripe.initCheckoutElementsSdk({
      clientSecret: clientSecret,
      elementsOptions: { appearance },
    });

    checkout.on('change', (session) => {
      // Handle changes to the checkout session
      document.getElementById('submit').disabled = !session.canConfirm;
    });

    const loadActionsResult = await checkout.loadActions();
    if (loadActionsResult.type === 'success') {
      actions = loadActionsResult.actions;
      const session = loadActionsResult.actions.getSession();
      document.querySelector("#button-text").textContent = `Pay ${session.total.total.amount}`;
    }

    const contactDetailsElement = checkout.createContactDetailsElement();
    contactDetailsElement.mount("#contact-details-element");
    const paymentElement = checkout.createPaymentElement();
    paymentElement.mount("#payment-element");
    const addressElement = checkout.createShippingAddressElement();
    addressElement.mount("#address-element");

    // Add event handler to payment submission
    document.querySelector("#payment-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      setLoading(true);

      const { error } = await actions.confirm();
      showMessage(error.message);
      setLoading(false);
    })
  })
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

    const contactDetailElement = elements.create("contactDetails");
    contactDetailElement.mount('#contact-details-element');
    const paymentElement = elements.create("payment", paymentElementOptions);
    paymentElement.mount("#payment-element");
    const addressElement = elements.create("address", options);
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
    paymentDetails.innerHTML = `Thank you for your purchase. Your order has been completed. <br><br><b>Order ID</b>: ${paymentIntent.id} <br><b>Amount</b>: ${amountString}`
  }
  else {
    document.querySelector("#error").hidden = false;
    document.querySelector("#success").hidden = true;
    paymentDetails.innerHTML = `Order ID: ${paymentIntent.id} has failed. Please try again.`;
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
  messageContainer.hidden = false;
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