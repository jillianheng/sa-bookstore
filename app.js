const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
require('dotenv').config();
var app = express();

// Retrieve API Keys from .env file and load Stripe
const config = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  endpointSecret: process.env.STRIPE_WEBHOOK_SECRET
}
const stripe = require("stripe")(config.secretKey);

/**
 * Set up endpoint to subscribe to Stripe webhook events.
 */
app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  let event = request.body;
  // Check that signature for webhook matches
  if (config.endpointSecret) {
    const signature = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(request.body, signature, config.endpointSecret);
    }
    catch (err) {
      console.log(err);
      return response.sendStatus(400);
    }
  }

  // Handle events
  switch (event.type) {
      case 'payment_intent.succeeded':
        // Additional logic can be implemented here:
        // eg. Inventory management, shipping request, email receipts
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent for ${paymentIntent.currency} ${paymentIntent.amount/100} was successful!`);
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.send();
});

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))
app.use(express.json({}));

/**
 * Home route
 */
app.get('/', function(req, res) {
  res.render('index');
});

/**
 * Checkout route
 */
app.get('/checkout', function(req, res) {
  // Just hardcoding amounts here to avoid using a database
  const item = req.query.item;
  let title, amount, error;

  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering"
      amount = 2300      
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993"
      amount = 2500
      break;     
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source"
      amount = 2800  
      break;     
    default:
      // Included in layout view, feel free to assign error
      error = "No item selected"      
      break;
  }

  res.render('checkout', {
    title: title,
    amount: amount,
    error: error
  });
});

/**
 * Create checkout session route
 * req body: { title : title, amount : amount (in dollars), shippingOptions : bool }
 */
app.post("/create-checkout-session", async (req, res) => {

  var shippingOptions;
  if (req.body.shippingOptions) {
    shippingOptions = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: 500,
            currency: 'usd',
          },
          display_name: 'Standard shipping',
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: 5,
            },
            maximum: {
              unit: 'business_day',
              value: 7,
            },
          },
        },
      }
    ]
  };
  var session = await stripe.checkout.sessions.create({
    ui_mode: "elements",
    line_items: [
      {
        price_data: {
          currency: "usd", // Hardcoded for now
          unit_amount: req.body.amount * 100, // Convert back to cents
          product_data: {
            name: req.body.title
          }
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    return_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
    shipping_options: shippingOptions
  });

  res.send({ clientSecret: session.client_secret });
});

/**
 * Get checkout session route
 */
app.get("/session-status", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id, { expand: ["payment_intent"] });
  res.send({
    status: session.status,
    payment_status: session.payment_status,
    payment_intent: session.payment_intent
  });
});

/**
 * Create payment intent route
 * req body: { amount : amount (in dollars) }
 */
app.post("/create-payment-intent", async (req, res) => {
  // Create a PaymentIntent with the order amount
  const paymentIntent = await stripe.paymentIntents.create({
    amount: req.body.amount * 100, // Convert back to cents
    currency: "usd", // Hardcoded for now
    automatic_payment_methods: { // Default to show all available payment methods
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret
  });
});

/**
 * Helper route to return publishable key for UI
 */
app.get('/get-publishable-key', function(req, res) {
  res.send({
    publishableKey: config.publishableKey
  });
});

/**
 * Success route
 */
app.get('/success', function(req, res) {
  res.render('success');
});

/**
 * Start server
 */
app.listen(3000, () => {
  console.log('Getting served on port 3000');
});
