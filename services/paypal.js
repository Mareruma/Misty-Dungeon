const axios = require('axios');

async function generateAccessToken() {
  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + '/v1/oauth2/token',
    method: 'post',
    data: 'grant_type=client_credentials',
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_SECRET,
    },
  });

  return response.data.access_token;
}

exports.createOrder = async (cart) => {
  const accessToken = await generateAccessToken();

  const items = cart.map((p) => ({
    name: p.name,
    quantity: 1,
    unit_amount: {
      currency_code: 'EUR',
      value: p.price.toFixed(2),
    },
  }));

  const total = cart.reduce((sum, p) => sum + p.price, 0).toFixed(2);

  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + '/v2/checkout/orders',
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken,
    },
    data: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          items,
          amount: {
            currency_code: 'EUR',
            value: total,
            breakdown: {
              item_total: {
                currency_code: 'EUR',
                value: total,
              },
            },
          },
        },
      ],
      application_context: {
        return_url: process.env.BASE_URL + '/complete-order',
        cancel_url: process.env.BASE_URL + '/cancel-order',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        brand_name: 'Misty Dungeon',
      },
    },
  });

  return response.data.links.find((link) => link.rel === 'approve').href;
};

exports.capturePayment = async (orderId) => {
  const accessToken = await generateAccessToken();

  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + `/v2/checkout/orders/${orderId}/capture`,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken,
    },
  });

  return response.data;
};
