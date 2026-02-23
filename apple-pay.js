  const handlePayment = () => {

    const paymentRequest = {
            countryCode: 'EG',
            currencyCode: 'EGP',
            supportedNetworks: ["visa", "masterCard", "meeza"],
            merchantCapabilities: ["supports3DS", "debit", "credit"],
            // Dynamically set the sub-merchant's name here
            total: {
                label: "sahl",
                amount: 1400
            },
        };

        const session = new window.ApplePaySession(3, paymentRequest);

        session.onvalidatemerchant = async (event) => {
            console.log('on merchant validation');

            try {
                const response = await fetch('/api/applepay/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        validationUrl: event.validationURL,
                        // Pass the name to the backend for the Apple payload
                        displayName: subMerchantName
                    }),
                });

                const merchantSession = await response.json();
                session.completeMerchantValidation(merchantSession);
            } catch (error) {
                session.abort();
            }
        };

        session.onpaymentauthorized = async (event) => {
            try {
                console.log('on payment authorized');

                // IMPORTANT: Pass the subMerchantId to your backend so it knows who gets the money
                const chargeResponse = await fetch('/api/applepay/charge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: event.payment.token,
                        subMerchantId: subMerchantId, // Identify the payee
                        amount: amount
                    }),
                });

                if (chargeResponse.ok) {
                    session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
                } else {
                    session.completePayment(window.ApplePaySession.STATUS_FAILURE);
                }
            } catch (err) {
                session.completePayment(window.ApplePaySession.STATUS_FAILURE);
            }
        };

        session.oncancel = event => {
            console.log('session canceled', event);
        };

        console.log('starting session');

        session.begin();
    };


document.getElementById('apple-pay-btn').addEventListener('click', handlePayment)