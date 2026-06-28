# Demo Solution
This demo is a simple e-commerce bookstore that allows the user to:
1. Select a book to purchase
2. Checkout and purchase the item using Stripe Elements
3. Display a confirmation of purchase with the total amount of the charge and Stripe Payment Intent ID
4. On the merchant backend, a successful payment event is triggered to the webhook endpoint

## Assumption
- Key focus is on Stripe Payment Element and API. Existing code structure remains unchanged from the starter project provided
- Books sold are hardcopy, thus requiring a Shipping Address in the checkout flow
- Only Guest User checkout is supported
- All enabled payment methods, including Link, are supported in the checkout flow
- This demo focuses mainly on Happy Path and successful payment completion. Error messages are displayed in the UI but should be handled more elegantly in live testing.

## Solution Architecture and Code Structure
All customer facing front-end code is reflected in 
- [`index.hbs`](/views/index.hbs): Displaying books available for purchase
- [`checkout.hbs`](/views/checkout.hbs): Displaying Stripe Elements and for payment completion. This includes Contact Detail element, Shipping Address element and Payment element for ease of data collection.
- [`success.hbs`](/views/success.hbs): Confirmation page displaying Payment Intent ID and amount

The back-end uses Javascript, mainly in
- [`app.js`](app.js): Powering all endpoints in `http://localhost:3000` and making the relevant Stripe API calls (using Stripe's npm package)
- [`custom.js`](/public/js/custom.js): Powering all front-end Javascript, including Stripe Elements SDK and interactions with the back-end server

For completeness, this demo uses two different APIs (Payment Intent API and Checkout Sessions API) that are compatible with the Stripe Payment Element. Both sets of APIs result in payment completion and the creation of a successful payment intents using the information provided. 

### 1. Payment Intent API
This is a lower level API that allows merchant to control the entire checkout flow and logic. This API only covers the payment flow. Any additional features such as tax calculation, discounts must be handled by the merchant. While this gives the merchant full control and flexbility, there is significantly more development effort and maintenance required.

Checkout Flow and API calls:
1. User selects a book and is redirected to the checkout page
2. `Create Payment Intent` API is called to create a new Payment Intent with a specific amount and currency and returns the Payment Intent Client Secret
3. Stripe Elements are loaded with the specific Payment Intent Client Secret
4. User completes payment form and `Confirm Payment Intent` API is called with the Elements UI
5. With the completion of payment, the Payment Intent status is updated automatically to `succeeded` and a corresponding event is triggered to the webhook endpoint.
6. User is redirected to the confirmation page which calls the `Retrieve Payment Intent` method with the Payment Intent Client Secret in the URL query param.

### 2. Checkout Sessions API
This is the recommended API by Stripe. Checkout Sessions cover similar use case as Payment Intents, but also supported a suite of Stripe features. This includes automated tax calculation, adaptive pricing for payment in shopper's local currency and many more.

Checkout Flow and API calls:
1. User selects a book and is redirected to the checkout page
2. `Create Checkout Session` API is called to create a new checkout session with the relevant payload (including the amount and currency) and returns the Checkout Session Client Secret
3. Stripe Elements are loaded with the specific Checkout Session Client Secret
4. User completes payment form and `Confirm Checkout Session`
5. With the completion of payment, the Payment Intent status is updated automatically to `succeeded` and a corresponding event is triggered to the webhook endpoint.
6. User is redirected to the confirmation page which calls the `Retrieve Checkout Session` API with the Checkout Session ID in the URL query param.

## Solution Approach
1. Review requirements and Stripe Payment Element documents
2. Clone and run starter project and review the files requiring changes
3. Integrate bare minimum happy path with Payment Intent API (most straightforward)
4. Set up a sample webhook endpoint using Stripe CLI to receive events
5. Integrate bare minimum happy path with Checkout Session API
6. Integrate additional features (this includes adaptive pricing and basic shipping options) to showcase Stripe's potential

References include all relevant Stripe documentation (including JS, API, Node, webhook docs).
Some challenges faced:
- Getting used to Stripe's JS methods (instead of direct API calls). Referenced Stripe docs and quickstart guides
- Stripe webhook signature not matching despite following the sample code. Referenced Stack Overflow and found out this is due to using `app.use(express.json({}));` -- which highlights the need for microservice set up

## Future Enhancements 
- Clear technical debt resulting from retaining existing structure
    - Readability can certainly be improved by splitting up [`custom.js`](/public/js/custom.js) into multiple JS files for each feature (ie. `checkout.js` and `success.js`)
    - Code refactoring following modern microservices infrastructure for scalability
    - Proper segregation of Payment Intent API flow and Checkout Session API flow
- Include Registered User Checkout flow with [Customer API](https://docs.stripe.com/api/customers) - This will also allow customers to reuse saved payment methods (outside of Link), see order history and update customer information
- Include 'Cart' functionality to allow multiple items to be added (thus also supporting Stripe dynamic inventory and line item updates)
- Proper webhook event handling - such as inventory management and automating delivery/order tracking
- Integrating with additional Stripe features for a full e-commerce checkout experience - *Focusing only on Checkout Session API flow*
    - Stripe built-in order summary and receipt functionality for successful payments
    - Stripe Tax for tax collection requirement in certain countries
    - Stripe Discount, coupon and promotion code
    - Setting up Stripe Catalog, Product/Prices