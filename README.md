## Application overview
The purpose of this demo is to demonstrate the Stripe checkout flow using the [Stripe Payment Element](https://docs.stripe.com/js/element/payment_element).
This demo also sets up a local endpoint to receive webhook events. 
For more technical details on this demo, please refer to [doc.md](doc.md)

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
2. Redirect to Checkout Page with Stripe Payment Element. Stripe Payment Element is compatible with both [Payment Intents API](https://docs.stripe.com/api/payment_intents) and [Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions) *(recommended)*.
| | Payment Intents API | Checkout Sessions API |
| -------- | -------- | -------- |
| Checkout Flow | Fully custom with low level API | Out of the Box Stripe Capabilities |
| [Multi Step Checkout Flow](https://docs.stripe.com/payments/build-a-two-step-confirmation) | Yes | No |
| Integration Effort | Higher maintenance and development effort | Lower effort |

For more details between the two APIs, refer to Stripe documentation [here](https://docs.stripe.com/payments/checkout-sessions-and-payment-intents-comparison).

Both APIs have been integrated in this demo for reference. 
- Select Item 1 *(The Art of Doing Science and Engineering)* for Checkout Sessions API
- Select Item 2 *(The Making of Prince of Persia: Journals 1985-1993)* for enhanced capabilties with Checkout Sessions API. This includes Adaptive Pricing, Shipping Charges
- Select Item 3 *(Working in Public: The Making and Maintenance of Open Source)* for Payment Intent API

3. Complete Payment on the checkout page. By default, all available payment methods are enabled, including Stripe Link.
-  For Card Payments, use Stripe's [Test Cards](https://docs.stripe.com/testing)
    - Sample Card Number: `4242 4242 4242 4242`, with any future dated expiry and 3 digit CVV
- For Link Payments, select `Secure, fast checkout with Link` and input an email address. Reuse this email address for subsequent checkouts to see saved payment methods.
4. Redirect to confirmation page and receive corresponding `payment_intent.succeeded` webhook event

## References
- [Original GitHub Project](https://github.com/mattmitchell6/sa-takehome-project-node)
- [Stripe JS docs](https://docs.stripe.com/js)
- [Stripe npm Package](https://github.com/stripe/stripe-js)
- [Stripe Payment Elements](https://docs.stripe.com/payments/elements) and [Demo](https://checkout.stripe.dev/elements)
- [Stripe API docs](https://docs.stripe.com/api)
- [Stripe Webhook docs](https://docs.stripe.com/webhooks)
