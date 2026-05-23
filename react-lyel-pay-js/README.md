# Getting Started with Lyel Pay Library

## Introduction

react-lyel-pay-js is a React library that allows you to integrate a Lyel Pay payment form from Lyel Pay into your application.

## Installation

`npm install react-lyel-pay-js`

`yarn add react-lyel-pay-js`

## Usage

```tsx
import React from 'react';
import { LyelPayElements } from 'react-lyel-pay-js';
import { loadLyelPay } from 'react-lyel-pay-js';

// loadLyelPay(apiKey, amount, clientSecret)
// apiKey: Your Lyel Pay API key
// amount: The amount to be paid
// clientSecret: Your Lyel Pay client secret
const LyelPayPromise = loadLyelPay('YOUR_API_KEY', 1000, 'YOUR_CLIENT_SECRET');

const App = () => {
  return (
    <div>
      <LyelPayElements options={LyelPayPromise} />
    </div>
  );
};
```

### API
react-lyel-pay-js provides the following API:

* `loadLyelPay`: A function that takes three arguments: apiKey, amount, and clientSecret. It returns a promise that resolves to an object containing the apiKey, initializationDate, amount, and clientSecret.
* `LyelPayElements`: The main component that renders the Lyel Pay payment form.
* `apiKey`: The API key to use for the Lyel Pay payment form.
* `amount`: The amount to be paid.
* `clientSecret`: The client secret to use for the Lyel Pay payment form.
* `onPaymentInitiate`: A callback function that is called when the payment is initiated.
