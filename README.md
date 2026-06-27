## Application overview
The purpose of this demo is to demonstrate the Stripe checkout flow using the [Stripe Payment Element](https://docs.stripe.com/js/element/payment_element).
This demo also sets up a local endpoint to receive webhook events. 

## Prerequisites
This demo is written in Javascript (Node.js) with the [Express framework](https://expressjs.com/).

- [node.js](https://nodejs.org/en)
- `npm` package manager
- Test Stripe account Test Mode API keys. Register for free [here](https://dashboard.stripe.com/register).
- (For Webhook) Set up [Stripe CLI](https://docs.stripe.com/stripe-cli/install)

## Getting Started
### Configuration
Before getting started, rename `sample.env` to `.env` and populate with your Stripe account's test API keys.

The Secret key and Publishable key can be found on the Stripe Dashboard > Developers > API Keys and should begin with `sk_test` and `pk_test` respectively.

Use the following commands in a new Terminal to enable the local endpoint to receive webhook events:
```
stripe listen --events payment_intent.succeeded --forward-to localhost:3000/webhook
```
The webhook signing secret will be returned. Include this in the `.env` file as `STRIPE_WEBHOOK_SECRET`

### Installation
1. Clone the repository to your local machine
```
git clone https://github.com/jillianheng/sa-bookstore
```
2. Navigate into the directory with `cd sa-bookstore`
3. Install the package with `npm install`
4. Run the application locally with `npm start`
5. Navigate to [http://localhost:3000](http://localhost:3000) to view the application

## Usage
1. Select item to purchase
2. Redirect to Checkout Page with Stripe Payment Element. By default, all available payment methods are enabled, including Stripe Link.
-  For Card Payments, use Stripe's [Test Cards](https://docs.stripe.com/testing)
    - Sample Card Number: `4242 4242 4242 4242`, with any future dated expiry and 3 digit CVV'
- For Link Payments, select `Secure, fast checkout with Link` and input an email address. Reuse this email address for subsequent checkouts to see saved payment methods.
3. Redirect to confirmation page and receive corresponding `payment_intent.succeeded` webhook event

### References
- [Original GitHub Project](https://github.com/mattmitchell6/sa-takehome-project-node)
- [Stripe JS docs](https://docs.stripe.com/js)
- [Stripe npm Package](https://github.com/stripe/stripe-js)
- [Stripe Payment Elements](https://docs.stripe.com/payments/elements) and [Demo](https://checkout.stripe.dev/elements)
- [Stripe API docs](https://docs.stripe.com/api)
- [Stripe Webhook docs](https://docs.stripe.com/webhooks)